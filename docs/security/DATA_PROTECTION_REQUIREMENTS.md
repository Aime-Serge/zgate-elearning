# Z-GATE Digital Platform — Data Protection Requirements

Operationalizes the Data Privacy & Security Policy's already-committed rules (`docs/business/BUSINESS_RULES.md` §4) into concrete, architecture-level requirements. This document adds no new policy — it makes existing policy enforceable.

## Data classification (restated from `docs/architecture/DATA_ARCHITECTURE.md`, binding here)

| Classification | Protection requirement |
|---|---|
| **Sensitive Personal Data** | Not currently applicable to any documented Z-GATE data (no health/biometric/genetic data described anywhere) — if it ever appears, requires explicit consent/lawful basis and enhanced safeguards per Law N° 058/2021 before any such field is added to the schema |
| **Confidential** | Encrypted in transit (always) and at rest (required — see below); access logged; least-privilege enforced (`RBAC_SECURITY_MODEL.md`) |
| **Internal** | Standard access control; no special encryption-at-rest mandate beyond whatever the database/storage layer provides by default |
| **Public** | No confidentiality requirement — public website content |

## Encryption

- **In transit:** TLS on every connection, no exceptions (`SECURITY_REQUIREMENTS.md` V9) — already a committed rule (Data Privacy Policy §7: "Data in transit is encrypted (e.g., HTTPS/TLS)").
- **At rest:** Confidential-classified fields (TIN, financial records, bank details, contact information used for compliance purposes) encrypted at rest — operationalizes "sensitive data at rest is encrypted where the hosting platform supports it" (Data Privacy Policy §7) as a firm requirement for this specific data class, not a best-effort maybe. Full-disk/volume encryption at the infrastructure layer (once ADR-004's hosting decision lands) is the baseline; field-level encryption for the most sensitive values (TIN, bank details) is the elevated requirement for the `advisory`/`clients` modules specifically.
- **Backups:** encrypted to the same standard as the live data they're copied from — an unencrypted backup would undo every other control in this document.

## Key management

- Encryption keys are never stored in the same location as the data they protect, never committed to version control, and access to them is itself logged and least-privilege (a key-management failure is equivalent to no encryption at all).
- Key rotation is planned for, not built at MVP scale — a documented rotation *process* should exist even if rotation frequency is initially low, given the small team's limited capacity to operate complex key-rotation tooling.

## Data minimization

- Each module collects only the fields a documented business need requires (`docs/business/BUSINESS_RULES.md` §4: "collect and process only what a specific engagement requires") — this is enforced at schema-design time (`docs/architecture/DATA_ARCHITECTURE.md`'s table outlines), not left to be caught later.
- No speculative fields ("might need this later") in any Confidential-classified table.

## Retention & deletion

- Restated from `docs/architecture/DATA_ARCHITECTURE.md`: **no automatic deletion job runs until the statutory retention period for Advisory tax/financial records is confirmed by legal counsel** (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #9, still open across every phase of this engagement). Building a deletion job against a guessed number risks destroying real compliance evidence — a worse outcome than over-retaining data while the number is confirmed.
- Soft-delete only until that confirmation lands; hard-delete jobs are a post-confirmation implementation task, not built speculatively now.
- On SLA termination, data is returned/deleted per SLA Clause 11 — the schema's `deleted_at`/engagement-linkage design (`docs/architecture/DATA_ARCHITECTURE.md`) supports this without further architectural work.

## Anonymization for non-production use

- **Already-committed, binding rule** (Data Privacy Policy Annex C): dev/staging never contain real Client production data without written consent and anonymization. Seed/fixture data is synthetic, generated to match the schema shape (`docs/architecture/DATA_ARCHITECTURE.md`'s migrations section) — never copied from production, ever, under any circumstance including debugging a production issue.

## Data Protection Impact Assessments (DPIA)

- Required before any engagement "likely to pose a high risk to individuals' rights" — large-scale sensitive-data processing, new automated decision-making (Data Privacy Policy §12, Law N° 058/2021 Art. 38(3)).
- **Architectural trigger points requiring a DPIA before building:** the V2 `data-service` module (external Data clients processing potentially large datasets), any future automated decision-making feature (none currently planned — flagged so a future feature proposal doesn't skip this step).
- DPIA ownership: currently the MD by default, since the DPO role is unfilled (`docs/security/RBAC_SECURITY_MODEL.md` — same gap noted there).

## Cross-border data transfer

- Governed entirely by ADR-004 (`docs/architecture/ADR/ADR-004-data-residency-hosting-region.md`) — no transfer of Confidential data outside Rwanda happens until that ADR is resolved and, if it results in an offshore component, an NCSA-issued certificate is obtained and the affected Clients are given written notice (Data Privacy Policy §6, §11).
- Any future third-party vendor touching Confidential data (a notification provider, a future international Tech-implementation tool) must be named in the applicable Service Schedule and assessed for adequate safeguards before adoption (Data Privacy Policy §8) — this applies architecturally as a gate before any such integration is built, not just a paperwork step after the fact.

## Data subject rights

- Requests are forwarded to the relevant Client (as data controller) within 2 business days, unless Z-GATE is itself the controller for that data (Data Privacy Policy §4) — this requires the platform to be able to locate all data associated with a given individual on request, which the schema's clear Client/Engagement linkage (`docs/architecture/DATA_ARCHITECTURE.md`) supports without needing a dedicated "data subject request" module at MVP scale (a manual, MD-run process is sufficient given current volume).

## What this document does not do

It does not select a specific encryption algorithm/library or key-management service — implementation-phase decisions, made to meet the requirements above. It does not resolve the statutory retention period or the hosting-region ADR — both remain open, tracked business/legal decisions this document is built to be ready for, not empowered to make.
