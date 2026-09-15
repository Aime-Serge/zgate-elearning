# Z-GATE Digital Platform — Backup & Recovery

Operationalizes an already-committed rule, restated here rather than reinvented: "Backups are taken on a schedule appropriate to each system's criticality and tested periodically for restorability" (Data Privacy Policy §7, `docs/business/BUSINESS_RULES.md` §4, `docs/architecture/DEPLOYMENT_ARCHITECTURE.md`). **Why this matters more than usual for this specific platform:** the Advisory module's `compliance_items` and `deliverables` tables (`docs/architecture/DATA_ARCHITECTURE.md`) are the digital record of a client's statutory tax filings. Losing this data isn't just a technical incident — it's a real compliance-evidence loss with legal consequences for a Client's tax history, not just an inconvenience to Z-GATE.

## What's backed up

| System | Contents | Criticality |
|---|---|---|
| PostgreSQL (production) | Every table — `users`, `clients`, `leads`, `engagements`, `compliance_items`, `deliverables`, `access_log`, Academy tables, `password_reset_tokens`, `schema_migrations` | Highest — this is the system of record for everything the platform does, including the compliance data noted above |
| File/document storage | Uploaded deliverables (`DELIVERABLES_STORAGE_DIR` — currently server-local disk, pending ADR-004's resolution of where "server" actually is) | High — a deliverable's metadata lives in Postgres, but the file itself lives here; losing this while keeping the DB row leaves a broken reference to a document a Client may need for a filing |

**Not backed up, and correctly so:** development and staging databases hold no real Client data by construction (`docs/devops/PRODUCTION_ARCHITECTURE.md`'s environment rules) — there is nothing in them worth a compliance-grade backup commitment. `access_log`'s compliance requirement is about integrity/append-only-ness while live (`docs/architecture/DATA_ARCHITECTURE.md`), not a separate backup regime from the rest of the database.

## Schedule and retention

| System | Schedule | Retention | Restore testing |
|---|---|---|---|
| PostgreSQL (production) | Automated daily full backup, plus continuous/point-in-time recovery (PITR) if the eventual hosting choice supports it without significant added cost | 30 days rolling, minimum | **Quarterly test restore to a non-production environment** — see below |
| File/document storage | Daily | 30 days rolling | Same quarterly cadence, verified alongside the database restore (a deliverable's DB row and its file need to be restored to the *same* point in time to stay consistent) |
| Immediately before any production deploy | One extra, ad hoc backup, in addition to the daily schedule (`docs/devops/DEPLOYMENT_RUNBOOK.md`'s production step 4) | Kept at least until that deploy is confirmed stable (past the monitoring window in `DEPLOYMENT_RUNBOOK.md`'s step 8) | Not separately tested — it exists specifically as the fastest possible rollback point for that one deploy |

**Mechanism is not yet chosen** — same reason as everywhere else in this phase's documents: no production hosting target exists yet (`docs/architecture/ADR/ADR-004-data-residency-hosting-region.md`). Concretely, once a target is chosen, this table's schedule is satisfied by whichever of the following fits that target:

- A managed Postgres offering's built-in automated-backup + PITR feature (the cheapest, lowest-effort option wherever available — this is the default assumption, not a self-managed `pg_dump` cron job, unless the chosen host is unmanaged/self-hosted Postgres specifically).
- If self-hosted: a scheduled `pg_dump` (or `pg_basebackup` for PITR) to storage separate from the primary database instance — never backups living on the same disk/instance as the data they protect, which protects against nothing.

## Where backups are stored — gated on the same open decision

**This is not a separate decision from ADR-004 — it's the same one.** A backup of real Client personal/financial data is itself a copy of that data, and inherits the exact same Rwanda-data-residency commitment (Data Privacy Policy, Law N° 058/2021) as the primary database. A backup stored outside Rwanda without a completed NCSA offshore-transfer certificate would be a compliance gap of exactly the kind ADR-004 exists to prevent — this document will not pick a backup storage location independent of where ADR-004 resolves the primary data's location, since doing so could silently create a residency violation in the backup path even if the primary system fully complies.

**Requirement, regardless of where ADR-004 lands:** backup storage must be genuinely separate from the primary database's storage (a different disk, instance, or service — not a snapshot sitting next to the data it protects) and must satisfy whatever residency posture the primary system satisfies.

## Restore procedure

1. Provision a target Postgres instance — for a *test* restore, this must be a non-production environment (never restore real Client data into a shared staging environment other developers/testers can see, per the dev/staging data rule); for a *real* recovery, this is a fresh production instance or the repaired original.
2. Restore the most recent backup (or, for PITR, the specific point in time needed — see **When to restore to a specific point in time** below) using whatever mechanism the chosen backup method provides (managed-service restore flow, or `pg_restore`/`pg_basebackup` replay for a self-managed setup).
3. **Do not point the application at the restored database yet.** First, verify the restore independently:
   - Row counts on a few key tables look plausible (not zero, not obviously truncated).
   - A known compliance-critical record (pick one `compliance_items` row, check it exists with the expected data) is present and correct.
   - `schema_migrations` reflects the expected set of applied migrations for that point in time.
4. Run `scripts/migrate.mjs` against the restored database — if backups run alongside a code deploy that also shipped new migrations, the restored data may be behind the currently-running application's expected schema; this brings it current, using the exact same idempotent runner as every other environment (`docs/devops/PRODUCTION_ARCHITECTURE.md`'s migration strategy section).
5. Only then, point the application at the restored database (update `DATABASE_URL` in the target environment's secret store) and verify via `/api/health` / `/api/ready` and a smoke test, exactly as in `docs/devops/DEPLOYMENT_RUNBOOK.md`.
6. If file/document storage was also restored, spot-check that a `deliverables` row's referenced file actually exists at the restored path, for at least one real record.

## When to restore to a specific point in time (PITR), vs. the latest daily backup

Use PITR (if the eventual host supports it) when the goal is "undo the last N hours/minutes, keep everything before that" — e.g., recovering from a bad migration or a data-corrupting bug caught quickly. Use the latest full daily backup when PITR isn't available, or when the goal is simply disaster recovery from total data loss (the primary instance is gone, not just wrong). A restore to any point loses every write made after that point — this is always a real, non-reversible tradeoff, which is why step 3 above insists on verifying *before* switching the live application over, not after.

## Quarterly test restore — what "tested" actually means here

Not just "the backup file exists" or "the restore command ran without an error" — a test restore is complete only once:

- The restored database is queried and confirmed to contain real (or realistically-shaped) data matching what was expected for that point in time.
- `scripts/migrate.mjs` runs cleanly against it.
- A person other than whoever set up the backup schedule performs or reviews the test — the value of this exercise is catching an assumption the original setup missed, which the same person is least likely to catch alone.
- The result (pass/fail, what was found) is written down, even briefly — a quarterly cadence with no record is indistinguishable from a quarterly cadence that quietly stopped happening.

## RTO / RPO — proposed targets, not yet an approved commitment

Recovery objectives are a business risk-tolerance decision, not a technical architecture one — this document proposes reasoned defaults, proportionate to this platform's actual scale and the daily-backup schedule above, for the MD to confirm or adjust, rather than asserting them as already-approved commitments:

| Metric | Proposed target | Reasoning |
|---|---|---|
| **RPO** (maximum acceptable data loss) | 24 hours without PITR; near-zero with PITR, once the hosting choice supports it | Matches the daily backup schedule directly — anything tighter without PITR would be a target this architecture can't actually meet yet |
| **RTO** (maximum acceptable time to restore service) | A few hours | Proportionate to a one-developer team manually executing the restore procedure above, not an automated failover system this scale doesn't justify building |

## What this document does not do

It does not name a specific backup tool, managed-service feature, or storage location — gated on ADR-004, as explained above. It does not claim a real restore has been tested in this environment — no production database exists yet to test against; the quarterly cadence and restore procedure above are the requirement, to be executed for real starting once a production database does exist, not retroactively claimed here.
