# Z-GATE Digital Platform — Product Requirements Document (PRD)

## 1. Problem statement

Z-GATE LTD operates today (Phase 0/1 discovery) entirely without software: leads, client compliance status, bookkeeping close-outs, Academy enrollment, and internal reporting all run manually across WhatsApp, spreadsheets, and memory, held together by a single founder. The company's own 90-Day Business Plan already commits to building an internal Advisory client portal and a Data reporting pipeline as its first Tech deliverables (`docs/business/CROSS_DIVISION_WORKFLOWS.md` §3, §5) — this PRD turns that commitment, plus the surrounding business requirements, into a scoped, sequenced product.

## 2. Goals and non-goals

**Goals** — see `PRODUCT_VISION.md` for the full statement. In short: make Advisory's compliance work provably reliable, turn the lead pipeline into a system, prove Tech/Data internally before selling them, extend to Academy only once Advisory is running, and never build ahead of a signed business decision.

**Non-goals (explicit anti-scope):**
- Not building a full CRM/marketing-automation suite — the CRM foundation is a lead-tracking and conversion tool, not a sales-automation platform.
- Not replacing Z-GATE's EBM billing relationship with a custom-built invoicing/EBM system.
- Not building any AI feature — no approved business document scopes this; see `PRODUCT_ROADMAP.md` Future tier.
- Not building screens for roles that don't exist yet (Service Delivery Lead, Division Manager, DPO) — the data model should accommodate them later; the UI should not.
- Not building for Tech-external or Data-external clients before their internal versions have run for at least one real cycle.

## 3. Scope by module

The operating brief's 13 conceptual components, mapped to when (if ever) each is built, and why:

| Module | Phase | Why this phase |
|---|---|---|
| Public Website | MVP | Prospect persona has zero web presence today; needed to support lead generation and credibility |
| Lead Generation (capture) | MVP | Directly serves the Marketing Coordinator's existing weekly KPI obligation |
| CRM foundation | MVP | Same lead pipeline needs a structured home instead of three disconnected channels |
| Authentication | MVP | Hard dependency for Client Portal and any staff-facing tool |
| Client Portal (Advisory only) | MVP | This IS the company's committed Month-3 Tech deliverable |
| Advisory operational workflow (internal) | MVP | The engine behind the Client Portal; Advisory Associate's core daily tool |
| Internal reporting | MVP | This IS the company's committed Data reporting-pipeline deliverable, scoped to internal use first |
| Staff Portal (formalized, multi-role) | V1 | Only needed once more than one internal role (Trainer, beyond Advisory Associate) uses the platform |
| Academy | V1 | Sequenced behind Advisory per the company's own strategy |
| Admin Platform (users/roles/SLA tracking) | V1 | Needed once more than one division and more than a handful of users exist |
| Client Portal expansion (Tech, Data) | V2 | Requires Tech-ops and Data modules to exist first, and external clients to exist for them |
| Tech Operations (ticketing, uptime) | V2 | Follows the first external Tech client, not before |
| Data/BI expansion (external clients) | V2 | Follows the first external Data client, not before |
| Security hardening (MFA enforcement, access review tooling, breach/DPIA workflow) | V2 | Builds on the Data Privacy Policy's already-committed controls once enough real usage exists to harden against |
| Advanced AI | Future, unscoped | No approved business document currently supports this — see `docs/business/OPEN_BUSINESS_QUESTIONS.md` #16 |

## 4. Module specifications (Why / For whom / Outcome / Dependency / Simplest valuable implementation)

### 4.1 Public Website [MVP]
- **Why:** No web presence exists; the brand guide and mission/vision copy exist but nowhere to publish them.
- **For whom:** Prospect persona (any channel), plus a credibility check for Eric-type corporate leads before they engage.
- **Outcome:** A visitor can understand the four divisions and Z-GATE's positioning in under a minute, and leave contact details.
- **Dependency:** Brand Identity Guide (already exists — `docs/discovery/UI_UX_AUDIT.md`), Mission/Vision copy (already exists).
- **Simplest valuable implementation:** A handful of static pages (home, four division pages, contact) using the existing approved copy and brand tokens verbatim — no CMS needed yet.

### 4.2 Lead Generation (capture) [MVP]
- **Why:** Directly serves the 500+ qualified-contact Day-90 KPI already owed by the Marketing Coordinator role.
- **For whom:** Marketing Coordinator, MD.
- **Outcome:** Every website contact-form submission becomes a trackable lead record; WhatsApp/Facebook/LinkedIn leads can be logged manually into the same place.
- **Dependency:** Public Website (for the form); CRM foundation (to store the result).
- **Simplest valuable implementation:** One contact form → one lead record with channel, stated need, and status. No multi-step funnel builder.

### 4.3 CRM foundation [MVP]
- **Why:** Replaces informal tracking with something the Marketing Coordinator can report from directly.
- **For whom:** Marketing Coordinator, Advisory Associate (marks a lead "converted to client"), MD.
- **Outcome:** A lead's channel, status (new/qualified/converted/lost), and division fit are visible in one place; weekly KPI reporting becomes a query, not a reconciliation exercise.
- **Dependency:** Lead Generation capture.
- **Simplest valuable implementation:** A single lead list with status and channel fields — no pipeline stages, scoring, or automation beyond that.

### 4.4 Authentication [MVP]
- **Why:** Hard prerequisite for any staff or client login.
- **For whom:** Advisory Associate (staff), Solange-type clients (Client Portal), MD.
- **Outcome:** Only the right person sees the right engagement's data, consistent with the Data Privacy Policy's least-privilege, logged-access requirement (`docs/business/BUSINESS_RULES.md` §4).
- **Dependency:** None (foundational).
- **Simplest valuable implementation:** Email/password (or equivalent single method) login with two roles at launch — staff and client — not a full RBAC system yet (that's Admin Platform, V1).

### 4.5 Client Portal — Advisory only [MVP]
- **Why:** This is the company's own committed Month-3 Tech deliverable, not a discretionary feature.
- **For whom:** Solange-type Advisory clients.
- **Outcome:** A client can see their compliance-calendar status and retrieve Deliverables without messaging the Advisory Associate to ask.
- **Dependency:** Authentication; Advisory operational workflow (to have data to show).
- **Simplest valuable implementation:** A read-only view of: current filing/compliance status, next due date, and a list of delivered documents. No messaging, no self-service filing, no payment features in MVP.

### 4.6 Advisory operational workflow (internal) [MVP]
- **Why:** The Advisory Associate's entire job today runs on memory and manual tracking; this is the highest-leverage internal tool given Advisory is the revenue anchor.
- **For whom:** Advisory Associate, MD.
- **Outcome:** A client list sorted by compliance-calendar due date; ability to mark a monthly close-out or filing complete; ability to upload a Deliverable that the client then sees in their portal.
- **Dependency:** Authentication.
- **Simplest valuable implementation:** One list view + one detail view per client, with manual status updates (complete/not complete) — no automated filing integration with RRA/EBM systems.

### 4.7 Internal reporting [MVP]
- **Why:** This is the company's committed Data reporting-pipeline deliverable, and the documented first proof that "the four divisions compound each other" (`docs/business/CROSS_DIVISION_WORKFLOWS.md` §5).
- **For whom:** MD, Data Analyst.
- **Outcome:** One view showing Advisory's client count, filing on-time rate, and the lead pipeline's funnel numbers — replacing the MD's manual weekly round-up (Journey 3).
- **Dependency:** Advisory operational workflow, CRM foundation (as data sources).
- **Simplest valuable implementation:** A small number of pre-defined summary numbers/tables, refreshed on demand — not a configurable BI tool.

### 4.8–4.14 V1/V2/Future modules

Specified at feature level in `PRODUCT_BACKLOG.md` rather than repeated here — each carries the same Why/For whom/Outcome/Dependency/Simplest-implementation discipline, gated behind its phase's entry criteria in `PRODUCT_ROADMAP.md`.

## 5. Dependencies on unresolved business decisions

The following blockers from `docs/business/OPEN_BUSINESS_QUESTIONS.md` constrain product scope directly and are not re-litigated here:
- Bracketed SLA terms (#8) — affects any future feature that displays contract term/payment due dates to a client.
- Cross-Schedule billing consolidation (#6) — blocks any V2 unified-invoice feature.
- Shared vs. siloed Client record (#4) — blocks the V1/V2 multi-division Client Portal (Eric's journey) until answered; MVP avoids this by being Advisory-only.
- AI/Cybersecurity/Data Engineering scope confirmation (#16) — blocks the entire Future tier.

## 6. Success metrics

See `PRODUCT_KPIS.md`.

## 7. First implementation-ready vertical slice

See `PRODUCT_ROADMAP.md` §"First vertical slice" and `USER_STORIES.md`/`ACCEPTANCE_CRITERIA.md` for the concrete, buildable slice: **Lead capture on the public website → CRM foundation record → Advisory Associate converts lead to client → client receives portal access → client views their (seeded/manually-entered) compliance status.** This single thread touches every MVP module exactly once and is independently demonstrable end-to-end.
