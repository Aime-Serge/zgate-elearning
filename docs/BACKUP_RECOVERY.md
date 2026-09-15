# Z-GATE Digital Platform — Backup & Recovery Summary

**Full depth: `docs/devops/BACKUP_RECOVERY.md`.** This document is the two-minute version for whoever needs to know the plan without the full procedure.

## The honest current state

**No backup mechanism is provisioned, and none has ever run, because no production database exists yet.** This is not an oversight to be quietly carried forward — it's a direct consequence of the same open hosting decision (`docs/architecture/ADR/ADR-004-data-residency-hosting-region.md`) that blocks production deployment entirely. A backup of real Client data inherits the same Rwanda-residency commitment as the primary data, so this repository deliberately refuses to pick a backup storage location independent of where that ADR resolves.

## What's specified, ready to execute once a target exists

| System | Schedule | Retention | Restore testing |
|---|---|---|---|
| PostgreSQL (production) | Daily full backup + PITR where the hosting choice supports it | 30 days rolling minimum | Quarterly, *tested* — not just "the file exists" |
| File/document storage | Daily | 30 days rolling | Same quarterly cadence |
| Immediately before every production deploy | Ad hoc, in addition to the daily schedule | Until that deploy is confirmed stable | The fastest rollback point for that one deploy |

**Why this matters more than usual here:** the Advisory module's `compliance_items` and `deliverables` tables are the digital record of a client's statutory tax filings — losing this data is a real compliance-evidence loss with legal consequences, not just an inconvenience.

## Proposed recovery objectives (not yet an approved business commitment)

- **RPO:** 24 hours without PITR, near-zero with it.
- **RTO:** a few hours, proportionate to a one-developer team manually executing the restore procedure — not an automated failover system this scale doesn't justify.

These are reasoned defaults offered for the Managing Director to confirm or adjust, not asserted as already-approved.

## What "tested" has to mean

Not "the backup command ran without an error." A test restore is complete only when the restored database is queried and confirmed to contain expected data, `scripts/migrate.mjs` runs cleanly against it, someone other than whoever set up the schedule performs or reviews the test, and the result is written down. A quarterly cadence with no record is indistinguishable from one that quietly stopped happening.
