# Z-GATE Digital Platform — Data Architecture

## Database: PostgreSQL, single instance

Restated from `ARCHITECTURE.md` with the fuller rationale: the domain model (`docs/business/DOMAIN_MODEL.md`) is relational by nature — Client → Engagement → Deliverable, Cohort → Enrollment → Certificate — with real referential-integrity needs (a Deliverable must belong to a real Engagement; an Enrollment must reference a real Learner and Cohort). PostgreSQL gives ACID guarantees a compliance-critical filing record genuinely needs (a "mark complete" action that partially fails is a real regulatory problem, not just a bug), costs nothing in licensing, and is well within a Junior Developer/contract-hire's realistic skill range. A single instance is correct at this scale — no read replicas, no sharding, no multi-region database until real load demonstrates the need (none does today: single-digit Advisory clients as of Phase 0/1 discovery).

## Schema outline by module (table-level — not full DDL, which is an implementation artifact)

### `identity`
- `users` — id, email, password_hash, role, division (nullable, for staff), created_at, deactivated_at.

### `clients`
- `clients` — id, legal_name, tin, registered_address, primary_contact_name, primary_contact_channel, created_at.

### `crm`
- `leads` — id, name, contact, channel, stated_need, status, created_at.
- `lead_conversions` — lead_id → client_id, converted_at, converted_by (user_id).

### `advisory`
- `engagements` — id, client_id, division ('advisory'), service_schedule, started_at.
- `compliance_items` — id, engagement_id, type (close-out/filing/annual-return), due_date, completed_at (nullable), completed_by (nullable).
- `deliverables` — id, engagement_id, type, file_ref, uploaded_at, uploaded_by.

### `documents`
- Shares the `deliverables` table structure/module (owned by whichever division module creates the record — `advisory` at MVP, `academy` at V1) rather than a separate generic documents table, per `DOMAIN_ARCHITECTURE.md` §9's "not a general-purpose DMS" scoping.

### `audit`
- `access_log` — id, user_id, action, resource_type, resource_id, timestamp. Append-only; no update/delete path in application code (only a documented, logged retention/deletion process per the rule below).

### V1 additions
- `academy`: `courses`, `cohorts`, `enrollments`, `attendance_records`, `assessments`, `certificates`.

### V2 additions
- `tech_ops`: `support_tickets`, `hosted_systems`.
- `data_service`: `datasets`, `report_templates`, `data_requests`, `accuracy_audits`.

## Data classification tagging (operationalizes the Data Privacy Policy's own classification scheme — `docs/business/BUSINESS_RULES.md` §4)

| Classification | Example tables/fields | Handling rule |
|---|---|---|
| **Sensitive Personal Data** | None currently — Z-GATE's documented data (financial, TIN, contact) does not include health/biometric/genetic data | N/A at current scope; the schema should not need to change if this ever appears, since the classification is a handling policy, not a structural one |
| **Confidential** | `clients` (TIN, address), `advisory.compliance_items`/`deliverables` (financial/filing content), `crm.leads` (contact info) | Access logged (`audit.access_log`), least-privilege enforced at the module boundary (`API_ARCHITECTURE.md`) |
| **Internal** | Operational metadata (timestamps, status enums) | Standard access control, no special logging requirement beyond the norm |
| **Public** | Marketing content (public website copy) | No database sensitivity — largely static content, not even necessarily in the same database |

## Retention & deletion

- The Data Privacy Policy commits to retaining Client/personal data "only for the duration of the engagement plus any period required by Rwandan law... then securely deleted or returned" (`docs/business/BUSINESS_RULES.md` §4). **The exact statutory retention period for Advisory tax/financial records is still an open business question** (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #9 carried through every phase) — the schema is designed so retention is enforceable once that number is confirmed (every compliance-critical table has a clear `engagement_id` and timestamp to base a retention job on), but **no automatic deletion job is built until the real retention period is confirmed by legal counsel** — deleting real compliance records against a guessed number would be a worse failure than deleting nothing yet.
- Soft-delete (a `deleted_at` marker), not hard delete, for any record that might need to be "returned to the Client" per SLA Clause 11's termination process — hard deletion is reserved for the eventual, confirmed statutory-retention-expiry job.

## Audit log design

- `access_log` is genuinely append-only in application code — no module has an update or delete path for it, matching the Data Privacy Policy's implicit expectation that access records themselves aren't tamperable.
- Logged on every read or write of Confidential-classified data by a human user (system-internal reads, like `reporting`'s summary queries, are not logged per-row — they'd generate excessive log volume for no real audit value; only human-initiated access to a specific Client/Engagement record is logged).
- This exists from MVP day one specifically because the Data Privacy Policy's quarterly-access-review commitment (`docs/business/BUSINESS_RULES.md` §4) needs real historical data to review — building the log at V2 (when the review UI ships, FEAT-12.2) would mean the first "quarterly review" has no real history to look at.

## Migrations strategy

- Standard forward-only migration files (schema changes are code, reviewed the same way any other change is) — no exotic migration tooling needed at this scale; whatever the chosen backend framework's conventional migration tool is, is sufficient (framework choice deferred to `docs(backend)`).
- **Dev/staging never contains real Client production data** without written consent and anonymization — this is not a suggestion, it's a direct, already-committed rule (Data Privacy Policy Annex C: "client production data is not used in development or testing without the Client's written consent and appropriate anonymization"). Seed/fixture data for development is synthetic, generated to match the schema shape, never copied from production.

## Backups

- Restated in full in `DEPLOYMENT_ARCHITECTURE.md`; the data-architecture-relevant point here is that every table above is included in the backup scope — there is no "this table doesn't need backing up" exception at this platform's current scale and data sensitivity.

## What this document does not do

It does not provide full DDL (`CREATE TABLE` statements with exact types/constraints/indexes) — that's implementation work. It does not pick a specific ORM or migration tool. It does not resolve the statutory retention period — that's a legal/business decision this document is structured to be ready for, not one it makes.
