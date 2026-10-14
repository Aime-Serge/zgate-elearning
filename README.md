# E-learning platform

Z-GATE Academy Online: the learning platform the website sends learners to. The backend works today (it is the v1 API, carried over); the frontend is a deployable skeleton until the LMS build starts (`docs/platform-v2/03-ELEARNING-PLATFORM.md`).

| Folder      | Package                     | What it is                                                                       |
| ----------- | --------------------------- | -------------------------------------------------------------------------------- |
| `frontend/` | `@zgate/elearning-frontend` | Next.js 16 skeleton: one placeholder page, security headers, `noindex`           |
| `backend/`  | `@zgate/elearning-backend`  | Fastify + Kysely + PostgreSQL API. Also serves the frozen ops portal (`legacy/`) |

## Run it

```bash
cp elearning/.env.example elearning/backend/.env
docker compose -f infra/compose/base.yml -f infra/compose/elearning.yml up
# -> frontend http://localhost:3003, API http://localhost:3000 (GET /api/health, /api/ready)
```

Or on the host, with a Postgres you provide in `DATABASE_URL`:

```bash
pnpm db:migrate
pnpm --filter @zgate/elearning-backend dev
pnpm --filter @zgate/elearning-frontend dev
```

## Boundaries

- Imports only from `shared/`. Never from `website/` or `legacy/` (`pnpm lint:boundaries`).
- Its own database (`zgate_elearning`) and DB user. The schema is changed **only** by `backend/scripts/migrate.mjs` running the forward-only SQL files in `backend/db/migrations/`, locally, in CI and in production alike.
- CI: `.github/workflows/elearning.yml`, triggered by changes under `elearning/`, `shared/` or root config.
- Images, built from the repository root: `docker build -f elearning/backend/Dockerfile .` and `docker build -f elearning/frontend/Dockerfile --build-arg NEXT_PUBLIC_API_URL=… --build-arg NEXT_PUBLIC_SITE_URL=… .` (the frontend refuses to build without both).

## Before it goes live

- The API allows one browser origin (`WEB_ORIGIN`). Today that is the legacy ops portal; switch it to the e-learning frontend once the frontend calls the API.
- Behind Caddy, the API's client-IP handling must trust exactly one proxy hop. See the comment in `infra/proxy/Caddyfile` (`learn.` block).
