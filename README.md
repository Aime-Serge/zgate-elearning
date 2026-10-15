# E-learning platform

Z-GATE Academy Online: the learning platform the website sends learners to. The API works today (it is the v1 API, carried over); the frontend and the worker are deployable skeletons until the LMS build starts (`elearning/docs/03-ELEARNING-PLATFORM.md`). The API is planned to move to Django; see ADR-008.

| Folder      | Package / content           | What it is                                                                                                            |
| ----------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `frontend/` | `@zgate/elearning-frontend` | Next.js 16 skeleton: one placeholder page, security headers, `noindex`                                                |
| `backend/`  | `@zgate/elearning-backend`  | Fastify + Kysely + PostgreSQL API, with the schema in `db/migrations/`. Also serves the frozen ops portal (`legacy/`) |
| `worker/`   | `@zgate/elearning-worker`   | Background jobs (skeleton: runner + `/health`); planned jobs in its README                                            |
| `database/` | -                           | Roles SQL, Postgres configs, `backup.sh` / `restore.sh`, backup target (PITR, at most 15 minutes of loss)             |
| `deploy/`   | -                           | `compose.yml` (local), `compose.prod.yml` (not deployed yet), `env/` templates                                        |
| `docs/`     | -                           | Product definition and scope (`03-ELEARNING-PLATFORM.md`)                                                             |

## Run it (hybrid mode: Postgres in Docker, apps native)

```bash
docker compose -f elearning/deploy/compose.yml up -d    # Postgres on localhost:5433
cp elearning/deploy/env/dev.env.example elearning/backend/.env
pnpm db:migrate:elearning                               # as the owner role
pnpm dev:elearning                                      # API :3000, frontend :3003, worker :3005/health
```

Everything in containers instead: `docker compose -f elearning/deploy/compose.yml --profile full up` (add `--profile legacy` for the ops portal on :3001).

## Boundaries

- Imports only from `shared/`. Never from `website/` or `legacy/` (`pnpm lint:boundaries`). The worker never imports the API's code.
- Its own Postgres and database (`zgate_elearning`). The schema is changed **only** by `backend/scripts/migrate.mjs` running the forward-only SQL files in `backend/db/migrations/`, locally, in CI and in production alike.
- CI: `.github/workflows/elearning.yml`, triggered by changes under `elearning/`, `shared/`, `platform/` or root config.
- Images, built from the repository root: `docker build -f elearning/backend/Dockerfile .`, `docker build -f elearning/worker/Dockerfile .` and `docker build -f elearning/frontend/Dockerfile --build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=… .` (the frontend refuses to build without both).

## Before it goes live

- The API allows one browser origin (`WEB_ORIGIN`). Today that is the legacy ops portal; switch it to the e-learning frontend once the frontend calls the API.
- Behind Caddy, the API's client-IP handling must trust exactly one proxy hop. See the comment in `platform/edge/Caddyfile` (`learn.` block).
