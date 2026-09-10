# Z-GATE Digital Platform — Data Security

Table- and column-level application of `docs/security/RBAC_SECURITY_MODEL.md` and `docs/security/DATA_PROTECTION_REQUIREMENTS.md`. This document doesn't set new security policy — it maps already-committed rules onto the actual schema in `DATA_MODEL.md`.

## Credential storage — never plaintext, no exceptions

`users.password_hash` stores the output of a modern, slow password-hashing algorithm (Argon2id or bcrypt — final library choice deferred to the backend implementation phase, per `docs/security/SECURITY_REQUIREMENTS.md` V2). Binding rules, restated because this is the one rule this entire phase explicitly cannot get wrong:

- **Never** a reversible encryption of the password.
- **Never** a fast general-purpose hash (MD5, SHA-256 alone) used for password storage.
- **Never** logged, even at debug level — `access_log.action` records *that* a login happened, never the credential involved.
- The column name itself (`password_hash`, not `password`) is a deliberate guardrail against a future developer accidentally writing plaintext into a column that sounds like it might accept it.

## Column-level sensitivity classification

Restates `docs/architecture/DATA_ARCHITECTURE.md`'s classification table at the actual column level:

| Table.Column | Classification | Protection |
|---|---|---|
| `users.password_hash` | Confidential (credential) | Hashed, never logged, never returned in any API response (`docs/architecture/API_ARCHITECTURE.md`'s response-shaping rule) |
| `users.email` | Confidential (personal) | Access-logged when queried by another user; a user reading their own record is not logged (see "What gets logged" below) |
| `clients.tin` | **Confidential — highest sensitivity in this schema** | Encrypted at rest (field-level, per `docs/security/DATA_PROTECTION_REQUIREMENTS.md`'s "most sensitive values" tier); every read logged |
| `clients.legal_name`, `registered_address`, `primary_contact_*` | Confidential | Encrypted at rest (volume/disk-level is sufficient here — these aren't the field-level-encryption tier `tin` requires, but they're still Confidential per Data Privacy Policy Annex A) |
| `leads.name`, `leads.contact` | Confidential (personal, pre-Client) | Standard access control; lower operational sensitivity than a signed Client's data, but still real personal data under Law N° 058/2021 |
| `engagements.*` | Confidential (reveals the business relationship itself) | Access-logged |
| `compliance_items.*` | Confidential (financial/regulatory content) | Access-logged, encrypted at rest |
| `deliverables.file_ref` | Confidential (points to Confidential-classified files) | The referenced file itself is access-mediated per `docs/security/THREAT_MODEL.md` §7 — no direct/guessable storage URL |
| `access_log.*` | Internal (about Confidential data, not itself Confidential data) | Full access restricted to `admin` role only (`docs/security/RBAC_SECURITY_MODEL.md`'s permission matrix) — the log of who-accessed-what is itself a sensitive record, protected accordingly |

## Row-level access control (formalizes `RBAC_SECURITY_MODEL.md`'s permission matrix at the schema level)

Every query against `clients`, `engagements`, `compliance_items`, or `deliverables` is scoped by the application layer to:
- **`client`-role caller:** exactly one row in `clients` (their own, via `users.client_id`), and only `engagements`/`compliance_items`/`deliverables` rows whose `engagement.client_id` matches it.
- **`staff_advisory`-role caller:** any `engagement` where `division = 'advisory'` **and** the caller is the assigned Advisory Associate for that engagement (assignment mechanism: at MVP scale — a single Advisory Associate — this is effectively "any Advisory engagement," but the check is written as an explicit assignment condition from day one, not hardcoded to "any advisory staff sees everything," so it doesn't need rework the moment a second Advisory Associate is hired).
- **`admin`-role caller:** unrestricted, matching the MD's documented cross-divisional oversight role (`docs/business/ROLE_MATRIX.md` §1).

**This is enforced in application code at each module's boundary** (`docs/architecture/MODULE_ARCHITECTURE.md`), not via Postgres Row-Level Security policies at MVP — a deliberate scope decision: RLS is a real, valid pattern, but adding a second enforcement mechanism (database policies *and* application checks) for a single-application, single-database system is redundant defense-in-depth the team's size doesn't get proportional value from yet. **Revisit if a second application/service ever queries this database directly** (not currently planned — `docs/architecture/MODULE_ARCHITECTURE.md`'s "in-process calls only" rule means nothing else touches this database at MVP).

## What gets logged, and what doesn't

- **Logged:** any staff or client access to a Confidential-classified record belonging to someone other than an unambiguous self-access case, and every write (compliance-item completion, deliverable upload) regardless of who did it.
- **Not logged individually:** a user viewing their own profile, a `reporting` module query (aggregate, not row-level — `docs/architecture/DATA_ARCHITECTURE.md`'s "system-internal reads... not logged per-row" rule, restated here because it's the one deliberate exception to "log all Confidential access").
- **Why the distinction matters:** logging every single read indiscriminately would make the `access_log` table itself enormous and would drown the signal the quarterly access review actually needs (`docs/security/RBAC_SECURITY_MODEL.md`) — this is a proportionality judgment already made at the architecture phase, restated here as a column-level rule for whoever implements the logging calls.

## Encryption at rest — what's covered

- **Volume/disk-level encryption** (infrastructure layer, pending ADR-004's hosting decision) covers every table by default — the baseline.
- **Field-level encryption** (application-layer, independent of infrastructure) specifically for `clients.tin` — the single highest-consequence field in this schema if exposed, given it's a National ID/TIN-equivalent identifier tied directly to a real business's tax identity.

## What this document does not do

It does not select a specific hashing library, encryption library, or key-management tool — implementation-phase choices made to satisfy the requirements above. It does not design Row-Level Security policies — explicitly deferred, with the reasoning for why, not by oversight.
