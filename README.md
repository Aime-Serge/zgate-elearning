# E-learning platform

Z-GATE Academy Online: the learning platform the website sends learners to. The API works today (it is the v1 API, carried over); the frontend and the worker are deployable skeletons until the LMS build starts (`docs/03-ELEARNING-PLATFORM.md`). The API is planned to move to Django; see ADR-008.

**This folder is a self-contained workspace**: its own `package.json`, `pnpm-workspace.yaml`, lockfile, `.npmrc`, presets (`config/`), database, deploy files and CI workflow (`.github/workflows/elearning.yml`). Nothing joins it to the website workspace; run every command below **inside `elearning/`**.

| Folder                          | Package                           | What it is                                                                                                         |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `frontend/`                     | `@zgate/elearning-frontend`       | Next.js 16 skeleton: one placeholder page, security headers, `noindex`                                             |
| `backend/`                      | `@zgate/elearning-backend`        | Fastify + Kysely + PostgreSQL API, schema in `db/migrations/`. Also serves the frozen ops portal (`../legacy/ops`) |
| `worker/`                       | `@zgate/elearning-worker`         | Background jobs (skeleton: runner + `/health`); planned jobs in its README                                         |
| `packages/elearning-contracts/` | `@zgate/elearning-contracts`      | What other products rely on: `openapi/v1.yaml` (public catalog API) and Zod schemas (catalog, enroll links)        |
| `config/`                       | `@zgate/config`                   | TypeScript, ESLint and Prettier presets and the schema-compatibility check                                         |
| `tests/contracts/`              | `@zgate/elearning-contract-tests` | Proves e-learning works with the website's contracts                                                               |
| `e2e/journeys/`                 | `@zgate/elearning-journeys`       | Customer-journey tests across both products (Playwright)                                                           |
| `database/`                     | -                                 | Roles SQL, Postgres configs, `backup.sh` / `restore.sh`, backup target (PITR, at most 15 minutes of loss)          |
| `deploy/`                       | -                                 | `compose.yml` (local), `compose.prod.yml` (not deployed yet), `env/` templates, `observability/`                   |
| `docs/`                         | -                                 | Product definition and scope (`03-ELEARNING-PLATFORM.md`)                                                          |

## Run it (hybrid mode: Postgres in Docker, apps native)

```bash
cd elearning
corepack enable                                    # once; the pnpm version comes from package.json
pnpm install
docker compose -f deploy/compose.yml up -d         # Postgres on localhost:5433
cp deploy/env/dev.env.example backend/.env
pnpm db:migrate                                    # as the owner role
pnpm dev                                           # API :3000, frontend :3003, worker :3005/health
```

Everything in containers instead: `docker compose -f deploy/compose.yml --profile full up` (add `--profile legacy` for the ops portal on :3001).

**On an 8 GB machine**, read `../docs/DEVELOPMENT_LOW_MEMORY.md` first, and work on one product at a time. This workspace applies it: hybrid mode by default, a 1.5 GB Node heap ceiling (`.npmrc`), two test workers, ESLint and TypeScript caches, memory caps in Compose (Postgres 256m, API and worker 512m, Next.js 1g), and VS Code watcher limits (`.vscode/settings.json`).

Checks, one package at a time: `pnpm lint:boundaries`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Contracts

The e-learning platform and the website never import each other's apps. Each **provider owns** its contract package; the other product uses it only in its contract tests (and, for the brand, in its frontend):

| Contract                              | Owned by   | Package                                             | Checked by                  |
| ------------------------------------- | ---------- | --------------------------------------------------- | --------------------------- |
| Catalog API (`/api/v1`), enroll links | e-learning | `@zgate/elearning-contracts`                        | `website/tests/contracts`   |
| Lead/waitlist webhook, lead form      | website    | `@zgate/website-contracts` (`website/packages/...`) | `elearning/tests/contracts` |
| Brand tokens and components           | website    | `@zgate/brand-ui` (`website/packages/...`)          | `elearning/tests/contracts` |

Breaking changes fail before they merge:

1. **Breaking-change checks.** On every pull request, `oasdiff breaking` compares `packages/elearning-contracts/openapi/v1.yaml` with `main`'s and fails on any breaking change (`/api/v1` accepts additive changes only). `compat/compat.test.ts` fails when a Zod schema removes or renames a field or narrows a type; `compat/openapi.test.ts` keeps OpenAPI and Zod in step.
2. **Consumer tests in the provider's CI.** A pull request that changes `packages/elearning-contracts` also runs the website's `tests/contracts` against it (`elearning.yml`, job "Consumer contracts"), and the other way round in `website.yml`.
3. **Customer journey on staging**: `e2e/journeys`, run by `.github/workflows/journey.yml`.
4. **Production synthetic checks**: the journey's `@readonly` steps every 10 minutes (`.github/workflows/synthetic.yml`), disabled until the production URL variables are set.

## Releases

**No production deploy of the e-learning platform happens unless the customer-journey workflow (`.github/workflows/journey.yml`) has passed against staging for the version being deployed.** Staging doesn't exist yet (hosting decision pending); the journey's unbuilt steps (sign-up, sandbox payment, lesson, certificate, `/verify/[code]`) are `test.fixme` with their reasons until those features ship.

## Boundaries

- The frontend and the worker never import the API's source; the API never imports them; `packages/*` and `config/` never import an app; `@zgate/elearning-contracts` imports no other workspace package. Nothing imports `../website` except `tests/contracts` (its contract packages only) and the frontend (`@zgate/brand-ui` only); nothing imports `../legacy`. Enforced by `pnpm lint:boundaries` in CI.
- Its own Postgres and database (`zgate_elearning`), roles, volume and env files. Nothing is shared with the website.
- Images, built with this folder as the context: `docker build -f elearning/backend/Dockerfile elearning`, likewise `worker/`, and `frontend/` with `--build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=…` (it refuses to build without both).

## Before it goes live

- The API allows one browser origin (`WEB_ORIGIN`). Today that is the legacy ops portal; switch it to the e-learning frontend once the frontend calls the API.
- Behind Caddy (owned by the website: `../website/deploy/edge/Caddyfile`), the API's client-IP handling must trust exactly one proxy hop (finding N-1).
