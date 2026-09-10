# Z-GATE Digital Platform — Development Environment

This repository is two independent packages: the backend (repo root — Fastify + Kysely + PostgreSQL, `docs/backend/`) and the public website (`apps/web/` — Next.js, `docs/frontend/`), each with its own `package.json`, kept separate rather than an npm-workspaces monorepo so neither package's install/build can break the other's (`docs/frontend/FRONTEND_ARCHITECTURE.md`'s structural decision).

## Containerized development (recommended — do this first)

**Development runs in Docker Compose, not directly against the host machine.** `docker-compose.yml` at the repo root runs Postgres, the backend, and the frontend as three isolated containers — no Node version to manage on the host, no global installs, no host-level Postgres service, and no risk of a `node_modules` install on your machine drifting from what the project actually needs. This is the Node/TypeScript-project equivalent of "always develop in a virtual environment," applied at the infrastructure level, not just the package-manager level.

```bash
cp .env.example .env      # fill in real local values - never commit .env
docker compose up
```

- Website: http://localhost:3001
- API: http://localhost:3000 (health check: `GET /api/health`)
- Postgres: `localhost:5432` (`zgate` / `zgate_dev` / `zgate_dev` — a throwaway dev credential, not a real secret, never used outside a local container)

Both the `api` and `web` containers live-reload on source changes (the repo is volume-mounted in; only `node_modules` and build output stay container-local, via anonymous volumes, so the containers' own Linux-built installs are never shadowed by whatever happens to be on the host). Postgres runs every file in `db/migrations/` automatically, in order, the first time its data volume is created (`docker-compose.yml`'s comments) — the same schema-application approach `.github/workflows/ci.yml` already uses.

**Requires:** Docker with the `docker compose` plugin (not the older standalone `docker-compose` binary — check with `docker compose version`) and a user account in the `docker` group (or root). Adding a user to that group requires a fresh login session to take effect, not just a new terminal window.

### Production images

`Dockerfile` and `apps/web/Dockerfile` each have a `prod` build target (multi-stage, minimal runtime image, non-root container user) separate from the `dev` target `docker-compose.yml` uses — not deployed anywhere yet (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s region/hosting decision is still open, ADR-004), but ready for when that's resolved.

## If you genuinely can't use Docker (host-level fallback)

Everything below also works directly on the host and is what CI itself does (`.github/workflows/ci.yml` runs the same npm scripts against a Postgres *service container*, not a full Compose stack) — but the containerized path above is the one to reach for first.

### Why Node/TypeScript isolation, not a Python venv

**This project's language is TypeScript** (`docs/architecture/ADR/ADR-003-typescript.md`) — there is no Python component to isolate with a venv. The Node-equivalent isolation this repository actually uses on the host path:

- **Local `node_modules/`, never global installs.** Every dependency is a `dependency`/`devDependency` in each package's own `package.json`.
- **A committed lockfile per package** (`package-lock.json` at root, and another in `apps/web/`). `npm ci` (not `npm install`) is used in CI and should be preferred locally when you just need exactly what's locked.

### Prerequisites (host path only)

- Node.js 22.x (verified against `v22.22.1`)
- npm (verified against `9.2.0`)
- A local PostgreSQL instance for the backend's DB-dependent tests/dev server (or just use the Docker Compose path above for this piece specifically, even if you run the two Node processes on the host)

### Getting started (host path only)

```bash
# Backend (repo root)
npm ci
cp .env.example .env
npm run dev          # tsx watch --env-file=.env src/server.ts, http://localhost:3000

# Frontend (separate terminal)
cd apps/web
npm ci
cp .env.example .env.local
npm run dev           # next dev -p 3001, http://localhost:3001
```

## Why `tsx`, not Node's native `--experimental-strip-types`

The backend's `dev` script originally used Node's built-in TypeScript-stripping flag directly. **On this project's actual development machine, that failed** (`ERR_NO_TYPESCRIPT`) — the distro-packaged Node binary here wasn't compiled with the `amaro` stripping module the official nodejs.org builds include. Since a dev script that only works on some machines isn't reliable, the backend now uses `tsx` (a small, well-established dev dependency) instead of depending on a Node feature with inconsistent availability across real environments.

## Scripts

Each package (root = backend, `apps/web/` = frontend) has its own copies of these:

| Command | What it does |
|---|---|
| `npm run dev` | Live-reload dev server (backend: `tsx watch`; frontend: `next dev -p 3001`) |
| `npm run lint` | ESLint (type-aware rules on backend `src/`; `eslint-config-next` rules on the frontend) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Runs the Vitest suite once (frontend adds React Testing Library + jsdom) |
| `npm run build` | Backend: compiles to `dist/` via `tsc`. Frontend: `next build` (static generation for every public page — `docs/frontend/ROUTE_MAP.md`) |

Root-only: `npm run format` / `format:write` (Prettier, scoped to code/config, not `docs/**` — see below).

Every script above is verified working end-to-end (not just configured) before being committed — including, as of this pass, actually running both dev servers together and confirming a real cross-origin request from the frontend reaches the backend (`src/app.ts`'s CORS configuration).

## Why `docs/**` is excluded from Prettier

Seven-plus phases of this engagement produced dozens of reviewed, committed markdown documents before any code existed. Running a formatter across all of them as a side effect of an unrelated code commit would violate the "focused commit" discipline this whole project follows. `.prettierignore` excludes `docs/**` and the approved root-level brand/business source files for the same reason. Any *new* documentation this repo's own scripts touch is formatted normally.

## Environment configuration

Each package has its own `.env.example` (root: backend — `DATABASE_URL`, `SESSION_SECRET`, `WEB_ORIGIN` for CORS; `apps/web/`: frontend — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`). **`.env`/`.env.local` are gitignored in both packages and must never be committed.** `NEXT_PUBLIC_*` variables are bundled into client-side JS — only genuinely public values belong there (`docs/frontend/FRONTEND_SECURITY.md`).

**Never point local development at a database containing real Client data.** Already-committed rule (Data Privacy Policy Annex C, restated in `docs/security/DATA_PROTECTION_REQUIREMENTS.md`): dev/staging never hold real Client production data without written consent and anonymization. The Docker Compose Postgres container starts empty every time its volume is recreated — there is no path to real data in it by construction.

## CI pipeline

`.github/workflows/ci.yml`: **Install → Lint → Type Check → (apply `db/migrations/` to an ephemeral Postgres service container) → Test → Security Scan → Build.** The Postgres-service-container approach closes the live-migration-validation gap `docs/database/MIGRATION_STRATEGY.md` and `docs/backend/BACKEND_TESTING.md` originally flagged as blocked by a local Docker-permission issue during those phases — CI gets a clean environment with full Docker access, so it runs the real validation those documents intended. Security Scan: `npm audit` + a `gitleaks` secrets scan across commit history. **No deployment job exists yet**, consistent with `docs/security/SECURITY_TESTING_STRATEGY.md`'s cost-gated, staged approach to production readiness.

## Secrets — the one rule that overrides all others here

Never commit a real secret, anywhere, for any reason. If one is committed by accident, treat it as a security incident per `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` — a rotated credential is required, not just a removed commit.

## Branching & commit convention

One focused commit per project phase on `develop` (`docs(discovery)` through `docs(backend)`, then `chore(devops)`, then implementation commits like `feat(crm)`) — this document is updated in place as the environment evolves rather than superseded by a new file each time.
