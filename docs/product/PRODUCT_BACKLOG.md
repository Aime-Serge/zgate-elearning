# Z-GATE Digital Platform — Product Backlog

Epics → Features, each answering **Why? / For whom? / What outcome? / What dependency? / Simplest valuable implementation?** per the anti-feature-creep discipline this phase requires. Every feature is tagged to its `PRODUCT_ROADMAP.md` phase. IDs are stable references for `USER_STORIES.md` and `ACCEPTANCE_CRITERIA.md`.

---

## EPIC-01 — Public Website [MVP]

### FEAT-01.1 — Home + division pages
- **Why:** No web presence exists at all today (Phase 0 finding).
- **For whom:** Prospect persona, any channel.
- **Outcome:** A visitor understands the four divisions and Z-GATE's positioning in under a minute.
- **Dependency:** Approved brand tokens and mission/vision copy (already exist).
- **Simplest valuable implementation:** 5 static pages (home + 4 division pages) using existing approved copy verbatim, brand colors/type from the Brand Identity Guide. No CMS.

### FEAT-01.2 — Contact page with lead form
- **Why:** A prospect needs a way to act on interest without falling back to informal channels only.
- **For whom:** Prospect persona; feeds EPIC-02.
- **Outcome:** Form submission becomes a lead record.
- **Dependency:** FEAT-02.1.
- **Simplest valuable implementation:** Name, contact info, stated need, one submit action.

---

## EPIC-02 — Lead Generation (capture) [MVP]

### FEAT-02.1 — Structured lead capture
- **Why:** Directly serves the Marketing Coordinator's existing weekly KPI obligation (500+ qualified contacts by Day 90).
- **For whom:** Marketing Coordinator, MD.
- **Outcome:** Every website submission becomes a trackable record with channel + stated need.
- **Dependency:** None (first module in the chain).
- **Simplest valuable implementation:** One record type: name, contact, channel, stated need, timestamp.

### FEAT-02.2 — Manual lead entry (non-web channels)
- **Why:** Most leads today arrive via WhatsApp/Facebook/LinkedIn, not the website — the KPI target counts all channels (Business Plan §A10).
- **For whom:** Marketing Coordinator.
- **Outcome:** A WhatsApp inquiry can be logged in the same place as a web form lead, so the weekly report is one query, not three reconciliations.
- **Dependency:** FEAT-02.1's data structure.
- **Simplest valuable implementation:** A simple "add lead manually" form with the same fields as FEAT-02.1.

---

## EPIC-03 — CRM Foundation [MVP]

### FEAT-03.1 — Lead list with status
- **Why:** Replaces informal tracking with something reportable.
- **For whom:** Marketing Coordinator, Advisory Associate, MD.
- **Outcome:** Status (new / qualified / converted / lost) visible per lead; weekly KPI becomes a query.
- **Dependency:** FEAT-02.1, FEAT-02.2.
- **Simplest valuable implementation:** One list view, filterable by status and channel — no pipeline-stage automation, no scoring.

### FEAT-03.2 — Convert lead to client
- **Why:** The moment a lead becomes a real Advisory client needs to be recorded, since it's the trigger for Client Portal access.
- **For whom:** Advisory Associate, MD.
- **Outcome:** A lead becomes a Client record; the SLA-signing step itself stays outside the product (a business/legal step, not a feature — per `PRD.md` non-goals).
- **Dependency:** FEAT-03.1.
- **Simplest valuable implementation:** One action ("mark converted") that creates a Client record linked to the original lead.

---

## EPIC-04 — Authentication [MVP]

### FEAT-04.1 — Staff login
- **Why:** Hard prerequisite for any internal tool.
- **For whom:** Advisory Associate, MD.
- **Outcome:** Only staff can access internal tools.
- **Dependency:** None (foundational).
- **Simplest valuable implementation:** Single email/password login, one "staff" role at launch.

### FEAT-04.2 — Client login
- **Why:** Hard prerequisite for the Client Portal.
- **For whom:** Solange-type Advisory clients.
- **Outcome:** A client can access only their own engagement's data — consistent with the Data Privacy Policy's least-privilege rule.
- **Dependency:** FEAT-03.2 (a Client record must exist to attach a login to).
- **Simplest valuable implementation:** Same login mechanism as FEAT-04.1, one "client" role, scoped to exactly one Client record per login.

---

## EPIC-05 — Client Portal (Advisory only) [MVP]

### FEAT-05.1 — Compliance status view
- **Why:** This is the company's committed Month-3 Tech deliverable, not a discretionary feature.
- **For whom:** Solange-type clients.
- **Outcome:** A client sees their current filing/compliance status and next due date without messaging the Advisory Associate.
- **Dependency:** FEAT-04.2, FEAT-06.1 (the data this view displays).
- **Simplest valuable implementation:** A read-only page: status, next due date, plain-language explanation. No self-service filing.

### FEAT-05.2 — Deliverables list
- **Why:** Clients currently receive documents via WhatsApp/email with no central record.
- **For whom:** Solange-type clients.
- **Outcome:** A client can retrieve their monthly bookkeeping reports and filed-return copies in one place.
- **Dependency:** FEAT-06.3.
- **Simplest valuable implementation:** A simple list of uploaded documents with date and type — no versioning, no commenting.

---

## EPIC-06 — Advisory Operational Workflow (internal) [MVP]

### FEAT-06.1 — Client list sorted by compliance due date
- **Why:** The Advisory Associate's job runs entirely on memory today; Advisory is the revenue anchor, making this the highest-leverage internal tool.
- **For whom:** Advisory Associate, MD.
- **Outcome:** No client's filing deadline is missed because it wasn't top-of-mind.
- **Dependency:** FEAT-03.2 (Client records).
- **Simplest valuable implementation:** One sortable list: client name, next due item, due date, status.

### FEAT-06.2 — Mark close-out/filing complete
- **Why:** Tracks the 5th-business-day close-out target and the ≥2-business-day-ahead filing target (SLA Schedule A) against reality.
- **For whom:** Advisory Associate.
- **Outcome:** A completed action is timestamped, so "did we hit the SLA target" is answerable, not assumed.
- **Dependency:** FEAT-06.1.
- **Simplest valuable implementation:** A "mark complete" action per client per month, timestamped automatically.

### FEAT-06.3 — Upload a Deliverable
- **Why:** Deliverables (defined term, SLA Clause 1) currently go out over WhatsApp/email with no record.
- **For whom:** Advisory Associate.
- **Outcome:** Feeds FEAT-05.2 directly — one upload action makes the document visible to the client.
- **Dependency:** FEAT-06.1.
- **Simplest valuable implementation:** File upload attached to a client record, with a type tag (report/filing copy/other).

---

## EPIC-07 — Internal Reporting [MVP]

### FEAT-07.1 — Advisory summary numbers
- **Why:** This IS the company's committed Data-reporting-pipeline deliverable, scoped internally first (`docs/business/CROSS_DIVISION_WORKFLOWS.md` §5).
- **For whom:** MD, Data Analyst.
- **Outcome:** Replaces the MD's manual weekly status round-up with a single view: active client count, on-time filing rate, upcoming due items.
- **Dependency:** FEAT-06.1, FEAT-06.2 (data sources).
- **Simplest valuable implementation:** A handful of pre-defined counts/rates on one page, refreshed on view — not a configurable BI tool.

### FEAT-07.2 — Lead pipeline summary
- **Why:** Same KPI-reporting need as FEAT-03.1, viewed from the MD's cross-division vantage point.
- **For whom:** MD.
- **Outcome:** MD sees lead volume/conversion without asking the Marketing Coordinator directly.
- **Dependency:** FEAT-03.1.
- **Simplest valuable implementation:** Count of leads by status and channel, same page as FEAT-07.1.

---

## EPIC-08 — Academy [V1]

### FEAT-08.1 — Course & cohort listing (public)
- **Why:** Aline persona needs to discover and understand a course before enrolling.
- **For whom:** Aline-type prospects.
- **Outcome:** Course dates, fee, and outcomes visible without a manual inquiry.
- **Dependency:** EPIC-01 (website infrastructure).
- **Simplest valuable implementation:** A page per course, using the already-approved Academy Course Curriculum content.

### FEAT-08.2 — Enrollment
- **Why:** Enrollment confirmation has a 2-business-day SLA target (Schedule B) that's currently tracked manually.
- **For whom:** Aline-type learners, Academy Trainer.
- **Outcome:** A learner's enrollment is confirmed and trackable against the SLA target.
- **Dependency:** FEAT-08.1, FEAT-04.1/04.2 (roles).
- **Simplest valuable implementation:** A short enrollment form; Trainer confirms with one action.

### FEAT-08.3 — Attendance tracking
- **Why:** Feeds the 90%-session-completion SLA metric, currently tracked on paper.
- **For whom:** Academy Trainer.
- **Outcome:** Per-session attendance recorded; completion rate calculable.
- **Dependency:** FEAT-08.2.
- **Simplest valuable implementation:** A checklist per session per cohort.

### FEAT-08.4 — Assessment & certificate issuance
- **Why:** Certificate issuance has a 5-business-day SLA target (Schedule B); no retake process is documented, so none is built (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #12).
- **For whom:** Academy Trainer, learners.
- **Outcome:** Pass/fail recorded; certificate generated and timestamped against the target for a pass.
- **Dependency:** FEAT-08.3.
- **Simplest valuable implementation:** One score/pass-fail entry per learner; certificate as a generated document, no retake workflow.

---

## EPIC-09 — Staff Portal & Admin Platform (basics) [V1]

### FEAT-09.1 — Multi-role access
- **Why:** V1 introduces a second internal role (Academy Trainer) beyond Advisory Associate — MVP's two-role auth (FEAT-04.1/04.2) doesn't distinguish staff roles from each other.
- **For whom:** MD (administering access), all staff.
- **Outcome:** Each staff member sees only the tools/data relevant to their division, per the Data Privacy Policy's access-matrix rule (`docs/business/ROLE_MATRIX.md` §4).
- **Dependency:** FEAT-04.1.
- **Simplest valuable implementation:** A role field per staff account (Advisory / Academy / cross-divisional), gating which module a user sees.

### FEAT-09.2 — Add/remove user access
- **Why:** Currently any access change would require a developer; that doesn't scale past MVP's single hire.
- **For whom:** MD.
- **Outcome:** MD can onboard/offboard a staff account without engineering involvement.
- **Dependency:** FEAT-09.1.
- **Simplest valuable implementation:** A simple user list with add/deactivate actions — no approval workflows yet.

---

## EPIC-10 — Tech Operations [V2]

### FEAT-10.1 — Support ticket logging
- **Why:** SLA Schedule C's response/resolution targets (2h critical, 4h high-priority, 2 business days standard) are untrackable without a record, and only become relevant once a real external Tech client exists.
- **For whom:** Junior Developer / Tech function, external Tech clients.
- **Outcome:** A ticket's severity and response time are recorded against its SLA target.
- **Dependency:** V2 entry criteria (a real external Tech client) — see `PRODUCT_ROADMAP.md`.
- **Simplest valuable implementation:** Ticket record with severity, timestamps, status — no automated routing/SLA-timer alerts yet.

### FEAT-10.2 — Hosted-system uptime tracking
- **Why:** The 99% monthly uptime commitment (Schedule C) needs a record to report against.
- **For whom:** Junior Developer, external Tech clients (via the monthly report commitment, Data Privacy Policy Annex C).
- **Outcome:** A monthly uptime/incident report can be generated instead of assembled manually.
- **Dependency:** FEAT-10.1.
- **Simplest valuable implementation:** Manual/simple automated uptime log per hosted system, summarized monthly.

---

## EPIC-11 — Data/BI Expansion (external) [V2]

### FEAT-11.1 — External client report/dashboard delivery
- **Why:** Internal reporting (EPIC-07) proved the pipeline; this extends it to a paying Data client, per the Business Plan's Month-3+ external-client target.
- **For whom:** Data Analyst, external Data clients.
- **Outcome:** A Data client receives their monthly report/dashboard through the platform, not ad hoc.
- **Dependency:** EPIC-07, a real external Data client (V2 entry criteria).
- **Simplest valuable implementation:** Reuse the FEAT-07.1 reporting mechanism, scoped to one external client's data, access-controlled per Data Privacy Policy Annex D (working copies deleted once accepted, access-controlled channel only).

---

## EPIC-12 — Security Hardening [V2]

### FEAT-12.1 — MFA enforcement
- **Why:** Data Privacy Policy §7 already commits to MFA "where the underlying system supports it" — V2 is when usage volume justifies building it in, rather than at MVP scale (a handful of users).
- **For whom:** All staff and client users.
- **Outcome:** Reduces account-compromise risk as user count grows past MVP scale.
- **Dependency:** EPIC-04 (auth foundation).
- **Simplest valuable implementation:** Standard second-factor login step, opt-in for clients, required for staff.

### FEAT-12.2 — Quarterly access review support
- **Why:** Data Privacy Policy §7 commits to reviewing role-based access at least quarterly — a manual process today, but MVP's small user count makes tooling for it premature until V2.
- **For whom:** MD (or Division Manager, once hired).
- **Outcome:** A reviewable list of who has access to what, replacing ad hoc memory.
- **Dependency:** FEAT-09.1 (roles must exist to review).
- **Simplest valuable implementation:** An exportable access list, not an automated review workflow.

---

## EPIC-13 — Future / Unscoped [Future, not detailed]

Deliberately not broken into features. Each requires a Managing Director scope decision before any backlog item is written: **Advanced AI** (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #16), **Cybersecurity as a service line**, **Countryside/Phase 2 platform support**, **"Z-GATE People" tooling**. Writing features for these now would be exactly the feature creep this phase is meant to prevent.
