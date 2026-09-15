# Z-GATE Digital Platform — Information Architecture

Content and navigation structure only — page/section hierarchy and what belongs on each node. **This is not a redesign or a layout**: no visual arrangement, component choice, or interaction pattern is specified. Structured by surface, phase-tagged per `docs/product/PRODUCT_ROADMAP.md`, and every content source traced to an approved document so nothing here invents copy or structure the business hasn't already produced.

## 1. Public Website [MVP core, V1 additions noted]

```
Home  [MVP]
├── What Z-GATE is (elevator pitch — Mission/Vision doc, "Elevator Pitch" section)
├── Four-division summary, one line each (Mission/Vision doc, "Division Copy")
└── Primary action → Contact

Advisory  [MVP]
├── Mission + About (Mission/Vision doc, "Z-GATE Advisory" section, verbatim)
├── What's included (derived from SLA Schedule A scope — service list only, not fee/legal terms)
└── Primary action → Contact (pre-filled "Advisory" interest, if simple to do — not required for MVP)

Academy  [V1, page shell can exist in MVP as "coming soon" if desired — not required]
├── Mission + About (Mission/Vision doc, "Z-GATE Academy" section)
├── Course 1: Tax & Bookkeeping Fundamentals (Academy Course Curriculum — audience, duration, fee, outcomes)
├── Course 2: EBM & Digital Invoicing Mastery (same source)
└── Primary action → Enroll (V1) / Contact (MVP placeholder)

Tech  [MVP page, V1+ for any client-facing proof content]
├── Mission + About (Mission/Vision doc, "Z-GATE Tech" section)
├── What's included (derived from SLA Schedule C scope)
└── Primary action → Contact

Data  [MVP page, V1+ for any client-facing proof content]
├── Mission + About (Mission/Vision doc, "Z-GATE Data" section)
├── What's included (derived from SLA Schedule D scope)
└── Primary action → Contact

Contact  [MVP]
├── Contact form (FEAT-01.2 / FEAT-02.1: name, contact info, stated need)
└── Direct channels (WhatsApp Business, per the Business Plan's channel strategy — not replaced by the form)

About / Company  [MVP, low priority — can follow initial launch]
└── "Boilerplate" company description (Mission/Vision doc, "Boilerplate" section, verbatim)
```

**Explicitly not in MVP's public IA:** case studies/testimonials (none exist yet — no client has completed a full cycle), pricing pages (no public pricing model exists in any approved document), a careers page (no hiring pipeline beyond the documented 5 first-hire roles), a blog/insights section (not mentioned in any approved document as current scope).

## 2. Client Portal [MVP: Advisory only; V1+: expands per division]

```
Login  [MVP]

Status (default landing page after login)  [MVP]
├── Current compliance status, plain language (FEAT-05.1)
└── Next due item + date

Deliverables  [MVP]
└── List of delivered documents, type + date (FEAT-05.2)

— V1+ additions, added only once their division module exists —
Academy (if the client is also a learner or has enrolled staff)  [V1]
Tech (project/ticket status)  [V2]
Data (report/dashboard delivery)  [V2]
```

**Note on structure, not just content:** the Client Portal's navigation should stay flat (Status, Deliverables — two items) through MVP. Adding a third top-level item before a third thing exists to show would be structure ahead of substance.

## 3. Staff / Internal Portal [MVP: Advisory workflow only; V1: multi-role]

```
Login  [MVP]

Clients (Advisory)  [MVP]
├── Client list, sorted by compliance due date (FEAT-06.1)
└── Client detail
    ├── Mark close-out/filing complete (FEAT-06.2)
    └── Upload Deliverable (FEAT-06.3)

Leads (CRM foundation)  [MVP]
└── Lead list with status/channel (FEAT-03.1), convert-to-client action (FEAT-03.2)

Internal Reporting  [MVP]
├── Advisory summary (FEAT-07.1)
└── Lead pipeline summary (FEAT-07.2)

— V1 additions —
Academy (Trainer view)  [V1]
├── Cohort roster / enrollment (FEAT-08.2)
├── Attendance (FEAT-08.3)
└── Assessment & certificate issuance (FEAT-08.4)

— V2 additions —
Tech Operations  [V2]
└── Ticket list, severity/status (FEAT-10.1), uptime log (FEAT-10.2)

Data  [V2]
└── External client report/dashboard management (FEAT-11.1)
```

**Note:** the Staff Portal's top-level navigation should only show sections relevant to the logged-in staff member's role, per the Data Privacy Policy's per-division access rule (`docs/business/ROLE_MATRIX.md` §4) — an Advisory Associate should not see an empty "Academy" section before V1 introduces it, nor after, unless their role covers it.

## 4. Admin Platform [V1]

```
Login  [V1, same auth system as Staff Portal with an admin role]

Users  [V1]
├── User list (FEAT-09.1)
└── Add / deactivate user (FEAT-09.2)

— V2 additions —
Access Review  [V2]
└── Exportable access list (FEAT-12.2)
```

**Deliberately minimal at V1:** no organization-wide settings, billing configuration, or activity-code/compliance-calendar administration UI is scoped — none of these have a documented product need beyond what a human (the MD) already handles directly today.

## Cross-surface navigation principles (structural, not visual)

- **One login surface conceptually serves both roles** (staff and client use the same authentication mechanism per `docs/product/PRODUCT_BACKLOG.md` EPIC-04), but the *content* each sees afterward is entirely separate — a client should never see a navigation item that hints at internal tools existing, and vice versa.
- **No surface exposes a section before its underlying module ships.** The IA above is intentionally the same shape as the roadmap in `docs/product/PRODUCT_ROADMAP.md` — this is deliberate, not a coincidence: navigation structure should never promise a capability that doesn't exist yet.
- **The public website and the authenticated platform are structurally separate**, connected only by the Contact/Enroll actions and, later, the post-signup credential handoff (Journey 5 in `USER_JOURNEY_MAP.md`) — there is no shared navigation chrome assumed between them at this stage.

## What this document does not do

It does not specify page layouts, visual hierarchy, component choice, or responsive behavior — those are design decisions for a later phase, informed by `EXPERIENCE_REQUIREMENTS.md` and the existing Brand Identity Guide, not by this document.
