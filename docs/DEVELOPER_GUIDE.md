# Z-GATE — Developer Guide

**Orientation for a new engineer's first day.** Architecture and plans for the current re-platform live in `docs/platform-v2/`; read its `README.md` first. The product split is recorded in `docs/architecture/ADR/ADR-007-separate-product-backends.md`, and the self-contained layout below in `ADR-008-self-contained-products.md` next to it. On an 8 GB machine, read `docs/DEVELOPMENT_LOW_MEMORY.md` too.

## Repository layout (pnpm workspace + Turborepo)

```text
website/                 one self-contained product
  frontend/              Next.js public site: reads content from the CMS over REST, no database
  backend/               Payload CMS (headless): admin, REST API, lead intake; migrations in src/migrations
  database/              roles SQL, Postgres configs (prod + small dev), backup.sh / restore.sh
  deploy/                compose.yml (dev: Postgres; apps under --profile full), compose.prod.yml, env/
  docs/                  website design (04-WEBSITE.md) and deploy runbook
elearning/               the other self-contained product, same shape
  frontend/              Next.js: Z-GATE Academy Online (skeleton)
  backend/               Fastify + Kysely + PostgreSQL API (the v1 backend)
    db/migrations/       SQL schema, source of truth (forward-only)
    scripts/migrate.mjs  the only thing that migrates the e-learning database
  worker/                background jobs (skeleton)
  database/  deploy/  docs/
shared/                  the only code both products may use: config/, ui/, contracts/
platform/                the only shared runtime: edge/ (Caddyfile), observability/, scripts/ (dev image, dev/migrate helpers)
legacy/ops/              frozen v1 portal: client portal + staff console (D2), retired later
docs/                    cross-product docs: platform-v2/ (current plan), architecture/, and every earlier phase's output
```

Documents written before 2026-10-15 use older paths: `backend/` and `frontend/` (v1), then `apps/learn-api`, `apps/ops` and `apps/website` (briefly `website/app`). These are now `elearning/backend`, `legacy/ops`, and `website/frontend` + `website/backend`; `infra/` became `platform/` plus each product's `deploy/` and `database/`. The `v1-final` git tag preserves the v1 layout.

## Product boundaries (enforced)

- `website/` and `elearning/` **never import each other**. Both may import only from `shared/`.
- `shared/` imports from no product.
- **Nothing** imports from `legacy/`.
- Inside the website, `website/frontend` imports only `@zgate/website-backend/contracts` from the CMS (HTTP for everything else), and neither the frontend nor the contracts may load Payload at runtime.

`pnpm lint:boundaries` (dependency-cruiser, `.dependency-cruiser.cjs`) checks this, and every CI workflow runs it. `elearning/worker` never imports `elearning/backend` either (they share the schema, not code). Each product has its own Postgres, Compose files and CI workflow; a change under one product doesn't trigger the other's workflow.

## Get running

**Requirements:** Node.js ≥ 22.12 and corepack (bundled with Node). pnpm itself is pinned by the root `package.json` (`packageManager`), so don't install it globally. Run `corepack enable` once, or prefix commands with `corepack pnpm`.

**Hybrid mode (the default, and the one for small machines):** each product's Postgres runs in Docker; its apps run natively. One product at a time.

```bash
pnpm install

# Website: Postgres on localhost:5432
docker compose -f website/deploy/compose.yml up -d
cp website/deploy/env/dev.env.example website/backend/.env
cp website/deploy/env/dev.env.example website/frontend/.env
pnpm db:migrate:website            # as the owner role (DATABASE_MIGRATION_URL)
pnpm --filter @zgate/website-backend seed   # once: the approved copy
pnpm dev:website                   # CMS http://localhost:3004/admin, site http://localhost:3002

# E-learning: Postgres on localhost:5433
docker compose -f elearning/deploy/compose.yml up -d
cp elearning/deploy/env/dev.env.example elearning/backend/.env
pnpm db:migrate:elearning
pnpm dev:elearning                 # API :3000, frontend :3003, worker :3005/health
```

- `pnpm dev:<product>` starts only that product's packages. There is deliberately no command that starts both.
- The apps connect as each database's least-privilege app role; `pnpm db:migrate:<product>` swaps in the owner role from `DATABASE_MIGRATION_URL` (`platform/scripts/migrate.mjs`). Roles, configs and backups: `<product>/database/README.md`.
- The frozen ops portal: `pnpm --filter @zgate/ops dev` (http://localhost:3001) with the e-learning API running.

**Everything in containers (heavier):** add `--profile full` (and `--profile legacy` for the ops portal) to a product's `docker compose` command, or use the root `docker-compose.yml`, which includes both products. Containers have memory caps (Postgres 256m, Node services 512m, Next.js apps 1g).

## Website (`website/frontend` + `website/backend`)

Two apps (ADR-007, second amendment): the **public site** (`website/frontend`, `@zgate/website-frontend`, port 3002) and the **CMS** (`website/backend`, `@zgate/website-backend`, Payload, port 3004). Only the CMS touches the website's database, which is separate from the e-learning one. Copy `website/deploy/env/dev.env.example` to both `website/backend/.env` and `website/frontend/.env`; each app reads only its own variables, and the two shared secrets must match.

| Task | Command (`pnpm --filter @zgate/website-backend …`) |
|---|---|
| Apply migrations | `migrate` |
| Load the approved copy (only creates missing items, never overwrites CMS edits) | `seed` |
| After changing a collection, block or global | `generate:types`, then `migrate:create <name>`, then commit the new files in `src/migrations/` |
| After adding a custom admin component | `generate:importmap` |

- **The schema never auto-syncs** (`push: false`). Every change goes through a reviewed migration file, so dev and production can't drift.
- **Roles:** `editor` saves drafts only; `publisher` can publish and work leads; `admin` has everything plus users and the audit log. The first account is created at `/admin`.
- **How the apps talk** (server to server; the browser never calls the CMS):
  - Content: the frontend reads published documents anonymously over the CMS's REST API (`frontend/src/lib/cms.ts`). It holds no CMS or database credentials.
  - Forms: the frontend posts submissions to `POST /api/lead-intake` with `LEAD_INTAKE_TOKEN` (`backend/src/endpoints/leadIntake.ts`).
  - Cache: on publish the CMS sends an HMAC-signed webhook (`REVALIDATE_SECRET`) to `frontend/src/app/api/revalidate` (`backend/src/hooks/revalidate.ts`).
  - Shared types and schemas live in `backend/src/contracts/`, the only CMS code the frontend may import.
- **Rendering:** no public page is built at `next build`, so neither image needs the CMS or a database at build time. Pages render on first visit, stay cached, and refresh automatically when content is published (the webhook above).
- **Leads** can't be created over the REST API (only through token-guarded lead intake), and every staff read is audit-logged.
- **Forms (contact, course waitlist)** submit through one server action (`frontend/src/app/(site)/actions.ts`) and work without JavaScript. **They don't appear until a privacy notice page (slug `privacy`) is published.** Until then, pages show phone, WhatsApp and email instead, so no personal data is collected without a notice.
- **Form rate limiting** trusts `X-Forwarded-For` only as far as `TRUSTED_PROXIES` allows (default 1, meaning behind Caddy). Set it to match the real proxy chain, or visitors can spoof their address.
- **Two hostnames in production, one per app.** The public site (`SITE_URL`, e.g. `www.`) has no `/admin` or CMS API at all. The CMS (`ADMIN_URL`, e.g. `cms.`) serves only `/admin`, `/api` and its own `robots.txt` (`backend/src/lib/hosts.ts`). This keeps the CMS login cookie away from the public pages' origin.
- **Browser checks** (`pnpm --filter @zgate/website-frontend e2e`, Playwright) cover WCAG A/AA via axe, CSP and public/CMS separation, the forms through lead intake, and a JavaScript weight budget. They need both production builds running (`build`, then `start`, in each package) plus `DATABASE_URL`, and `E2E_ADMIN_URL=http://localhost:3004`. Run `pnpm --filter @zgate/website-frontend exec playwright install chromium` once beforehand.
- **Deploying:** see `website/docs/WEBSITE_DEPLOY.md`.
- **All public URLs go through `frontend/src/app/(site)/[[...slug]]`** (router: `frontend/src/lib/routes.ts`). Don't add plain routes such as `app/(site)/foo/page.tsx` for CMS content: Next would prerender them at build time, and the build would need the CMS.

## Commands (run from the repo root)

| Command | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` | Runs the task in every package through Turborepo (cached; only what changed) |
| `pnpm lint:boundaries` | Checks the product import boundaries above |
| `pnpm dev:website` / `pnpm dev:elearning` | Starts one product's dev servers (never both) |
| `pnpm db:migrate:website` / `pnpm db:migrate:elearning` | Migrates one product's database as its owner role (local) |
| `pnpm --filter <pkg> <script>` | Runs one package's script, e.g. `pnpm --filter @zgate/ops dev` |
| `pnpm db:migrate` | Applies pending e-learning migrations to `DATABASE_URL` as given (CI; takes an advisory lock) |
| `pnpm format` / `pnpm format:write` | Prettier check / fix (rules: `shared/config/prettier.json`) |

**Run lint, typecheck, test and build before every commit.** CI runs exactly these.

**Windows note:** Turborepo's Windows binary needs the Microsoft Visual C++ Redistributable (x64). Without it, `pnpm lint` and friends exit with `0xC0000135`. Install the redistributable, or run tasks with `pnpm -r --workspace-concurrency=1 run <task>`, which doesn't need Turbo.

## Dependencies and supply chain

- `pnpm-workspace.yaml` refuses any package version published less than **14 days** ago (`minimumReleaseAge`). Security fixes may be exempted (`minimumReleaseAgeExclude`), each with a dated comment and removed once the version is old enough.
- Transitive security fixes the direct dependency hasn't picked up go in `overrides`, each with its reason and removal condition.
- Install scripts only run for packages listed in `onlyBuiltDependencies`.
- Unfixable advisories are accepted explicitly under `auditConfig.ignoreGhsas`, with a reason. CI fails on any other high or critical advisory.

## Conventions that actually matter here

- **One focused commit per concern.** A security fix, a doc and a refactor touching the same area still get separate commits.
- **No fabrication, anywhere.** No invented metric, testimonial or claim, and no silent "TODO". If something can't be done or verified, say so in the code comment or commit message.
- **Comments explain *why*, not *what*.**
- **Error handling:** one shared `AppError` taxonomy (`elearning/backend/src/lib/errors.ts`). Never a raw stack trace or DB error string to the client; always logged with a `correlationId`.
- **Audit logging:** every read or write of Confidential data calls `logAccess`/`logAccessMany` (`elearning/backend/src/lib/audit.ts`), inside the same transaction as the write where possible.
- **Authorization:** role checks via `requireRole`, object-level checks via `assertClientDataAccess`. Return 404 for "not yours", never 403.

## Testing

Vitest everywhere. DB-dependent e-learning API tests run only when `DATABASE_URL`, `SESSION_SECRET` and `SESSION_SALT` are all set: they skip locally without a database and run for real in CI against Postgres. The website CMS's integration tests likewise need `DATABASE_URL` and `PAYLOAD_SECRET`. On a cold or busy machine, running every package's tests in parallel can hit Vitest's 5 s timeout. Use `--workspace-concurrency=1` locally; CI is the authoritative signal.

## Containers

Production Dockerfiles build from the **repository root**: `docker build -f <product>/<app>/Dockerfile .`. Next.js frontends that inline public URLs (`legacy/ops`, `elearning/frontend`) need `--build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=…` and refuse to build without them. The two website images take no build arguments: they read everything at runtime. CI builds and Trivy-scans every image on every PR, and pushes to GHCR only from `main`.

## Before you touch production-adjacent code

Read `docs/SECURITY_GUIDE.md` and `docs/platform-v2/05-SECURITY-COMPLIANCE.md` for what is still open.
