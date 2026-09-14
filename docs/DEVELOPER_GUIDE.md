# Z-GATE Digital Platform — Developer Guide

**Full setup detail lives in `docs/devops/DEVELOPMENT_ENVIRONMENT.md`** — this document is the orientation pass for a new engineer's first day; that one is the reference you'll actually keep open.

## Get running (containerized — the primary path)

```bash
cp .env.example .env
docker compose up
```

- Website: `http://localhost:3001` · API: `http://localhost:3000` (health check: `GET /api/health`) · Postgres: `localhost:5432`

Requires Docker with the `docker compose` plugin. If Docker genuinely isn't available, `docs/devops/DEVELOPMENT_ENVIRONMENT.md`'s host-level fallback works too (`npm ci` + `npm run dev` in both packages, plus a local Postgres). **Note for whoever inherits this:** this engagement's own sandbox never had working Docker socket access for its entire duration — every "tests pass" claim throughout this codebase's history is qualified against that, and DB-dependent tests are written to skip cleanly without a reachable database rather than fail confusingly. Confirm Docker actually works in your environment before assuming the containerized path is friction-free.

## Repository layout

```
.                  Backend — Fastify + Kysely + PostgreSQL
apps/web/          Public website + portal + staff platform — Next.js
db/migrations/     SQL schema, source of truth
scripts/           Deploy-time tooling (migrate.mjs)
docs/              Every phase's approved output — see docs/SYSTEM_OVERVIEW.md
```

## Scripts (identical shape in both packages)

| Command | What it does |
|---|---|
| `npm run dev` | Live-reload dev server |
| `npm run lint` | ESLint, type-aware rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest — DB-dependent tests skip cleanly without `DATABASE_URL`/`SESSION_SECRET`/`SESSION_SALT` set |
| `npm run build` | Backend: compiles to `dist/`. Frontend: `next build` (static generation for every public page) |

**Run all four before every commit.** This has been the standing discipline throughout this engagement, and it's the reason the codebase has stayed in a consistently working state across dozens of sequential phases.

## Conventions that actually matter here

- **One focused commit per concern.** Not "one commit per feature" — a security fix, a doc, and a refactor touching the same area still get separate commits. `git log --oneline` is a genuinely readable history because of this; keep it that way.
- **No fabrication, anywhere.** No invented metric, testimonial, claim, or "TODO: implement later" left silently unimplemented. If something can't be done (no DB access to verify against, a business decision pending), say so in the code comment or commit message rather than working around it silently.
- **Comments explain *why*, not *what*.** Well-named code already says what it does. A comment earns its place only when it captures a non-obvious constraint, a workaround for a specific bug, or a decision a reader would otherwise second-guess.
- **Error handling:** one shared `AppError` taxonomy (`src/lib/errors.ts`) — every route throws it, one Fastify error handler formats every response the same way. Never a raw stack trace or DB error string to the client; always logged server-side with a `correlationId`.
- **Audit logging:** every read or write touching Confidential-classified data calls `logAccess`/`logAccessMany` (`src/lib/audit.ts`) — ideally inside the same transaction as the write it's auditing. **This rule is not universally followed today** — the independent security audit found the CRM leads module missing it entirely. Fix that gap the same way every other module does it, don't invent a second pattern.
- **Authorization:** role checks via `requireRole`, object-level checks via `assertClientDataAccess` — always 404 for "not yours," never 403 (a 403 would leak that the record exists). Reuse these, never write a parallel check.

## Testing

Vitest for both packages; DB-dependent backend tests follow a consistent `canRun` gate pattern (skip cleanly locally, run for real in CI). **Local test runs in a loaded/cold sandbox can show 1-2 spurious timeout failures** in otherwise-passing tests — this is worker-startup contention under `vitest`'s default 5s per-test timeout, not a code defect; re-running (or running with `--testTimeout=20000`) resolves it. The authoritative signal is real CI (GitHub Actions), which has run this exact suite cleanly against live Postgres. No end-to-end/real-browser test suite exists (`docs/qa/DEFECTS.md` G-01) — every functional check is API-level (`app.inject()`) or manual live smoke-testing.

## Before you touch production-adjacent code

Read `docs/SECURITY_GUIDE.md` for what the independent audit actually found unresolved, and `docs/HANDOVER.md`'s Known Limitations before assuming a capability exists. This codebase's own discipline is to verify claims, not repeat them — hold your own changes to the same standard.
