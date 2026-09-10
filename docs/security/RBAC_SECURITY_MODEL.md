# Z-GATE Digital Platform — RBAC Security Model

Formalizes `docs/business/ROLE_MATRIX.md`'s already-documented roles and access rules into an enforceable authorization model. No role or permission below is invented — every one traces to the business's own Role Matrix and Data Privacy Policy annexes.

## Roles

| Role | Source | Scope |
|---|---|---|
| `client` | Advisory (and future division) clients | Exactly one Client record — their own |
| `staff:advisory` | Advisory Associate | Advisory-division data only, for engagements they're assigned to |
| `staff:academy` (V1) | Academy Trainer | Academy-division data only, for cohorts they're assigned to |
| `staff:marketing` | Marketing Coordinator | CRM/lead data (cross-divisional, per the role's actual documented scope — `docs/business/ROLE_MATRIX.md` describes this role as cross-divisional for marketing purposes) |
| `staff:tech` (V2) | Junior Developer / Tech function | Tech-ops data only, once that module exists |
| `staff:data` (V2) | Data Analyst | Data-service data only, once that module exists |
| `admin` | Managing Director (today); future Division Manager | Full cross-divisional access — the only role with this scope, matching the MD's documented reality of absorbing Service Delivery Lead / Division Manager / DPO responsibilities today (`docs/business/ROLE_MATRIX.md` §1) |

**Not modeled as separate roles (yet):** Service Delivery Lead, Division Manager, DPO — per `docs/product/PERSONAS.md`'s explicit call not to build screens/roles for positions nobody occupies yet. **The permission model is designed so introducing them later is a data change (assign a new role to a new user), not a redesign** — this is the same forward-compatibility discipline `docs/product/ROLE_MATRIX.md` and `docs/design/ACCESSIBILITY_SPECIFICATION.md`'s i18n-readiness note both already apply to their own domains.

## Permission matrix (module × role)

| Module | `client` | `staff:advisory` | `staff:academy` | `staff:marketing` | `admin` |
|---|---|---|---|---|---|
| `identity` (own account) | Read/update own | Read/update own | Read/update own | Read/update own | Full (user management, V1) |
| `clients` | Read own only | Read/write assigned | No access | Read (for lead conversion) | Full |
| `crm` (leads) | No access | Read/write (convert) | No access | Full | Full |
| `advisory` | Read own status/deliverables only | Full, for assigned engagements | No access | No access | Full (oversight) |
| `academy` (V1) | Read own enrollment (if a learner) | No access | Full, for assigned cohorts | Read (aggregate only, for testimonial sourcing — never individual learner performance, per Data Privacy Policy Annex B) | Full |
| `documents` | Read own only | Write (upload), read own division's | Write (upload), read own division's | No access | Full |
| `reporting` | No access | No access | No access | Read (lead pipeline only) | Full |
| `audit` (access_log) | No access | No access (cannot view their own access history — not a documented requirement) | No access | No access | Full (quarterly review, FEAT-12.2, V2) |

**Reading this table:** "No access" means the module's authorization check rejects the request outright — not that the UI simply hides the option (`docs/architecture/API_ARCHITECTURE.md`: authorization is enforced server-side, at every request, matching `THREAT_MODEL.md`'s Critical-rated finding that this must never be a UI-only restriction).

## Enforcement architecture

- **Enforcement point:** every module's own boundary, per `docs/architecture/MODULE_ARCHITECTURE.md` — there is deliberately no single centralized "authorization service" a request passes through once; each module is responsible for its own checks against `identity`-supplied role/user data. This avoids a single point of failure where one gatekeeper bug exposes everything, at the cost of requiring every module to get its own checks right — a tradeoff explicitly worth it given the "defense in depth" principle in `SECURITY_ARCHITECTURE.md`.
- **Object-level checks, not just role-level:** a `staff:advisory` role check is necessary but not sufficient — the module must also confirm the specific Engagement/Client record belongs to that staff member's assignment, not just that they hold the Advisory role generally (directly closes `THREAT_MODEL.md` §2's Critical Broken Object Level Authorization threat).
- **Role is server-authoritative:** assigned at account creation/administration (`admin`-only action), never derived from or modifiable by client-supplied request data.

## Separation of duties

At MVP scale, true separation of duties (e.g., the person who can create an invoice cannot also approve it) isn't meaningfully achievable — there's one Advisory Associate and one MD. **This is an accepted, documented limitation, not an oversight:** `docs/discovery/RISKS.md` already identifies "single-founder dependency across all 4 divisions" as a real, high-severity business risk independent of this architecture. The RBAC model doesn't manufacture separation-of-duties controls that don't reflect real organizational capacity — it does ensure that when the team grows (per the HR Policy's own hiring plan), the role model already supports adding a second Advisory Associate, a Division Manager, or a DPO without redesign.

## Access review process (operationalizes an already-committed rule)

The Data Privacy Policy commits to role-based access "reviewed at least quarterly" (`docs/business/BUSINESS_RULES.md` §4). This RBAC model supports that via:
- The `audit.access_log` table (`docs/architecture/DATA_ARCHITECTURE.md`), populated from MVP day one specifically so the first quarterly review (whenever the Admin review UI, FEAT-12.2, ships at V2) has real history to examine, not a blank slate.
- Until FEAT-12.2 exists, the quarterly review is a manual process (the MD queries the access log directly) — a real, if unglamorous, interim process rather than treating "we'll have a UI for this eventually" as an excuse to skip the review entirely.

## Emergency/break-glass access

Given the current organizational reality (MD as the de facto Service Delivery Lead, Division Manager, and DPO simultaneously), the `admin` role already functions as the platform's break-glass access — there is no separate emergency-access mechanism to design at this scale, and building one would be solving a problem (multiple senior staff needing coordinated emergency access) this organization doesn't have yet.

## What this document does not do

It does not implement the actual authorization code — this is the model implementation must conform to. It does not resolve `docs/business/OPEN_BUSINESS_QUESTIONS.md` #4 (shared vs. siloed Client records) — this model works under either answer, per `docs/architecture/ADR/ADR-002-shared-client-record.md`'s reasoning.
