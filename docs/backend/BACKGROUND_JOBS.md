# Z-GATE Digital Platform — Background Jobs

## MVP: zero background jobs, by design

Every MVP operation reviewed against `docs/product/PRODUCT_BACKLOG.md`'s actual feature set is synchronous and request-scoped:

- Marking a compliance item complete: one request, one transaction, done.
- Uploading a deliverable: one request, done.
- Internal reporting: computed live, on request (`docs/architecture/DOMAIN_ARCHITECTURE.md` §7 — no scheduled aggregation job, because there's no stored aggregate to refresh).
- The Client Portal is explicitly pull-based — no scheduled digest, no reminder job (`docs/architecture/DOMAIN_ARCHITECTURE.md` §14).

**No job-queue infrastructure (BullMQ, a cron runner, a message broker) is introduced at MVP.** Adding one now would be infrastructure built for a need that doesn't exist yet — directly against this whole engagement's "avoid premature complexity" discipline, and against `docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s cost-consciousness (a job queue typically wants its own worker process and often a message broker, real added infrastructure cost for zero current jobs to run).

## What would need one, and when

| Future need | Phase | What kind of job |
|---|---|---|
| Proactive Advisory deadline reminders | V1 | A scheduled check ("which compliance items are due soon") triggering a WhatsApp/SMS send (`docs/architecture/INTEGRATION_ARCHITECTURE.md`'s V1 direction) |
| Academy certificate generation | V1 | Possibly synchronous (generate-on-demand when a Trainer marks a pass) rather than a background job at all — worth evaluating at V1 whether this even needs to be async |
| External Data client report generation | V2 | Could be a genuinely long-running job (processing a real dataset) that benefits from being async, unlike anything at MVP |
| Statutory-retention deletion job | Blocked on legal confirmation (`docs/database/DATA_LIFECYCLES.md`) | A scheduled job, once the retention period is confirmed — not built speculatively against a guessed number |

## Recommendation for when the first real job is needed (V1)

**Start with the simplest mechanism that does the job — a single scheduled script (cron, or the hosting platform's equivalent), not a full queue system** — for the same reason MVP itself avoided one: one scheduled reminder-check per day is not a workload that needs a distributed job queue's retry/backoff/worker-pool machinery. **Revisit toward a real queue system only if V2's Data-service report generation demonstrates a genuine need** (e.g., jobs that must survive a server restart mid-run, or need real concurrency control) — not before, and not because a queue system is generally considered best practice for background work in the abstract.

## What this document does not do

It does not select a specific scheduling mechanism or queue library for V1 — that decision is made when V1 notifications are actually being built, informed by whatever the production hosting environment turns out to be (still open, `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md`), not guessed at now.
