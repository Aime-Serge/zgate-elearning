# Z-GATE Cross-Division Workflows

Workflows that genuinely span two or more divisions — the operational proof of the "one gate, four rooms" model, not a restatement of single-division work. Same format as `BUSINESS_WORKFLOWS.md` where applicable; some entries are structural/organizational rather than transactional and are described in prose instead.

## 1. Multi-schedule client engagement [CURRENT]

| Field | Detail |
|---|---|
| Actor | Client, Managing Director (onboarding), any combination of Advisory/Academy/Tech/Data staff |
| Trigger | A single Client signs a Master SLA with two or more Service Schedules attached (e.g., Schedule A + Schedule C, per the "mid-size firms & corporates" persona) |
| Input | One Master SLA, multiple Service Schedules |
| Business Rule | Each Schedule has its own fees and SLA metrics, but shares one Master SLA's confidentiality, data-protection, escalation, and termination terms (SLA Part 1) |
| Decision | Which Schedules to attach at signing vs. add later |
| Output | One Client record served by multiple divisions concurrently |
| Notification | Each division's Service Delivery Lead is informed of the shared-client context (implied by "Advisory, Academy, Tech, and Data share context" — Mission/Vision "Threshold, not silo" value; no documented mechanism for *how* this sharing happens — see Open Questions) |
| Audit Event | Not specified — no document defines whether cross-division access to the same Client's context is itself logged the way single-division data access is (Data Privacy Policy Annexes A–D specify per-division logging, not cross-division) |

**Status note:** the *contractual structure* for this (one SLA, multiple Schedules) is fully defined. The *operational mechanism* for how divisions actually share client context day-to-day is a stated value ("Threshold, not silo"), not a documented process — flagged as [FUTURE / UNDEFINED].

## 2. Shared escalation & grievance ladder [CURRENT]

Not a transactional workflow but a structural fact worth stating explicitly: the **same three-level structure** (Level 1 → Level 2 → Level 3, terminating at the Managing Director) governs both external client escalation (SLA Clause 8) and internal HR grievances (HR Policy Clause 11). This is one authority structure reused for two different purposes, not two coincidentally similar ones — both documents were prepared by the same Business Project Development Desk and cross-reference each other's structure implicitly. No division runs its own independent escalation path.

## 3. Tech builds internal tools for Advisory and Data [CURRENT]

| Field | Detail |
|---|---|
| Actor | Junior Developer / Tech function, Advisory Associate, Data Analyst |
| Trigger | 90-Day Roadmap Month 1–2 milestone: "Scope and start Advisory's internal client portal" / "begin Data's reporting pipeline" |
| Input | Advisory's operational workflow (bookkeeping, filing calendar) and Data's reporting requirements, as the first "client" brief Tech works from |
| Business Rule | Tech's first roadmap is explicitly internal — build Advisory's and Data's own tools *before* selling Tech services externally, because "a working internal case study sells faster and costs less than a campaign" (Business Plan §A5-A6; Business Project Development Report §03) |
| Decision | Internal build now vs. external client work — the documented decision is internal-first |
| Output | Client portal MVP (serving Advisory), reporting pipeline (serving Data) |
| Notification | Internal only — no client-facing notification, since Advisory and Data are the "clients" of this Tech work |
| Audit Event | Tracked via the Business Plan's own Day-90 KPI ("internal tools live; first external Tech conversation opened") |

## 4. Academy curriculum sourced from Advisory expertise [CURRENT]

| Field | Detail |
|---|---|
| Actor | Advisory Associate (source expertise), Academy Trainer (delivery) |
| Trigger | Academy's first-course design phase (Month 1, per roadmap) |
| Input | Advisory's real client casework, anonymized |
| Business Rule | Both Academy courses are explicitly built from "the compliance issues Advisory clients actually bring in, anonymized" (Academy Course Curriculum, Design Principles) — a documented content-sourcing pipeline from one division into another, not independent curriculum development |
| Decision | Which anonymized cases become teaching material |
| Output | Course 1 and Course 2 curricula, case-study modules |
| Notification | None specified — this is a content pipeline, not a client-facing event |
| Audit Event | Anonymization step is a stated requirement (Data Privacy Policy Annex A confidentiality obligations extend to how Advisory case data may be reused) — no formal anonymization sign-off process is documented, however (see Open Questions) |

## 5. Data's BI layer built on Advisory's own data [CURRENT]

| Field | Detail |
|---|---|
| Actor | Data Analyst, Advisory Associate |
| Trigger | 90-Day Roadmap Month 1: "Define standard reporting templates using Advisory's own client data" |
| Input | Advisory's operational data (client compliance status, filing calendar performance) |
| Business Rule | Data's highest-value near-term move is to formalize a BI layer on top of raw processing, using Advisory as the first proof case that "the four divisions compound each other" (Business Project Development Report §03) |
| Decision | Use Advisory's internal data first, before onboarding the first external Data client (Month 3 target) |
| Output | Standard BI dashboard template |
| Notification | Internal — informs Advisory's own operations |
| Audit Event | Feeds the "Data — pilot BI dashboard internally" Month 2 roadmap milestone |

## 6. Company-wide data protection framework [CURRENT]

Not a single transactional workflow — a structural fact: the Data Privacy & Security Policy's Part 1 (purpose, roles, classification, subject rights, breach response, retention) applies identically across all four divisions, with Part 2's Annexes A–D adding only division-specific controls on top of one shared framework. The Data Protection Officer role, breach-notification timeline, and DPIA process are single, company-wide functions — not duplicated per division. This is the clearest evidence in the source documents that Z-GATE is architected as one integrated company rather than four separate businesses sharing only a brand.

## 7. Shared brand & lead-generation funnel [CURRENT]

| Field | Detail |
|---|---|
| Actor | Marketing Coordinator |
| Trigger | Any of the 90-day campaign phases (Awareness → Lead Generation → Conversion) |
| Input | One brand identity system, one message house ("stop juggling four vendors... Z-GATE is the one gate for all four" — Business Plan §B1) |
| Business Rule | "Every campaign in the first 90 days should trace back to this single line; division-specific messages are supporting pillars, not replacements for it" (Business Plan §B1) |
| Decision | Which channel/persona combination a given campaign targets, but always under the unified message house |
| Output | Campaign content across Facebook/LinkedIn/WhatsApp, division-colored per the Brand Identity Guide but never as a standalone division brand |
| Notification | Leads captured feed the shared 500+ qualified-contact KPI (Business Plan §A10), not a per-division target |
| Audit Event | Not specified |

## 8. Shared legal & compliance function [CURRENT]

The RDB activity-code review, the Client SLA template, and the Data Privacy & Security Policy were all prepared by the same "Legal & Compliance" function within the Business Project Development Desk and govern all four divisions' registration, contracts, and data handling uniformly — there is no per-division legal/compliance function. The same escalation point (Managing Director, pending a future Division Manager layer) approves compliance actions across all divisions (e.g., the RDB amendment approval in `BUSINESS_WORKFLOWS.md` §19).

---

## What is explicitly NOT a documented cross-division workflow (do not invent)

The following are implied by Z-GATE's philosophy but have **no documented trigger, owner, or process** — treat as [FUTURE / UNDEFINED], not as an existing workflow, and do not design a mechanism for them without confirmation:

- **Formal cross-sell/referral workflow** — e.g., an Advisory client being systematically offered Academy training, or a Data client being referred to Tech. The "one gate, four rooms" philosophy states the *intent*, but no document specifies who initiates a cross-division referral, at what point in a client relationship, or how it's tracked.
- **Shared vs. siloed Client record** — whether a Client engaged by two divisions has one unified record both divisions see, or two separate records linked only by the Master SLA, is not stated (see `DOMAIN_MODEL.md` and `OPEN_BUSINESS_QUESTIONS.md`).
- **Cross-Schedule billing consolidation** — whether a Client with multiple Service Schedules receives one consolidated invoice or one per Schedule is not specified (SLA Clause 4 describes fees "per Schedule" but doesn't address invoice consolidation).
- **Cross-division revenue/cost allocation** — no transfer-pricing or internal cost-allocation rule exists for Tech's internal builds serving Advisory/Data (reasonable, since these are internal deliverables not billed — but also not something to assume for future reporting without confirmation).
