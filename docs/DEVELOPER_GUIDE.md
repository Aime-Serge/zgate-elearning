# Z-GATE E-learning Platform — Developer Guide

**Orientation for a new engineer's first day.** Architecture and plans for the current re-platform live in `docs/platform-v2/`; read its `README.md` first. The product split is recorded in `docs/architecture/ADR/ADR-007-separate-product-backends.md`, the self-contained products in `ADR-008-self-contained-products.md`, the independent workspaces in `ADR-009-independent-workspaces.md`, and this repository's split from the website in `ADR-010-separate-repositories.md`. On an 8 GB machine, read `docs/DEVELOPMENT_LOW_MEMORY.md` too.

## Repository layout (two independent pnpm workspaces)

```text
package.json, pnpm-workspace.yaml, pnpm-lock.yaml, .npmrc, .dependency-cruiser.cjs    the e-learning workspace
frontend/  backend/  worker/
  backend/db/migrations/       SQL schema, source of truth (forward-only)
  backend/scripts/migrate.mjs  the only thing that migrates the database
packages/elearning-contracts/  openapi/v1.yaml (public catalog API) + Zod (catalog, enroll links)
config/                        TypeScript/ESLint/Prettier presets + schema-compatibility check
tests/contracts/               proves e-learning works with the website's contracts
vendor/                        checksummed snapshots of those contracts (scripts/sync-contracts.mjs; never edited by hand)
e2e/journeys/                  customer journey across both products (Playwright)
database/                      roles SQL, Postgres configs, backup.sh / restore.sh (PITR target)
deploy/                        compose.yml (dev; --profile full, --profile legacy), compose.prod.yml, edge/ (Caddy), env/, observability/
docs/                          scope, guides, ADRs, platform-v2 plan, and the v1 platform's documentation
scripts/                       dev/migrate helpers, contract snapshot sync, dev image
legacy/ops/                    frozen v1 portal (client portal + staff console, D2): its OWN single-package workspace
.github/workflows/             elearning.yml, legacy.yml, journey.yml (staging), synthetic.yml (production), repository.yml
```

`legacy/ops` is not part of the e-learning workspace: run its commands inside `legacy/ops/`, after its own `pnpm install`. The website (public site and CMS) is a **separate repository**.

Documents written before 2026-10-19 use the monorepo's paths: read `elearning/X` as `X` here, `legacy/ops` as `legacy/ops` here, and `website/X` as the website repository (ADR-010 §7). Older documents use older paths still: `backend/` and `frontend/` (v1), then `apps/learn-api` and `apps/ops`, which became `backend/` and `legacy/ops` here; `shared/contracts` became `packages/elearning-contracts`, `platform/observability` became `deploy/observability`, `platform/scripts` became `scripts/`. The monorepo's last state is its tag `monorepo-final`.

## Boundaries (enforced)

- The frontend and the worker never import the API's source; the API never imports them. `worker/` never imports `backend/` (they share the schema, not code). `packages/*` and `config/` never import an app; `@zgate/elearning-contracts` imports no other workspace package.
- The website is used **only** by `tests/contracts` (`@zgate/website-contracts`, `@zgate/brand-ui`) and the frontend (`@zgate/brand-ui`), through the snapshots in `vendor/`.
- **Nothing** imports from `legacy/`.

`pnpm lint:boundaries` (dependency-cruiser, `.dependency-cruiser.cjs`) checks this, and CI runs it.

## Get running

**Requirements:** Node.js 22.12 or later and corepack (bundled with Node). pnpm itself is pinned by `package.json` (`packageManager`), so don't install it globally. Run `corepack enable` once, or prefix commands with `corepack pnpm`.

**Hybrid mode (the default, and the one for small machines):** Postgres runs in Docker; the apps run natively.

```bash
pnpm install
docker compose -f deploy/compose.yml up -d          # Postgres on localhost:5433
cp deploy/env/dev.env.example backend/.env
pnpm db:migrate
pnpm dev                           # API :3000, frontend :3003, worker :3005/health
```

- The apps connect as the database's least-privilege app role; `pnpm db:migrate` swaps in the owner role from `DATABASE_MIGRATION_URL` (`scripts/migrate.mjs`). Roles, configs and backups: `database/README.md`.
- The frozen ops portal: `cd legacy/ops && pnpm install && pnpm dev` (http://localhost:3001) with the API running.
- **Everything in containers (heavier):** `docker compose -f deploy/compose.yml --profile full up` (add `--profile legacy` for the ops portal). Containers have memory caps (Postgres 256m, Node services 512m, Next.js apps 1g).
- The website's Postgres uses port 5432, so both products can run on one machine; on 8 GB, run one at a time.

## Contracts with the website

- **What e-learning owns:** `@zgate/elearning-contracts`, the public catalog API (`/api/v1`, additive changes only, `oasdiff breaking` in CI) and the enroll-link format. After a change merges, open a pull request in the website repository that runs `node scripts/sync-contracts.mjs --from <e-learning checkout>` there, so its contract tests check the new version.
- **What e-learning consumes:** `@zgate/website-contracts` (lead/waitlist webhook) and `@zgate/brand-ui`, from `vendor/`. To update them: `node scripts/sync-contracts.mjs --from <website checkout>`, `pnpm install`, `pnpm --filter @zgate/elearning-contract-tests test`, then commit `vendor/` in one pull request.
- `node scripts/sync-contracts.mjs --check` (run by CI) fails if `vendor/` was edited by hand.
- **The customer journey** (`e2e/journeys`, `journey.yml`) drives both products against staging and is the release gate for both: the website team runs it here before a website release.

## Commands

| Command | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` | Runs the task in every package, one at a time |
| `pnpm lint:boundaries` | Checks the import boundaries above |
| `pnpm dev` | Starts the API, frontend and worker |
| `pnpm db:migrate` | Migrates the database as its owner role (local) |
| `pnpm --filter <pkg> <script>` | Runs one package's script. CI migrates with `pnpm --filter @zgate/elearning-backend db:migrate` (`DATABASE_URL` as given, with an advisory lock) |
| `pnpm format` / `pnpm format:write` | Prettier check / fix (rules: `config/prettier.json`) |
| `node scripts/sync-contracts.mjs --check` / `--from <path>` | Verifies / updates the website contract snapshots |

**Run lint, typecheck, test and build before every commit.** CI runs exactly these.

## Dependencies and supply chain

- `pnpm-workspace.yaml` (and `legacy/ops/pnpm-workspace.yaml`) refuses any package version published less than **14 days** ago (`minimumReleaseAge`). Security fixes may be exempted (`minimumReleaseAgeExclude`), each with a dated comment and removed once the version is old enough.
- Transitive security fixes the direct dependency hasn't picked up go in `overrides`, each with its reason and removal condition.
- Install scripts only run for packages listed in `onlyBuiltDependencies`.
- Unfixable advisories are accepted explicitly under `auditConfig.ignoreGhsas`, with a reason. CI fails on any other high or critical advisory.

## Conventions that actually matter here

- **One focused commit per concern.** A security fix, a doc and a refactor touching the same area still get separate commits.
- **No fabrication, anywhere.** No invented metric, testimonial or claim, and no silent "TODO". If something can't be done or verified, say so in the code comment or commit message.
- **Comments explain *why*, not *what*.**
- **Error handling:** one shared `AppError` taxonomy (`backend/src/lib/errors.ts`). Never a raw stack trace or DB error string to the client; always logged with a `correlationId`.
- **Audit logging:** every read or write of Confidential data calls `logAccess`/`logAccessMany` (`backend/src/lib/audit.ts`), inside the same transaction as the write where possible.
- **Authorization:** role checks via `requireRole`, object-level checks via `assertClientDataAccess`. Return 404 for "not yours", never 403.

## Testing

Vitest everywhere. DB-dependent API tests run only when `DATABASE_URL`, `SESSION_SECRET` and `SESSION_SALT` are all set: they skip locally without a database and run for real in CI against Postgres (`docs/backend/BACKEND_TESTING.md`). On a cold or busy machine, running every package's tests in parallel can hit Vitest's 5 s timeout; the workspace scripts already run one package at a time, and CI is the authoritative signal.

## Containers

Production Dockerfiles build with **the repository root as the context**: `docker build -f backend/Dockerfile .`, likewise `worker/`. Next.js frontends that inline public URLs (`frontend/`, and `legacy/ops` with `legacy/ops` as its context) need `--build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=…` and refuse to build without them. CI builds and Trivy-scans every image on every pull request, and pushes `ghcr.io/<owner>/z-gate-elearning-*` and `z-gate-ops` only from `main`.

## Before you touch production-adjacent code

Read `docs/SECURITY_GUIDE.md`, `docs/HANDOVER.md` and `docs/platform-v2/05-SECURITY-COMPLIANCE.md` for what is still open.
