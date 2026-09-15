# Z-GATE Digital Platform — Migration Strategy

## Approach: plain, forward-only SQL

PostgreSQL is a confirmed decision (`docs/architecture/ADR/ADR-001-modular-monolith.md`'s companion data decision in `docs/architecture/ARCHITECTURE.md`); the backend application framework is not (`docs(backend)` is the next phase). Migrations are written as **plain, numbered SQL files** rather than a framework-specific migration DSL — this is the one choice that doesn't need to wait for the framework decision, and whatever backend framework is chosen next can either run these directly (most support raw-SQL migrations) or the team can adopt a framework-native migration tool at that point without having wasted this work — plain SQL is the lowest-common-denominator format every option can consume.

## Principles

- **Forward-only.** No down-migrations maintained as a matter of course — a rolled-back schema change is handled by writing a new forward migration that corrects it, not by trusting a down-script that's rarely tested and easy to get wrong. (An emergency restore uses the backup/restore process in `docs/architecture/DEPLOYMENT_ARCHITECTURE.md`, not a down-migration.)
- **Reviewed like any other code change** — no direct schema edits against a running database, ever, including in an emergency (see `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s containment actions, which operate on data/access, not schema).
- **One logical change per migration file**, numbered sequentially, never edited once applied to any shared environment (dev is the one exception where a not-yet-shared migration can still be fixed in place).
- **Dev/staging/production separation is enforced here too**: the same migration files run against all three, in the same order — the schema is never allowed to drift between environments, which is exactly what would make the already-committed "staging mirrors production" separation rule (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`) meaningless if violated.

## Validation before implementation (this phase's explicit instruction)

Per this phase's instruction — "create migrations only after validating the model" — the migrations below were **not** written speculatively. `DATA_MODEL.md` and `ENTITY_RELATIONSHIPS.md` were reviewed first (entity-by-entity justification, relationship cardinalities, constraint rationale), and only then translated into SQL. **Live execution against a real PostgreSQL instance was attempted but not achieved** in this environment — see the verification note at the bottom of this document for exactly what was and wasn't done, and why the claim here stops at static review rather than overstating it.

## File layout

```
db/migrations/
  001_users.sql
  002_clients.sql
  003_leads.sql
  004_engagements.sql
  005_compliance_items.sql
  006_deliverables.sql
  007_access_log.sql
```

Split by entity rather than one large file — makes review and history legible (`git log` on a single migration shows exactly one entity's evolution), and matches the module boundaries these tables belong to (`docs/architecture/MODULE_ARCHITECTURE.md`).

## Seed data

- **Local development:** synthetic seed data only, generated to match the schema shape — never copied from any real environment. No seed script exists yet in this repository (would be premature ahead of an actual application querying this schema) — noted here as a requirement for the backend implementation phase, not built in this one.
- **Staging:** same rule, no exception, per the already-committed separation requirement (Data Privacy Policy Annex C).
- **Production:** no seed data beyond whatever the application's own first-run setup genuinely requires (there is none identified yet).

## What happens next (not this phase's job)

Once the backend framework is chosen (`docs(backend)`), that phase decides how these SQL files are actually run in practice (a migration-runner tool, a thin wrapper script, or the framework's native tool re-pointed at these files) — this document defines the schema and the principles, not the runner.

## Verification performed for this phase

**Live execution was attempted, not achieved, in this environment.** A disposable PostgreSQL 16 container (`postgres:16-alpine`, no persistent volume) was the intended validation method, with a ready-to-run script (start container → apply all seven migrations in order via `psql` → inspect the resulting schema → tear down). It could not be run: the development machine's Docker daemon socket rejected access for the working user account, and adding that account to the `docker` group (`sudo usermod -aG docker`) did not take effect in any of the terminal sessions available during this phase — neither this tool's persistent shell nor a freshly-opened terminal on the same machine, which normally suggests the desktop session itself needs a full logout/reboot to pick up the new group membership. Rather than continue attempting workarounds or asking for a reboot mid-task, this phase fell back to the documented alternative.

**What was actually done instead: a full manual dependency-order and syntax review of all seven files**, specifically checking:
- Every `CREATE TYPE` (enum) precedes its first use, and no table references a type or table not yet created earlier in file-number order (verified explicitly: `users` → `clients` [+ the deferred `users.client_id` FK, added via `ALTER TABLE` once `clients` exists] → `leads` → `engagements` → `compliance_items` → `deliverables` → `access_log`, with every `REFERENCES` target confirmed to already exist at that point in the sequence).
- Every `CHECK` constraint's column references exist earlier in the same `CREATE TABLE` statement (no forward references).
- Enum-vs-string-literal comparisons in `CHECK` constraints (e.g., `role != 'client'`, `status != 'converted'`) use the standard Postgres implicit-cast pattern for unknown-type literals against enum columns — a well-established, valid construct, not a novel one.
- Index syntax, including the partial index on `compliance_items` and the functional unique index on `lower(users.email)`, matches standard PostgreSQL DDL.

**What this does not confirm:** that the schema is free of every possible runtime issue (e.g., an extension unavailable on a specific hosting provider, a subtle version-specific behavior) — only live execution against a real instance would confirm that with full confidence. **This gap should be closed as the first task of the backend implementation phase**, before any application code is written against this schema, not carried forward indefinitely as an accepted risk.
