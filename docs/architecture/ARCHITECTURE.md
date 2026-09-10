# Z-GATE Digital Platform — Architecture (Master Document)

**Source order:** `docs/business/` → `docs/product/` → `docs/ux/` → `docs/marketing/` → `docs/design/`. Every architectural decision below is traceable to a real requirement from one of those phases, or explicitly marked as this phase's own judgment call (and, where genuinely unresolved, recorded as an ADR requiring Managing Director/legal input rather than decided unilaterally here).

## Executive summary

The Z-GATE Digital Platform is architected as a **modular monolith** — one deployable application internally organized into clearly-bounded modules mapping to the business's real domains (Identity, Clients, CRM, Advisory, Academy, Tech, Data, Documents, SLA, Billing, Support, Notifications, Analytics, Audit). This is not a default chosen for lack of a better idea — it's the architecturally correct answer to the platform's actual current shape: a single company, one real client-facing division live (Advisory), a handful of total users, and a shared tools/hosting budget of roughly RWF 1,000,000 over the first 90 days (`docs/business/BUSINESS_RULES.md` §8). Microservices would introduce operational complexity (service discovery, distributed transactions, multi-deployment CI/CD) that this platform has no demonstrated need for and cannot afford — directly violating the "avoid premature complexity" and "cost-conscious" requirements this phase is bound by.

## Architectural requirements — how each is met

| Requirement | How this architecture meets it |
|---|---|
| **Secure** | Rwanda-default data residency (flagged as an open ADR, not silently assumed), least-privilege role-based access logged per the Data Privacy Policy's already-committed rules (`docs/business/BUSINESS_RULES.md` §4), no plaintext secrets, encrypted transit/rest — see `DATA_ARCHITECTURE.md`, ADR-005 |
| **Maintainable** | One codebase, one deployment, modules with explicit boundaries and a single junior/contract-developer-sized team in mind (`docs/business/ROLE_MATRIX.md` — the Junior Developer role is a Month-3, contract/internship hire) |
| **Testable** | Module boundaries double as test boundaries; a monolith with clear internal seams is easier to test end-to-end than a distributed system at this scale |
| **Scalable** | Vertical-first scaling posture (see `DEPLOYMENT_ARCHITECTURE.md`) — appropriate to real current load (single-digit Advisory clients), with module boundaries designed so any module *could* be extracted into its own service later if it ever genuinely needs to (documented, not built) |
| **Observable** | Lightweight logging/monitoring scoped to actual need, not an enterprise observability stack the budget can't support — see `DEPLOYMENT_ARCHITECTURE.md` |
| **Cost-conscious** | Every infrastructure choice in this phase is evaluated against the Financial Model's real, tiny shared budget line, not against what a well-funded SaaS company would choose |
| **Accessible** | Architecture doesn't block `docs/design/ACCESSIBILITY_SPECIFICATION.md` — server-rendered/semantic-HTML-capable frontend approach preserved as a real option (see `MODULE_ARCHITECTURE.md`, frontend direction) |
| **Deployable** | Simple CI/CD, dev/staging/production separation (a real, already-committed requirement — Data Privacy Policy Annex C: "Production and development environments are separated") |

## Technology direction (concrete, but scoped to this phase — framework specifics deferred to the dedicated frontend/backend architecture phases)

| Layer | Direction | Why (sourced, not arbitrary) |
|---|---|---|
| Language | TypeScript, frontend and backend | The Junior Developer job description explicitly names "a modern web stack (e.g., JavaScript/TypeScript, a common backend framework)" as the expected skill (HR Policy Manual, Part 2) — this is a real signal from the business's own hiring plan, not an architect's arbitrary preference. TypeScript also gives a small team compile-time safety that a memory-only, single-developer-reviewed codebase badly needs. |
| Backend | A single modular-monolith service | Per this phase's explicit instruction; matches the "internal tool before external product" build order already established (`docs/product/PRODUCT_VISION.md`) |
| Database | PostgreSQL (single instance) | The domain model (`docs/business/DOMAIN_MODEL.md`) is heavily relational (Client → Engagement → Deliverable, etc.); ACID guarantees matter for compliance-critical filing records; well-supported, cheaply hostable, no license cost |
| Frontend rendering | Server-rendering/static-generation capable for the public website (SEO/performance — `docs/marketing/SEO_STRATEGY.md`'s mobile-performance priority), client-rendering acceptable for authenticated portals | Public pages need to be fast and crawlable on a slow connection; authenticated portal pages don't need to be indexed and can prioritize interactivity |
| Auth | Self-hosted within the monolith (credential+session or JWT, hashed credentials in Postgres) — not a third-party managed identity platform | A paid IdP is a real recurring cost the Financial Model's tools/software line doesn't clearly accommodate at MVP scale; a well-implemented in-monolith auth module is standard practice and keeps the whole system in one place to secure and audit |
| File/document storage | Object storage or server-local disk with automated backup, region pending the same data-residency ADR as the database | Deliverables (FEAT-05.2/06.3) are small-scale at MVP (a handful of documents per client per month) — no need for a specialized document-management platform yet |

## Core domains — evaluated, not assumed

Full detail in `DOMAIN_ARCHITECTURE.md`. Summary verdict:

| Domain | Verdict |
|---|---|
| Identity | **Build now (MVP)** |
| Clients | **Build now (MVP)** |
| CRM | **Build now (MVP)**, minimal |
| Advisory | **Build now (MVP)**, the core domain |
| Academy | **Build at V1** |
| Tech | **Build at V2** (as a service-ops domain); Tech-the-team is the platform's own builder, not a software domain at MVP |
| Data | **Split:** internal reporting is MVP (minimal); Data-as-a-service domain is V2 |
| Projects | **Not a distinct domain** — no approved document defines this separately from Engagement; do not build it |
| Documents | **Build now (MVP)**, minimal (list + upload, not a DMS) |
| SOW | **Not a distinct domain** — no approved document describes a Statement-of-Work concept separate from the Master SLA + Service Schedule structure already in the domain model; do not invent one |
| SLA | **Implicit in Advisory/Academy/Tech modules (MVP)** as due-date/target fields, not a standalone configurable rules engine |
| Billing | **Not built** — Z-GATE uses a certified third-party EBM provider operationally; the platform does not become a billing system (explicit non-goal, `docs/product/PRD.md` §2) |
| Support | **Not built for Advisory/Academy** (WhatsApp stays the channel, `docs/ux/EXPERIENCE_REQUIREMENTS.md` §5); **built at V2** for Tech (ticketing, FEAT-10.1) once external Tech clients exist |
| Notifications | **Not built at MVP** (status is pull, not push); **V1** for Advisory deadline reminders |
| Analytics | **MVP**, minimal internal reporting; **V2** for external Data delivery |
| Audit | **MVP** — access logging starts on day one because the Data Privacy Policy already commits to it (`docs/business/BUSINESS_RULES.md` §4); the review *UI* is V2 |

## What this document does not do

It does not pick a specific frontend framework, backend framework, or hosting vendor by name — those are the next phase's decisions (`docs(frontend)`, `docs(backend)` per the commit roadmap), made within the direction this document sets. It does not resolve the data-residency/hosting-region question — see ADR-004, which requires Managing Director and legal input, not an architect's unilateral guess.
