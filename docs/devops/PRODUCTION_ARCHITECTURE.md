# Z-GATE Digital Platform — Production Architecture

**Source order, same discipline as every other architecture document in this engagement:** `docs/architecture/DEPLOYMENT_ARCHITECTURE.md` and `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md` are this document's parents, not its competitors — this document operationalizes what they already decided (environments, cost baseline, no-orchestration posture, backup schedule) into the concrete tooling this phase built, and is explicit everywhere it's building on top of an *open* decision rather than a closed one.

**What this phase changed vs. what it inherited:** the environment/cost/topology decisions below are restated from `DEPLOYMENT_ARCHITECTURE.md`, not re-litigated. What's new here is the actual CI/CD, health-check, migration-runner, and Docker tooling this phase built and verified — plus honestly marking the one thing it deliberately did *not* build: an automated deploy to a real target, because no real target is approved yet (see **Cloud** below).

## Environments

| Environment | Purpose | Data rule | Status today |
|---|---|---|---|
| **Development** | Local/individual developer work | Synthetic/seed data only, never real Client data (Data Privacy Policy Annex C) | Live — `docker-compose.yml`, `docs/devops/DEVELOPMENT_ENVIRONMENT.md` |
| **Staging** | Pre-production verification | Same rule — anonymized/synthetic only | Not blocked by ADR-004 (holds no real data) — can be provisioned on any reasonable, cheap infrastructure as soon as one is chosen; not yet provisioned as of this phase, since no infrastructure choice has been made or approved |
| **Production** | Real system | Real data, full backup/monitoring/access-control scope | Blocked — see **Cloud** below; this phase prepares the tooling, it does not provision or deploy to a real production target |

Three environments, matching `DEPLOYMENT_ARCHITECTURE.md`'s stated minimum. The separation is enforced at three independent layers, not just by convention:

1. **Data:** dev/staging never hold real Client data by construction (dev's Postgres container starts empty every time; nothing in this codebase has a code path that copies production data anywhere).
2. **Configuration:** `src/lib/config.ts` validates environment variables per-process, with no defaults that could silently point a misconfigured environment at the wrong database (`DATABASE_URL`, `SESSION_SECRET`, `SESSION_SALT` all fail loudly if unset or malformed — see **Secrets management** below).
3. **Schema:** the same `db/migrations/*.sql` files, applied by the same `scripts/migrate.mjs` runner, in the same order, in every environment — see **Database migration strategy**.

## CI/CD

`.github/workflows/ci.yml`, three jobs:

| Job | Runs on | What it does |
|---|---|---|
| `ci` | every push/PR to `develop`/`main` | Backend: install → lint → typecheck → apply migrations to an ephemeral Postgres service (via `scripts/migrate.mjs` — see below) → test → `npm audit` → gitleaks secrets scan → build |
| `web-ci` | every push/PR to `develop`/`main` | Same shape, for `apps/web`'s independent package |
| `publish-images` | push to `main` only, after `ci` and `web-ci` both pass | Builds both Dockerfiles' `prod` targets and pushes them to GHCR (GitHub Container Registry), tagged with the release commit's SHA and `latest` |

**What `publish-images` is, and isn't:** it makes a reviewed, versioned, immutable image available — it does not deploy it anywhere. No job in this workflow runs the image against staging or production, and none has credentials to do so. This is a deliberate stopping point, not an oversight: automating a deploy to a target that doesn't exist yet (see **Cloud**) would mean either the workflow fails on every run (a real target it can't reach) or fabricating one it can silently no-op against — neither is acceptable. `docs/devops/DEPLOYMENT_RUNBOOK.md` is the manual, approval-gated step that picks up from a published image.

**Why GHCR, not a separate registry:** authenticates with the `GITHUB_TOKEN` every workflow run already receives — no new vendor, no new credential to provision or leak, consistent with the Financial Model's tiny shared tools/hosting budget (`DEPLOYMENT_ARCHITECTURE.md`'s cost baseline).

**Image tagging and rollback:** every image is tagged with `github.sha` — an exact, traceable, immutable reference to the reviewed commit it was built from. `docs/devops/ROLLBACK_RUNBOOK.md` rolls back by redeploying a prior SHA tag, never by rebuilding from source under pressure.

## Secrets management

**The rule that overrides all others, restated because this phase is specifically about production:** never commit a secret, never print one (to a log, a terminal, an error message, or a commit), never expose a production credential outside the minimum set of people/systems that need it, and never point development at production data. Concretely, today:

- `.gitignore` excludes `.env`/`.env.*.local` in both packages; `.env.example` (committed) holds placeholder shapes only, never working values — enforced by its own header comment and by gitleaks' history scan in CI.
- `src/lib/config.ts` validates configuration at startup and **never echoes a secret's value** on failure — only which variable name was invalid (`parseConfig`'s error path), so a misconfigured deploy's logs can't leak a credential.
- Fastify's request logger redacts `Authorization`, `Cookie`, and `X-Api-Key` headers on every request (`src/app.ts`) — a secret can't end up in application logs via that path either.
- CI's only "secret" is a hardcoded, clearly-labeled throwaway (`ci-only-test-session-secret-not-a-real-secret-32chars`) — never a real value, never used outside that ephemeral job.
- GHCR authentication uses the auto-issued `GITHUB_TOKEN`, scoped to that single workflow run, never a long-lived personal token.

**What's still needed once a real host exists (blocked on the same decision as everything else — see Cloud):** production's real `DATABASE_URL`, `SESSION_SECRET`, `SESSION_SALT`, and email-provider API key need somewhere to live that isn't a `.env` file on a server. The proportionate answer at this team's size and budget is the chosen hosting platform's own native secret/environment-variable injection (every mainstream PaaS and most cloud providers offer this for free, as part of the base offering) — **not** a dedicated secrets-manager service, which would be a real recurring cost this budget doesn't currently allocate for and isn't justified by a single-application, single-environment deployment. If the eventual platform choice doesn't offer this, that becomes a documented requirement of the platform choice itself, not a reason to fall back to a plaintext file on disk.

**Rotation:** `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s containment actions already include "rotate a specific credential" as an MD-available action. Concretely: rotating `SESSION_SECRET` invalidates every active session platform-wide (stateless cookies, ADR-005 — there's no partial rotation); rotating `DATABASE_URL`'s password requires updating it in whatever secret store production uses and restarting the app; rotating the email-provider key is whatever that vendor's own rotation flow is. None of this is automated today — proportionate to team size, the same "direct human process, not additional tooling" posture `INCIDENT_RESPONSE_REQUIREMENTS.md` already takes.

## Environment configuration

Single source of truth: `src/lib/config.ts` (backend, zod-validated) and `apps/web`'s `NEXT_PUBLIC_*` variables (frontend — bundled into client JS, so only genuinely public values belong there, `docs/frontend/FRONTEND_SECURITY.md`). Same variable names across all three environments; only values differ:

| Variable | Development | Staging | Production |
|---|---|---|---|
| `NODE_ENV` | `development` | `production` | `production` |
| `DATABASE_URL` | local/Compose Postgres | staging Postgres instance | production Postgres instance — real Client data, full backup/access-control scope |
| `SESSION_SECRET` / `SESSION_SALT` | any valid-shaped local value | a real, randomly generated value, distinct from production's | a real, randomly generated value, distinct from staging's — **never reused across environments** |
| `WEB_ORIGIN` | `http://localhost:3001` | staging frontend's real origin | production frontend's real origin — never a wildcard |
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` | localhost ports | staging's real hostnames | production's real hostnames |
| `EMAIL_PROVIDER_API_KEY` | unset (email send is a no-op in dev — `lib/email.ts`) | a real (or sandboxed) provider key | a real provider key |

No per-environment `.env.production.example` file is added — `.env.example`'s existing placeholder shapes already describe every variable name and format; only the values differ per environment, and the values themselves are exactly what must never be committed anywhere, example file included.

## TLS

Not yet configurable to a specific target, for the same reason as **Cloud** below — TLS termination is a property of whatever edge (load balancer, reverse proxy, or PaaS-managed layer) sits in front of the application, and no such edge exists yet. The requirement, binding regardless of which option ADR-004 resolves to:

- TLS terminated at the network edge, in front of the application server (`docs/security/SECURITY_ARCHITECTURE.md`'s trust-boundary-1 diagram already models this).
- HTTP requests redirected to HTTPS, not served in parallel.
- Certificates issued by a standard automated CA (Let's Encrypt or the hosting platform's own managed-certificate offering) with automatic renewal — no manually-tracked certificate expiry.
- HSTS enabled once a real, stable production domain exists (premature before then — an HSTS header pointing at a domain that might still change, per `docs/architecture/ADR/ADR-004`'s own open domain question carried from `docs/marketing/SEO_STRATEGY.md`, would be actively harmful to set and then need to unset).

## Monitoring, logging, alerting

See `docs/devops/MONITORING.md` for the full picture. Summary: structured application logs already exist (Fastify/pino, `src/app.ts`, with credential redaction built in); `access_log` is the separate, compliance-driven audit trail (`docs/architecture/DATA_ARCHITECTURE.md`) — not to be confused with operational logging; uptime/error monitoring and alerting channel are specified but not yet provisioned, pending the same hosting decision as everything else in this document.

## Backups

See `docs/devops/BACKUP_RECOVERY.md` for the full procedure. Summary: daily full backup + PITR where the eventual host supports it cheaply, 30-day rolling retention, quarterly *tested* restores — operationalizing `DEPLOYMENT_ARCHITECTURE.md`'s already-committed schedule, not a new commitment.

## Health checks

Two distinct endpoints, added this phase (`src/health.ts`, `src/app.ts`):

| Endpoint | Checks | Used for |
|---|---|---|
| `GET /api/health` | The process itself responds — no external dependency | Liveness — "should this process be restarted" |
| `GET /api/ready` | A real `select 1` against the configured database, via the actual connection pool (`lib/db.ts`) — 503 on failure | Readiness — "should traffic be routed here right now" |

Kept distinct deliberately: a database outage should make the app report "not ready" (stop receiving new traffic) without looking "dead" and triggering an unnecessary process restart that wouldn't fix a database problem anyway.

Both production Dockerfiles (`Dockerfile`, `apps/web/Dockerfile`) now declare a `HEALTHCHECK` instruction (backend: `/api/health`; frontend: `/`, since the frontend has no database dependency of its own to probe) — added this phase, using plain Node `fetch` rather than `curl`/`wget` to avoid widening either `-slim` base image's installed surface for a check this small.

**Two real bugs found while manually verifying `/api/ready` against an unreachable database** (this sandbox's own local Postgres, hit with a wrong password to simulate the failure path — the only DB-adjacent verification this environment's persistent Docker-permission issue allows, same constraint noted throughout this engagement):

1. **`await reply.code(503)` deadlocked.** Fastify's `Reply` object is thenable, resolving only once the response is actually sent — which can't happen until the handler returns, which never happens while still awaiting a bare `reply.code()` call with nothing chained after it. `getReadinessStatus()` itself was resolving correctly in milliseconds (confirmed via direct instrumentation); the HTTP response still never arrived, indefinitely. **Fixed** by not awaiting `reply.code(503)` — every other route in this codebase that sets a non-default status code chains `.send(...)` directly onto `.code(...)` (`await reply.code(201).send(payload)`), which returns a real, resolving promise; `/api/ready`'s "set code, then let Fastify auto-send the returned value" pattern was the only place this specific hazard existed, and is now the one place that correctly leaves the call un-awaited instead.
2. **The database connection pool had no `connectionTimeoutMillis`** (`src/lib/db.ts`) — node-postgres's own default is `0`, wait forever. Against a merely-unreachable (as opposed to actively-refusing) database, a query could hang indefinitely instead of failing fast. **Fixed**: `connectionTimeoutMillis: 5000` on the pool — this benefits every database call in the app, not just readiness, since the same unbounded-wait risk applied to every query anywhere in the codebase during a real database outage, which is exactly the moment a fast failure matters most.

Both are regression-tested: `src/health.test.ts` covers `getReadinessStatus()`'s own logic (a throwing accessor, a rejecting query — both return `not_ready` rather than propagating), and `src/app.ready.test.ts` isolates the Fastify reply-lifecycle hazard itself in a throwaway app with no database or shared environment-variable dependency (mutating the process-global `DATABASE_URL` to simulate an unreachable database was tried first and rejected — confirmed, the hard way, to leak into unrelated tests in other files running concurrently in the same Vitest worker).

## Rollback

See `docs/devops/ROLLBACK_RUNBOOK.md`. Summary: application rollback is redeploying a prior SHA-tagged image (images are immutable once published — see CI/CD above); database rollback is forward-only (a new corrective migration, never a down-script — `docs/database/MIGRATION_STRATEGY.md`'s existing principle) except for genuine data loss, which uses the backup/restore procedure instead.

## Deployment strategy

Matches `DEPLOYMENT_ARCHITECTURE.md`'s explicit "no container orchestration platform... a single deployable monolith on a single well-sized instance" posture — at this team size and traffic, a blue/green or canary setup is complexity this platform doesn't need yet, not a corner cut. Concretely, once a target exists: pull the newly published image → run `scripts/migrate.mjs` against the target database → replace the running container with the new one → verify via `/api/health` and `/api/ready` → done. Full sequence in `docs/devops/DEPLOYMENT_RUNBOOK.md`.

## Database migration strategy

`docs/database/MIGRATION_STRATEGY.md` defined the format (plain, forward-only, numbered SQL files, one logical change per file) and explicitly deferred "how these files are actually run in practice" to whenever a backend framework existed to decide it. That's now.

**`scripts/migrate.mjs`** (added this phase): a small, dependency-free (beyond the `pg` package the app already depends on) Node script that:

1. Connects to whatever `DATABASE_URL` points at.
2. Creates a `schema_migrations` tracking table if this is the first run against this database (`filename` primary key, `applied_at` timestamp).
3. Applies only the `db/migrations/*.sql` files not already recorded as applied, in filename order, **each in its own transaction** — a failure partway through one file rolls back cleanly without touching files already recorded as applied, and without ever touching a later file.
4. Records each successfully applied file before moving to the next.

**Why this closes a real gap:** before this phase, CI applied every migration file unconditionally, every run — fine against CI's always-fresh, throwaway ephemeral database, but it would fail outright the second time it ran against a persistent staging/production database (a `CREATE TABLE` on a table that already exists errors). `scripts/migrate.mjs` is now the one mechanism used everywhere — CI's `ci` job runs it against its ephemeral Postgres (so a green CI run is real evidence the runner itself works, not just that the raw SQL is syntactically valid), and the same script, bundled into the production image (`Dockerfile`'s `prod` stage now `COPY`s `scripts/` and `db/migrations/`), is what `docs/devops/DEPLOYMENT_RUNBOOK.md` runs against staging and production.

**What it deliberately doesn't do:** no down-migrations, no dry-run mode, no automatic rollback of a bad schema change — matching `MIGRATION_STRATEGY.md`'s own forward-only principle exactly. A schema mistake is fixed by writing and applying a new corrective migration, reviewed like any other code change.

**One caveat, stated plainly:** any database that already has this schema applied via an *earlier* mechanism (dev's Compose-managed Postgres, via `docker-entrypoint-initdb.d`; or CI's old raw-`psql`-loop, now replaced) has no `schema_migrations` rows yet. Pointing `scripts/migrate.mjs` at one of those without first backfilling that table would try to re-run every `CREATE TABLE` and fail. This is a non-issue for CI (fresh ephemeral database every run) and for dev (Compose's mechanism is intentionally kept separate — see below) — it only matters the first time `scripts/migrate.mjs` is ever pointed at a real staging/production database, which by definition is a brand-new database with nothing applied yet.

**Why dev keeps its own simpler mechanism:** `docker-compose.yml`'s Postgres container still runs every `db/migrations/*.sql` file via the official image's `docker-entrypoint-initdb.d` convention, on first volume creation — proportionate for a disposable, wiped-on-`down -v` local database that never needs incremental tracking. `scripts/migrate.mjs` is the one used for CI, staging, and production, where the database is persistent and incremental application is the actual requirement.

## Security (restated, binding)

Never commit a secret. Never print one. Never expose a production credential beyond the minimum set of systems/people that need it. Never point development at real Client production data. These are not new rules — they're `docs/business/`'s Data Privacy Policy commitments and `docs/security/SECURITY_REQUIREMENTS.md`'s baseline, restated here because this is the phase where they stop being architectural intent and start being the thing a CI pipeline, a Dockerfile, and a runbook actually enforce. Concretely enforced today: gitleaks (CI, commit-history secrets scan), `.gitignore` (never-commit), `config.ts` (never-echo-on-failure), Fastify's redacted request logger (never-print-in-logs), and the fact that dev/staging Postgres containers start empty by construction (never-real-data-in-dev).

## Cloud

**No cloud provider or region is selected.** `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md` remains open, for the same reason it was left open in the architecture phase: the Data Privacy Policy commits to Rwanda-default data residency, Z-GATE's NCSA registration (the prerequisite for either a compliant in-Rwanda posture or a valid offshore-transfer certificate) is still Pending, and no approved document confirms a specific Rwanda-region hyperscaler offering. This document will not assert a provider or region it cannot confirm — doing so would be exactly the fabrication this entire engagement has consistently refused to do.

### If AWS is the eventual choice (ADR-004 option 2) — a readiness evaluation, not a decision

ADR-004 lists "the nearest confirmed-available major cloud region, paired with completing NCSA registration and an offshore-transfer certificate" as one of three options to evaluate, not a recommendation. **This section evaluates what an AWS-based architecture would need to satisfy, at this platform's actual scale, if and when the business chooses that option** — it does not select AWS, provision anything on AWS, or imply AWS has Rwanda presence (it does not, as of this document's knowledge, and this document will not assert otherwise). Evaluated against the AWS Well-Architected Framework's six pillars, scoped honestly to a single-developer team and the Financial Model's tiny shared budget:

| Pillar | What this platform would need | Fit at this scale |
|---|---|---|
| **Operational excellence** | Infrastructure-as-code for whatever's provisioned (even minimal — one EC2 instance or App Runner service, one RDS instance), CI/CD already exists and would extend naturally (this phase's `publish-images` job already produces the artifact an AWS deploy step would consume) | Good fit — this phase's tooling was deliberately built to be deploy-target-agnostic up to the actual deploy step, so it doesn't need to be rebuilt for AWS specifically |
| **Security** | IAM roles scoped per-service (not one shared root credential), Secrets Manager or Parameter Store for the credentials this document's Secrets management section already requires living somewhere real, security groups restricting DB access to the application tier only, TLS via ACM | Good fit, standard AWS patterns — no unusual requirement this platform's small module-boundary/RBAC model (`docs/security/SECURITY_ARCHITECTURE.md`) would strain against |
| **Reliability** | RDS automated backups + PITR (directly satisfies `docs/devops/BACKUP_RECOVERY.md`'s requirement more easily than a self-managed backup script would), a single-AZ instance is honestly sufficient at this traffic level per `DEPLOYMENT_ARCHITECTURE.md`'s own "vertical scaling is correct well past this platform's 12-month trajectory" reasoning — multi-AZ would be premature spend, not a reliability gap worth paying for yet | Good fit for a single-AZ start; multi-AZ is the documented future lever, not a day-one requirement |
| **Performance efficiency** | A small instance size (t-family/App Runner's smallest tier) is correct today — `docs/performance/PERFORMANCE_REPORT.md` already found this platform has no current performance problem to design around, just headroom to grow into | Good fit — right-sizing is easy to get right at this traffic level, the risk is over-provisioning, not under |
| **Cost optimization** | The real constraint: RWF 1,000,000 shared across "Tools & software... hosting" for the *entire* first 90 days (`docs/business/BUSINESS_RULES.md` §8) is a genuinely small budget against AWS's typical starting costs (RDS alone often exceeds a budget this size before compute is even counted) — a managed PaaS or a single self-managed EC2 instance running Postgres in-container may fit this budget meaningfully better than RDS + a separate compute service | **Real tension, not a good fit without care** — AWS is not obviously the cheapest option at this specific budget; this is exactly the kind of tradeoff ADR-004 asks the MD/legal counsel to weigh against option 1 (a Rwandan/regional host) and option 3 (hybrid) |
| **Sustainability** | AWS publishes region-level carbon intensity data and offers Graviton (ARM) instance types with a better performance-per-watt profile than x86 equivalents, at *lower* cost — a rare case where the cost and sustainability pillars point the same direction | Good fit if AWS is chosen — costs nothing extra to pick the more efficient instance family |

**Net assessment, offered as input to the ADR-004 decision, not a substitute for it:** AWS would be a technically sound fit for security, reliability, performance, and sustainability at this platform's scale — the real open question is cost fit against a genuinely tiny budget, and, independent of AWS specifically, whether any AWS region satisfies the Rwanda-residency commitment without a completed NCSA registration and offshore-transfer certificate first. Both are exactly the questions ADR-004 already assigns to the Managing Director and Rwandan legal counsel, not to this document.

## What this document does not do

It does not select a hosting provider, region, or specific monitoring/backup vendor — those remain ADR-004's and the cost-gated procurement decisions' to make. It does not deploy anything to staging or production — see `docs/devops/DEPLOYMENT_RUNBOOK.md`'s explicit release-approval gate. It does not claim live verification of the Docker builds or a real staging/production migration run — this sandbox has had no working Docker socket access for the entire engagement (the same constraint `docs/database/MIGRATION_STRATEGY.md` documented); every change in this phase was verified by lint/typecheck/test/build plus careful manual review, and is flagged here rather than overclaimed, matching this engagement's standing discipline.
