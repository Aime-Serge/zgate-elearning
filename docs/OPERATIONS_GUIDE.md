# Z-GATE Digital Platform — Operations Guide

**Full depth: `docs/devops/PRODUCTION_ARCHITECTURE.md`, `DEPLOYMENT_RUNBOOK.md`, `ROLLBACK_RUNBOOK.md`, `MONITORING.md`.** This is the day-to-day operator's summary.

## Environments

| Environment | Status |
|---|---|
| Development | Live — `docker-compose.yml`, synthetic data only |
| Staging | Not provisioned — not blocked on anything (holds no real data, so ADR-004's data-residency question doesn't apply), simply not yet stood up |
| Production | Not provisioned — blocked on `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md` (hosting region), NCSA registration, and DPO designation |

## Health checks

- `GET /api/health` — liveness, no dependency, always `{"status":"ok"}` if the process is up.
- `GET /api/ready` — readiness, a real database `select 1`, 503 on failure. Point any load balancer/orchestrator health probe at this one, not `/api/health` — a database outage should stop new traffic without triggering an unnecessary process restart.

Both production Docker images declare a `HEALTHCHECK` instruction hitting these directly. Both endpoints were hardened during the release-candidate phase after a real deadlock bug was found and fixed live (`await reply.code(503)` with nothing chained after it hung indefinitely — see `git log` for commit `eb2a328`) and a missing database connection timeout was added (`2dfa4d5`).

## Deployment

Single-instance replace, not blue/green — proportionate to current team size and traffic (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`). Full procedure: `docs/devops/DEPLOYMENT_RUNBOOK.md`. Summary: CI publishes SHA-tagged images to GHCR on push to `main` → pull the image → run `scripts/migrate.mjs` against the target database → replace the running container → verify `/api/health` and `/api/ready` → smoke test → monitor for 15-30 minutes. **No deployment to production has ever happened** — every verification to date is local or CI-only.

## Rollback

`docs/devops/ROLLBACK_RUNBOOK.md`. Application: redeploy the previous SHA-tagged image (images are immutable once published). Database: forward-only — a new corrective migration, never a down-script; a genuine data-loss event goes to the backup restore procedure instead (`docs/BACKUP_RECOVERY.md`).

## Monitoring & logging

Structured JSON logs (Fastify/pino) with credential redaction built in, live today. External uptime monitoring, error-rate alerting, and log aggregation are **not provisioned** — deliberately deferred pending a real hosting target, not an oversight (`docs/devops/MONITORING.md`). `access_log` is a separate, compliance-driven audit trail — do not confuse it with operational logging; see `docs/SECURITY_GUIDE.md` for its current, real gaps.

## CI/CD

`.github/workflows/ci.yml`: three jobs — `ci` (backend), `web-ci` (frontend), `publish-images` (GHCR, `main` only, artifact publishing, never an automated deploy). **This is now real** — as of the release-candidate phase, a GitHub repository exists (`github.com/Aime-Serge/z-gate`) and CI has genuinely run against real GitHub Actions infrastructure, not just been verified locally. That first real run caught two genuine test bugs that had never been exercised before (see `docs/release/RELEASE_CHECKLIST.md`'s Update section) — a concrete demonstration of why local-only verification was never a full substitute for this.

## Secrets

Never committed, never printed, never echoed on a config error (only the invalid variable *name* is logged, never its value). `.env.example` documents every variable's shape with placeholder values only. Production secrets have nowhere to live yet, because production doesn't exist yet — the plan (whichever hosting platform's native secret injection, once chosen) is in `docs/devops/PRODUCTION_ARCHITECTURE.md`.
