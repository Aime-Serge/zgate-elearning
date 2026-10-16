# Z-GATE — Developer Guide

**Orientation for a new engineer's first day.** Architecture and plans for the current re-platform live in `docs/platform-v2/`; read its `README.md` first. The product split is recorded in `docs/architecture/ADR/ADR-007-separate-product-backends.md`, the self-contained products in `ADR-008-self-contained-products.md`, and the independent workspaces below in `ADR-009-independent-workspaces.md`. On an 8 GB machine, read `docs/DEVELOPMENT_LOW_MEMORY.md` too.

## Repository layout (three independent pnpm workspaces)

```text
website/                 one self-contained product AND its own pnpm workspace
  package.json, pnpm-workspace.yaml, pnpm-lock.yaml, .npmrc, .dependency-cruiser.cjs
  frontend/              Next.js public site: reads content from the CMS over REST, no database
  backend/               Payload CMS (headless): admin, REST API, lead intake; migrations in src/migrations
  packages/              website-contracts (lead webhook schemas), brand-ui (tokens), cms-contracts (website-only)
  config/                TypeScript/ESLint/Prettier presets + schema-compatibility check
  tests/contracts/       proves the website works with e-learning's contract
  database/              roles SQL, Postgres configs (prod + small dev), backup.sh / restore.sh
  deploy/                compose.yml (dev: Postgres; apps under --profile full), compose.prod.yml,
                         edge/ (Caddy, for both products), env/
  docs/  scripts/        website design and deploy runbook; dev/migrate helpers and dev image
elearning/               the other product and workspace, same shape
  frontend/  backend/  worker/
    backend/db/migrations/       SQL schema, source of truth (forward-only)
    backend/scripts/migrate.mjs  the only thing that migrates the e-learning database
  packages/elearning-contracts/  openapi/v1.yaml (public catalog API) + Zod (catalog, enroll links)
  config/  tests/contracts/  e2e/journeys/  database/  deploy/  docs/  scripts/
legacy/ops/              frozen v1 portal (client portal + staff console, D2), its own single-package workspace
docs/                    cross-product docs: platform-v2/ (current plan), architecture/ (ADRs), every earlier phase
.github/workflows/       website.yml, elearning.yml, legacy.yml (one per workspace), repository.yml (secrets scan),
                         journey.yml (customer journey on staging), synthetic.yml (production read-only checks)
```

There is **no root workspace**: no root `package.json`, lockfile or Turborepo. Run every command inside `website/`, `elearning/` or `legacy/ops/`.

Documents written before 2026-10-15 use older paths: `backend/` and `frontend/` (v1), then `apps/learn-api`, `apps/ops` and `apps/website` (briefly `website/app`). These are now `elearning/backend`, `legacy/ops`, and `website/frontend` + `website/backend`. `infra/` became `platform/` plus each product's `deploy/` and `database/`. On 2026-10-16, `shared/` and `platform/` moved into the products: `shared/ui` to `website/packages/brand-ui`, `shared/contracts` to `elearning/packages/elearning-contracts`, `shared/config` to each product's `config/`, `platform/edge` to `website/deploy/edge`, `platform/scripts` to each product's `scripts/`. The `v1-final` git tag preserves the v1 layout.

## Product boundaries (enforced)

- `website/` and `elearning/` **never import each other's apps**. Each owns a contract package the other uses **only in its `tests/contracts`** (installed as a `file:` dependency): `@zgate/website-contracts` and `@zgate/brand-ui` (website), `@zgate/elearning-contracts` (e-learning). The e-learning frontend may also use `@zgate/brand-ui`.
- **Nothing** imports from `legacy/`.
- Inside each workspace: frontends never import backends; `packages/*` and `config/` never import an app; the website frontend uses `@zgate/cms-contracts` instead of the CMS's source and never loads Payload at runtime; `elearning/worker` never imports `elearning/backend` (they share the schema, not code).

Each workspace's `pnpm lint:boundaries` (dependency-cruiser, its own `.dependency-cruiser.cjs`) checks this, and its CI workflow runs it. Each product has its own Postgres, Compose files and CI workflow. A change under one product doesn't trigger the other's workflow, except that a pull request changing a contract package also runs the other product's contract tests ("Consumer contracts").

## Get running

**Requirements:** Node.js 22.12 or later and corepack (bundled with Node). pnpm itself is pinned by each workspace's `package.json` (`packageManager`), so don't install it globally. Run `corepack enable` once, or prefix commands with `corepack pnpm`.

**Hybrid mode (the default, and the one for small machines):** each product's Postgres runs in Docker; its apps run natively. One product at a time.

```bash
# Website: Postgres on localhost:5432
cd website
pnpm install
docker compose -f deploy/compose.yml up -d
cp deploy/env/dev.env.example backend/.env
cp deploy/env/dev.env.example frontend/.env
pnpm db:migrate                    # as the owner role (DATABASE_MIGRATION_URL)
pnpm --filter @zgate/website-backend seed   # once: the approved copy
pnpm dev                           # CMS http://localhost:3004/admin, site http://localhost:3002

# E-learning: Postgres on localhost:5433
cd ../elearning
pnpm install
docker compose -f deploy/compose.yml up -d
cp deploy/env/dev.env.example backend/.env
pnpm db:migrate
pnpm dev                           # API :3000, frontend :3003, worker :3005/health
```

- `pnpm dev` starts only that workspace's apps. There is deliberately no command that starts both products.
- The apps connect as each database's least-privilege app role; `pnpm db:migrate` swaps in the owner role from `DATABASE_MIGRATION_URL` (`scripts/migrate.mjs`). Roles, configs and backups: `<product>/database/README.md`.
- The frozen ops portal: `cd legacy/ops && pnpm install && pnpm dev` (http://localhost:3001) with the e-learning API running.

**Everything in containers (heavier):** add `--profile full` (and `--profile legacy` for the ops portal) to a product's `docker compose` command, or use the root `docker-compose.yml`, which includes both products' Compose files. Containers have memory caps (Postgres 256m, Node services 512m, Next.js apps 1g).

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
  - Shared types and schemas live in `packages/cms-contracts` (content types, webhook signing) and `packages/website-contracts` (lead form and webhook); the frontend never imports the CMS itself.
- **Rendering:** no public page is built at `next build`, so neither image needs the CMS or a database at build time. Pages render on first visit, stay cached, and refresh automatically when content is published (the webhook above).
- **Leads** can't be created over the REST API (only through token-guarded lead intake), and every staff read is audit-logged.
- **Forms (contact, course waitlist)** submit through one server action (`frontend/src/app/(site)/actions.ts`) and work without JavaScript. **They don't appear until a privacy notice page (slug `privacy`) is published.** Until then, pages show phone, WhatsApp and email instead, so no personal data is collected without a notice.
- **Form rate limiting** trusts `X-Forwarded-For` only as far as `TRUSTED_PROXIES` allows (default 1, meaning behind Caddy). Set it to match the real proxy chain, or visitors can spoof their address.
- **Two hostnames in production, one per app.** The public site (`SITE_URL`, e.g. `www.`) has no `/admin` or CMS API at all. The CMS (`ADMIN_URL`, e.g. `cms.`) serves only `/admin`, `/api` and its own `robots.txt` (`backend/src/lib/hosts.ts`). This keeps the CMS login cookie away from the public pages' origin.
- **Browser checks** (`pnpm --filter @zgate/website-frontend e2e`, Playwright) cover WCAG A/AA via axe, CSP and public/CMS separation, the forms through lead intake, and a JavaScript weight budget. They need both production builds running (`build`, then `start`, in each package) plus `DATABASE_URL`, and `E2E_ADMIN_URL=http://localhost:3004`. Run `pnpm --filter @zgate/website-frontend exec playwright install chromium` once beforehand.
- **Deploying:** see `website/docs/WEBSITE_DEPLOY.md`.
- **All public URLs go through `frontend/src/app/(site)/[[...slug]]`** (router: `frontend/src/lib/routes.ts`). Don't add plain routes such as `app/(site)/foo/page.tsx` for CMS content: Next would prerender them at build time, and the build would need the CMS.

## Commands (run inside a workspace: `website/`, `elearning/` or `legacy/ops/`)

| Command | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` | Runs the task in every package of the workspace, one at a time |
| `pnpm lint:boundaries` | Checks the import boundaries above (website, e-learning) |
| `pnpm dev` | Starts the workspace's dev servers |
| `pnpm db:migrate` | Migrates the workspace's database as its owner role (local) |
| `pnpm --filter <pkg> <script>` | Runs one package's script. CI migrates e-learning with `pnpm --filter @zgate/elearning-backend db:migrate` (`DATABASE_URL` as given, with an advisory lock) |
| `pnpm format` / `pnpm format:write` | Prettier check / fix (rules: `config/prettier.json`) |

**Run lint, typecheck, test and build before every commit.** CI runs exactly these.

## Dependencies and supply chain

- Each workspace's `pnpm-workspace.yaml` refuses any package version published less than **14 days** ago (`minimumReleaseAge`). Security fixes may be exempted (`minimumReleaseAgeExclude`), each with a dated comment and removed once the version is old enough.
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

Production Dockerfiles build with **their workspace as the context**: `docker build -f <workspace>/<app>/Dockerfile <workspace>`, for example `docker build -f website/frontend/Dockerfile website`. Next.js frontends that inline public URLs (`legacy/ops`, `elearning/frontend`) need `--build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=…` and refuse to build without them. The two website images take no build arguments: they read everything at runtime. CI builds and Trivy-scans every image on every PR, and pushes to GHCR only from `main`.

## Before you touch production-adjacent code

Read `docs/SECURITY_GUIDE.md` and `docs/platform-v2/05-SECURITY-COMPLIANCE.md` for what is still open.
