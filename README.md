# Z-GATE E-learning Platform

Z-GATE Academy Online: the learning platform the Z-GATE website sends learners to. The website is a **separate product in its own repository**. The API works today (it is the v1 API, carried over); the frontend and the worker are deployable skeletons until the LMS build starts (`docs/03-ELEARNING-PLATFORM.md`). The API is planned to move to Django; see ADR-008.

**This repository is self-contained**: one pnpm workspace with its own lockfile, presets (`config/`), database, deploy files, documentation and CI, plus the frozen v1 operations portal in `legacy/ops` (its own pnpm workspace). It was split out of the z-gate monorepo on 2026-10-19 with its history (`docs/architecture/ADR/ADR-010-separate-repositories.md`).

| Folder                          | Package                           | What it is                                                                                                            |
| ------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `frontend/`                     | `@zgate/elearning-frontend`       | Next.js 16 skeleton: one placeholder page, security headers, `noindex`                                                |
| `backend/`                      | `@zgate/elearning-backend`        | Fastify + Kysely + PostgreSQL API, schema in `db/migrations/`. Also serves the frozen ops portal (`legacy/ops`)       |
| `worker/`                       | `@zgate/elearning-worker`         | Background jobs (skeleton: runner + `/health`); planned jobs in its README                                            |
| `packages/elearning-contracts/` | `@zgate/elearning-contracts`      | What other products rely on: `openapi/v1.yaml` (public catalog API) and Zod schemas (catalog, enroll links)           |
| `config/`                       | `@zgate/config`                   | TypeScript, ESLint and Prettier presets and the schema-compatibility check                                            |
| `tests/contracts/`              | `@zgate/elearning-contract-tests` | Proves e-learning works with the website's contracts                                                                  |
| `vendor/`                       | -                                 | Checksummed snapshots of those contracts (`@zgate/website-contracts`, `@zgate/brand-ui`). Never edited by hand        |
| `e2e/journeys/`                 | `@zgate/elearning-journeys`       | Customer-journey tests across both products (Playwright)                                                              |
| `legacy/ops/`                   | `@zgate/ops` (own workspace)      | The frozen v1 web app: client portal and staff console, on this API. Retired once its screens are rebuilt             |
| `database/`                     | -                                 | Roles SQL, Postgres configs, `backup.sh` / `restore.sh`, backup target (PITR, at most 15 minutes of loss)             |
| `deploy/`                       | -                                 | `compose.yml` (local), `compose.prod.yml` (not deployed yet), `edge/` (Caddy for `learn.`), `env/`, `observability/`  |
| `docs/`                         | -                                 | Scope (`03-ELEARNING-PLATFORM.md`), developer guides, ADRs, the platform-v2 plan, and the v1 platform's documentation |

## Run it (hybrid mode: Postgres in Docker, apps native)

```bash
corepack enable                                    # once; the pnpm version comes from package.json
pnpm install
docker compose -f deploy/compose.yml up -d         # Postgres on localhost:5433
cp deploy/env/dev.env.example backend/.env
pnpm db:migrate                                    # as the owner role
pnpm dev                                           # API :3000, frontend :3003, worker :3005/health
```

Everything in containers instead: `docker compose -f deploy/compose.yml --profile full up` (add `--profile legacy` for the ops portal on :3001). The ops portal natively: `cd legacy/ops && pnpm install && pnpm dev`, with the API running.

**On an 8 GB machine**, read `docs/DEVELOPMENT_LOW_MEMORY.md` first. This repository applies it: hybrid mode by default, a 1.5 GB Node heap ceiling (`.npmrc`), two test workers, ESLint and TypeScript caches, memory caps in Compose (Postgres 256m, API and worker 512m, Next.js 1g), and VS Code watcher limits (`.vscode/settings.json`).

Checks, one package at a time: `pnpm lint:boundaries`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Full orientation: `docs/DEVELOPER_GUIDE.md`.

## Contracts

The e-learning platform and the website live in separate repositories and never import each other's apps. Each **provider owns** its contract package; the other product checks itself against a **snapshot** of it (and, for the brand, may use it in its frontend):

| Contract                              | Owned by   | Package                      | Checked by                                                              |
| ------------------------------------- | ---------- | ---------------------------- | ----------------------------------------------------------------------- |
| Catalog API (`/api/v1`), enroll links | e-learning | `@zgate/elearning-contracts` | website repository, `tests/contracts` (against its `vendor/`)           |
| Lead/waitlist webhook, lead form      | website    | `@zgate/website-contracts`   | this repository, `tests/contracts` (against `vendor/website-contracts`) |
| Brand tokens and components           | website    | `@zgate/brand-ui`            | this repository, `tests/contracts` (against `vendor/brand-ui`)          |

Breaking changes fail before they reach the other product:

1. **Breaking-change checks in the provider.** On every pull request, `oasdiff breaking` compares `packages/elearning-contracts/openapi/v1.yaml` with the base branch's and fails on any breaking change (`/api/v1` accepts additive changes only). `compat/compat.test.ts` fails when a Zod schema removes or renames a field or narrows a type; `compat/openapi.test.ts` keeps OpenAPI and Zod in step. The website repository does the same for its contracts.
2. **Consumer tests on every snapshot update.** A provider change reaches the consumer only through `node scripts/sync-contracts.mjs --from <other checkout>`, in a pull request in the consumer's repository, where its contract tests run against it. CI rejects a hand-edited `vendor/` (`--check`).
3. **Customer journey on staging**: `e2e/journeys`, run by `.github/workflows/journey.yml`. It drives both products; website releases are gated by the website's own checks while this platform is parked, and by this journey again once the website's course buttons link here (website repository, ADR-011).
4. **Production synthetic checks**: the journey's `@readonly` steps every 10 minutes (`.github/workflows/synthetic.yml`), disabled until the production URL variables are set.

**Changing a contract this repository owns:** additive changes only (see `packages/elearning-contracts/README.md`). Once merged, open a pull request in the website repository that syncs the new snapshot, so its contract tests run against it.

## Releases

**No production deploy of either product happens unless the customer-journey workflow (`.github/workflows/journey.yml`) has passed against staging for the versions being deployed.** This platform is **parked** while the website is developed first; website releases are gated by the website's own checks while this platform is parked, and by this journey again once the website's course buttons link here (website repository, ADR-011). Staging doesn't exist yet (hosting decision pending, ADR-004); the journey's unbuilt steps (sign-up, sandbox payment, lesson, certificate, `/verify/[code]`) are `test.fixme` with their reasons until those features ship.

## Boundaries

- The frontend and the worker never import the API's source; the API never imports them; `packages/*` and `config/` never import an app; `@zgate/elearning-contracts` imports no other workspace package. Only `tests/contracts` (contract packages) and the frontend (`@zgate/brand-ui`) use the website's packages; nothing imports `legacy/`. Enforced by `pnpm lint:boundaries` in CI.
- Its own Postgres and database (`zgate_elearning`), roles, volume, env files and edge proxy. Nothing is shared with the website.
- Images, built with the repository root as the context: `docker build -f backend/Dockerfile .`, likewise `worker/`, and `frontend/` with `--build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=…` (it refuses to build without both). CI publishes them as `ghcr.io/<owner>/z-gate-elearning-{backend,frontend,worker}`, and the ops portal as `ghcr.io/<owner>/z-gate-ops`.

## Before it goes live

- The API allows one browser origin (`WEB_ORIGIN`). Today that is the legacy ops portal; switch it to the e-learning frontend once the frontend calls the API.
- Behind its Caddy (`deploy/edge/Caddyfile`), the API's client-IP handling must trust exactly one proxy hop (finding N-1).
- v1's release blockers are still open: `docs/HANDOVER.md`, `docs/SECURITY_GUIDE.md` and `docs/platform-v2/05-SECURITY-COMPLIANCE.md`. Don't treat any part of this repository as production-ready without reading them.
