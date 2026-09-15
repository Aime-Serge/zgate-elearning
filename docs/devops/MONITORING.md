# Z-GATE Digital Platform — Monitoring, Logging & Alerting

Scope note, restated from `docs/architecture/DEPLOYMENT_ARCHITECTURE.md` because it governs every choice below: this is lightweight, proportionate monitoring for a single-developer team on a genuinely small budget — not a scaled-down enterprise observability stack. A full metrics/tracing/dashboard platform would be real, recurring cost this budget doesn't allocate for, and complexity one person can't maintain alongside actually building the product.

## Three distinct things, kept distinct

It's easy to conflate these; they answer different questions and this platform already keeps them architecturally separate:

| Concern | Question it answers | Where it lives |
|---|---|---|
| **Application logging** | "What did the app do, and did anything break, technically" | Fastify/pino structured logs (`src/app.ts`) |
| **Audit logging** | "Who accessed or changed what Confidential data, and when" — a compliance requirement, not a debugging tool | `access_log` table (`docs/architecture/DATA_ARCHITECTURE.md`) |
| **Uptime/error monitoring** | "Is the system up, reachable, and error-free right now, from the outside" | Not yet provisioned — see below |

Confusing the second for the first would be a real problem: `access_log` is deliberately append-only and specifically about Confidential-data access for the Data Privacy Policy's access-review commitment (`docs/security/SECURITY_ARCHITECTURE.md`) — it is not where you'd look to debug a 500 error, and application logs are not where you'd look to answer "did anyone view this Client's TIN last month."

## Application logging (live today)

- **Mechanism:** Fastify's built-in pino logger, structured JSON, registered in `src/app.ts`.
- **What's captured:** request/response summaries, unhandled errors (with a `correlationId` — `request.id` — attached to every error response and its corresponding log line, so a user-reported problem citing a correlation ID can be traced to the exact log entry, `docs/backend/ERROR_HANDLING.md`), and `AppError`-classified expected failures at `warn` level vs. genuinely unexpected failures at `error` level.
- **Redaction, already built in:** `Authorization`, `Cookie`, and `X-Api-Key` headers are redacted on every log line (`src/app.ts`'s `redact` config) — a credential can't end up in application logs through this path, satisfying this phase's "never print secrets" rule structurally, not just by convention.
- **What's silenced, and why it's safe:** logging is fully disabled only under `VITEST` (test runs) — never in development or production, where full logging is the whole point.
- **Aggregation/retention:** not yet provisioned — see **What's not yet provisioned** below. Today, logs exist only as each running process's stdout, which is enough for local development but not for production (a restarted container loses everything).

## Health/readiness endpoints (live today)

Added this phase (`docs/devops/PRODUCTION_ARCHITECTURE.md`'s Health checks section has the full detail):

- `GET /api/health` — liveness, no dependency, always `{"status":"ok",...}` if the process is up.
- `GET /api/ready` — readiness, a real database connectivity check, 503 on failure.

These are the two endpoints any uptime-monitoring tool (see below) should actually poll — `/api/ready` specifically, since it's the one that reflects whether the app can genuinely serve a request, not just whether the process exists.

## What's not yet provisioned (proportionate, cost-gated, not an oversight)

`docs/architecture/DEPLOYMENT_ARCHITECTURE.md` already deferred a specific vendor choice — this document doesn't pick one either, for the same reason ADR-004 doesn't pick a cloud region: no hosting target exists yet to monitor, and committing to a specific paid tool before there's anything real to point it at would be premature spend. What's required, regardless of which specific tool is eventually chosen:

- **External uptime check:** polls the public site and `/api/ready` from outside the platform's own infrastructure, on a short interval (a few minutes), alerts on sustained failure. Proportionate options at this budget typically have a genuinely free tier for a single small site (the point here is the *requirement*, not endorsing a specific vendor's pricing, which changes independent of this document) — this is explicitly not a recommendation to spend budget, since a free-tier option plausibly already satisfies this requirement at this platform's scale.
- **Error-rate monitoring:** something that turns "the logs contain a spike of `error`-level entries" into a signal a human actually sees, without requiring someone to be tailing logs continuously. At minimum, this could be as simple as the uptime check above also polling `/api/ready` frequently enough that a database-connectivity problem (the most likely real failure mode at this scale) surfaces within minutes; a dedicated error-tracking tool is the fuller answer once budget and real production traffic justify it.
- **Log aggregation:** logs need to survive a container restart and be searchable by `correlationId` for the error-handling contract (`docs/backend/ERROR_HANDLING.md`) to actually be useful in production — whatever the eventual hosting platform's own log-drain/aggregation offering is (most include one at no extra cost) is the proportionate answer, not a dedicated logging SaaS at this scale.

## Alerting

**Channel: direct to the Managing Director, not a ticketing system.** This isn't a placeholder — it's a deliberate match to `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s own already-established channel ("a direct line to the MD (WhatsApp or call)... not a formal ticketing system disproportionate to team size") and `docs/ux/EXPERIENCE_REQUIREMENTS.md` §5's finding that this is the channel this whole platform already treats as primary and trusted. A monitoring alert is exactly the kind of signal that channel needs to carry, once a monitoring tool exists to send one.

**What should alert (once the tooling above is provisioned):**

| Trigger | Why it matters | Response posture |
|---|---|---|
| `/api/ready` fails / stays down past a few consecutive checks | The application can't reach its database — nothing works | Immediate — matches `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s High/Critical response posture depending on cause |
| `/api/health` fails (process itself unreachable) | The process is down entirely | Immediate |
| Sustained error-rate spike | Something is broken even though the process is technically "up" | Urgent investigation, same day |
| A deploy's post-deploy monitoring window (`docs/devops/DEPLOYMENT_RUNBOOK.md` step 8) shows any of the above | Correlates a problem to a specific release, informing the rollback decision (`docs/devops/ROLLBACK_RUNBOOK.md`) | Immediate, feeds directly into the rollback decision |

**What should not alert:** rate-limited/blocked attack attempts with no evidence of success (`docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` already classifies these Low-severity, reviewed at the next regular check-in, not an emergency) — an alerting setup that pages the MD for every blocked brute-force attempt would train them to ignore alerts, which is worse than not alerting at all.

## Dashboards

None are built or needed at this scale. A single-service monolith with the health/readiness endpoints above and structured logs is legible enough for a one-developer team to reason about directly; a dashboard's value is aggregating signal across many services or a large team's shared visibility need, neither of which applies here yet. Revisit if/when `docs/architecture/MODULE_ARCHITECTURE.md`'s documented module-extraction points are ever actually exercised (not built now).

## What this document does not do

It does not name a specific uptime-monitoring, error-tracking, or log-aggregation vendor — deferred to whenever a hosting target exists, same reasoning as `docs/devops/PRODUCTION_ARCHITECTURE.md`'s Cloud section. It does not claim any of the "not yet provisioned" items above are live — they're the requirement, honestly separated from what's actually running today (the application logging and health/readiness endpoints, which are).
