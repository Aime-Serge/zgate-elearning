# Z-GATE Digital Platform — Data Model

**Source order:** `docs/business/DOMAIN_MODEL.md` → `docs/architecture/DATA_ARCHITECTURE.md` and `DOMAIN_ARCHITECTURE.md` → this phase. This document refines the architecture phase's table sketch into an implementation-ready model — it does not contradict prior decisions; several verdicts below (Project, SOW, generic Task) restate what `DOMAIN_ARCHITECTURE.md` already settled, because a database design phase re-deriving them independently and arriving somewhere different would be a real inconsistency, not a fresh analysis.

## Entity evaluation — the requested 26, judged against real requirements

| # | Entity | Verdict | Where it actually lives |
|---|---|---|---|
| 1 | User | **Build (MVP)** | `users` — staff and client accounts in one table, differentiated by `role` |
| 2 | Role | **Reject as a table** | `users.role` — a fixed enum (`docs/security/RBAC_SECURITY_MODEL.md` already enumerates the full role set); a mutable roles/permissions table would be premature complexity for 7 known, rarely-changing roles. Adding a role (Division Manager, DPO) is a migration adding an enum value, not a redesign. |
| 3 | Organization | **Reject** | No separate concept exists — Z-GATE is one company serving many Client organizations; "Organization" and "Client" are the same thing here. Building both would create a meaningless indirection. |
| 4 | Client | **Build (MVP)** | `clients` |
| 5 | Contact | **Defer, merge into Client for now** | `clients.primary_contact_name` / `primary_contact_channel`. No current backlog feature (`docs/product/PRODUCT_BACKLOG.md`) needs multiple contacts per client. Flagged as a future extraction point (ICP-2 corporate clients may eventually need it) — not built speculatively. |
| 6 | Lead | **Build (MVP)** | `leads` |
| 7 | Opportunity | **Reject** | `docs/product/PRD.md`'s own non-goal: "not a full CRM/marketing-automation suite." `leads.status` already covers new/qualified/converted/lost — a formal deal-stage/pipeline-value entity has no product requirement behind it. |
| 8 | Division | **Reject as a table** | An enum (`advisory`, `academy`, `tech`, `data`) — four fixed, non-user-editable values with no operational attributes any MVP query needs from a table (mission/brand color live in `docs/design/DESIGN_SYSTEM.md`, not runtime data). |
| 9 | Service | **Reject as a table** | `engagements.service_schedule` (which SLA Schedule, A–D) plus `compliance_items.type` already capture the granularity any current feature needs. No backlog feature needs a browsable service catalog. |
| 10 | Engagement | **Build (MVP)** | `engagements` |
| 11 | Project | **Reject** | Already settled in `docs/architecture/DOMAIN_ARCHITECTURE.md` §8 — no approved document defines a cross-division Project concept distinct from Engagement. |
| 12 | Task | **Reject as a generic entity** | Each module owns its own task-shaped record instead: `compliance_items` (Advisory), `attendance_records`/`assessments` (Academy, V1), `support_tickets` (Tech, V2). A shared polymorphic Task table would violate the module-boundary rule (`docs/architecture/MODULE_ARCHITECTURE.md`: a module never reaches into another's tables) for no real benefit at this scale. |
| 13 | SOW | **Reject** | Already settled in `docs/architecture/DOMAIN_ARCHITECTURE.md` §10 — Z-GATE's real contractual mechanism is the Master SLA + Service Schedule, not a separate SOW concept. |
| 14 | SLA | **Reject as a table** | Already settled in `docs/architecture/DOMAIN_ARCHITECTURE.md` §11 — SLA targets (`docs/business/BUSINESS_RULES.md` §2's fixed table) are hardcoded application constants per division, referenced by `compliance_items.due_date`/`type`, not a configurable rules table. Four divisions with well-known, largely fixed targets don't justify a rules engine. |
| 15 | Deliverable | **Build (MVP)** | `deliverables` |
| 16 | Document | **Merge into Deliverable** | Same table — `docs/architecture/DATA_ARCHITECTURE.md` already made this call ("not a general-purpose DMS"); a separate `documents` table with identical shape would be duplication, not design. |
| 17 | Invoice | **Reject for MVP/V1, contingent Future** | `docs/architecture/ADR/ADR-006-no-ebm-billing-integration.md` — Z-GATE uses a certified third-party EBM provider; no billing system is built. A lightweight invoice-status record is explicitly noted as a possible V2+ addition *if* a real need is demonstrated — not built now. |
| 18 | Payment | **Reject, same reasoning as Invoice** | Same ADR |
| 19 | Ticket | **Build (V2 only)** | `support_tickets` — Tech-division only, per `docs/architecture/DOMAIN_ARCHITECTURE.md` §13's split verdict (Advisory/Academy support stays on WhatsApp, no ticket table for them) |
| 20 | Course | **Build (V1)** | `courses` |
| 21 | Cohort | **Build (V1)** | `cohorts` |
| 22 | Learner | **Build (V1), separate from User** | `learners` — most Academy learners have no platform login (enrollment/attendance/certification is Trainer-managed, per `docs/product/PRODUCT_BACKLOG.md` FEAT-08.2–08.4); forcing every learner through the `identity` module would add auth-account overhead with no current product need |
| 23 | Dataset | **Build (V2)** | `datasets` — Data-service module |
| 24 | Report | **Split verdict** | MVP internal reporting (FEAT-07.1/07.2) is **not a stored entity** — computed as live queries over `leads`/`engagements`/`compliance_items` (`docs/architecture/DOMAIN_ARCHITECTURE.md` §7: avoid a stale duplicated-analytics-copy problem at this scale). `report_templates` becomes a real V2 table only once external Data clients exist. |
| 25 | Notification | **Build (V1 only)** | `notifications` — MVP's Client Portal is pull-based (`docs/architecture/DOMAIN_ARCHITECTURE.md` §14); no table needed until proactive V1 reminders are built |
| 26 | AuditLog | **Build (MVP)** | `access_log` — already fully specified in `docs/architecture/DATA_ARCHITECTURE.md`, carried forward unchanged |

**Net result:** of 26 requested entities, **7 are real MVP tables**, 2 more (`notifications`, and Academy's cluster) activate at V1, 3 more (`support_tickets`, `datasets`, `report_templates`) activate at V2, and **9 are deliberately rejected** as not reflecting any real Z-GATE business concept — building them would be exactly the "unnecessary complexity" this phase is explicitly asked to avoid.

## MVP entities — full attribute definitions

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `email` | text, unique, not null | |
| `password_hash` | text, not null | Never plaintext — see `DATA_SECURITY.md` |
| `role` | enum, not null | `client`, `staff_advisory`, `staff_marketing`, `admin` at MVP (`staff_academy`, `staff_tech`, `staff_data` activate with their modules) |
| `division` | enum, nullable | Set for division-scoped staff roles; null for `client` and `admin` |
| `client_id` | uuid, FK → `clients.id`, nullable | Set only when `role = 'client'` — links a client-portal login to the Client record it may act on |
| `created_at` | timestamptz, not null | |
| `deactivated_at` | timestamptz, nullable | Soft-disable, not deletion — see `DATA_LIFECYCLES.md` |

### `clients`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `legal_name` | text, not null | |
| `tin` | text, nullable | Confidential (`docs/business/DOMAIN_MODEL.md` §2); nullable because a Client record can exist before a TIN is confirmed during onboarding, enforced complete at the application layer before an Advisory engagement activates |
| `registered_address` | text, nullable | |
| `primary_contact_name` | text, nullable | |
| `primary_contact_channel` | text, nullable | |
| `created_at` | timestamptz, not null | |
| `deleted_at` | timestamptz, nullable | Soft delete — see `DATA_LIFECYCLES.md` |

### `leads`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | text, not null | |
| `contact` | text, not null | |
| `channel` | enum, not null | `website`, `whatsapp`, `facebook`, `linkedin`, `other` (`docs/product/PRODUCT_BACKLOG.md` FEAT-02.1/02.2) |
| `stated_need` | text, nullable | |
| `status` | enum, not null, default `new` | `new`, `qualified`, `converted`, `lost` |
| `converted_client_id` | uuid, FK → `clients.id`, nullable | Set on conversion (FEAT-03.2) |
| `converted_at` | timestamptz, nullable | |
| `converted_by` | uuid, FK → `users.id`, nullable | |
| `created_at` | timestamptz, not null | |

### `engagements`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `client_id` | uuid, FK → `clients.id`, not null | |
| `division` | enum, not null | `advisory` is the only division with active engagements at MVP |
| `service_schedule` | enum, not null | `A`, `B`, `C`, `D` — mirrors the Client SLA's Service Schedules |
| `status` | enum, not null, default `active` | `active`, `completed`, `terminated` |
| `started_at` | timestamptz, not null | |
| `ended_at` | timestamptz, nullable | |

### `compliance_items` (Advisory)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `engagement_id` | uuid, FK → `engagements.id`, not null | |
| `type` | enum, not null | `close_out`, `vat_ebm_filing`, `annual_return`, `urgent_issue` (`docs/business/BUSINESS_RULES.md` §2) |
| `due_date` | date, not null | |
| `completed_at` | timestamptz, nullable | Null = pending; the actual timestamp, never backdated, proves honest SLA measurement (`docs/product/ACCEPTANCE_CRITERIA.md` ST-09) |
| `completed_by` | uuid, FK → `users.id`, nullable | |
| `created_at` | timestamptz, not null | |

### `deliverables` (also covers "Document")
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `engagement_id` | uuid, FK → `engagements.id`, not null | |
| `type` | enum, not null | `report`, `filing_copy`, `other` |
| `file_ref` | text, not null | Storage pointer — region/provider pending ADR-004 |
| `uploaded_at` | timestamptz, not null | |
| `uploaded_by` | uuid, FK → `users.id`, not null | |

### `access_log` (AuditLog)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id`, not null | Human-initiated access only, per `docs/architecture/DATA_ARCHITECTURE.md` |
| `action` | text, not null | e.g. `view_client`, `mark_compliance_complete`, `upload_deliverable` |
| `resource_type` | text, not null | e.g. `client`, `engagement`, `deliverable` |
| `resource_id` | uuid, not null | |
| `occurred_at` | timestamptz, not null | |

## What this document does not do

It does not define V1/V2 table schemas in full DDL detail (`courses`, `cohorts`, `learners`, `enrollments`, `attendance_records`, `assessments`, `certificates`, `support_tickets`, `datasets`, `report_templates`, `notifications`) beyond the entity-evaluation table above — those get full attribute treatment when their phase actually starts, consistent with this whole engagement's discipline of not designing ahead of approved need. It does not write the actual `CREATE TABLE` migrations — see `MIGRATION_STRATEGY.md` for those, built and validated only after this model itself was reviewed.
