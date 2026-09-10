# Z-GATE Business Workflows

Single-division (or division-internal) workflows, each specified as **Actor → Trigger → Input → Business Rule → Decision → Output → Notification → Audit Event**, sourced from approved documents. Cross-division workflows are in `CROSS_DIVISION_WORKFLOWS.md`. This document describes business processes — who does what, when, under what rule — not application screens, APIs, or data structures.

Status tags: **[CURRENT]** = already defined in a signed-template or active 90-day-plan process. **[FUTURE]** = named as a later-stage capability, not yet active.

---

## 1. Lead capture & qualification [CURRENT]

| Field | Detail |
|---|---|
| Actor | Marketing Coordinator (or MD, until hired) |
| Trigger | A prospect engages via Facebook, LinkedIn, WhatsApp Business, or an in-person/partnership channel (PSF chapters, RDB One Stop Centre) |
| Input | Channel-specific contact (WhatsApp message, LinkedIn inquiry, in-person conversation), prospect's stated need |
| Business Rule | Persona-to-division mapping guides qualification: CBD shop owners/traders → Advisory; corporates/operations managers → Advisory+Tech+Data bundle; youth/career-changers → Academy; NGOs/SMEs with manual records → Data (Business Plan §A3) |
| Decision | Qualify as a lead for one or more divisions, or disqualify |
| Output | Lead record with channel, segment, and division fit noted |
| Notification | Lead added to weekly KPI tracking (target: 500+ qualified contacts by Day 90) |
| Audit Event | None specified in source documents — lead-stage data handling is not yet covered by the Data Privacy Policy, which applies from the Client relationship onward |

## 2. Client onboarding & SLA execution [CURRENT]

| Field | Detail |
|---|---|
| Actor | MD (until a Service Delivery Lead exists) |
| Trigger | Qualified lead agrees to engage one or more divisions |
| Input | Client legal name, TIN/registration number, registered address; selected Service Schedule(s) A–D |
| Business Rule | Services outside a signed Schedule are out of scope, quoted separately (SLA Clause 3); Client confirms lawful basis for any personal data shared (SLA Clause 6) |
| Decision | Which Service Schedule(s) to attach; fee structure per Schedule |
| Output | Signed Master SLA + checked Service Schedule(s), Client becomes an active engagement |
| Notification | Client receives signed copy; internal record created for billing/delivery |
| Audit Event | Signature page retained (signatory name, title, National ID/Passport No., date) — SLA Part 1 signature block |

## 3. Advisory — monthly bookkeeping close-out [CURRENT]

| Field | Detail |
|---|---|
| Actor | Advisory Associate |
| Trigger | Calendar month-end |
| Input | Client's commercial transaction records for the month |
| Business Rule | Books must be closed and reconciled by the 5th Business Day of the following month (SLA Schedule A) |
| Decision | Reconciled vs. flagged for client follow-up (missing records) |
| Output | Monthly bookkeeping report and reconciled ledger |
| Notification | Delivered to Client as a Deliverable |
| Audit Event | Close-out date logged against the 5th-Business-Day target for SLA performance tracking |

## 4. Advisory — VAT/EBM filing [CURRENT]

| Field | Detail |
|---|---|
| Actor | Advisory Associate |
| Trigger | Approaching VAT/EBM statutory filing deadline |
| Input | Client's EBM records, reconciled ledger |
| Business Rule | Must file ≥ 2 Business Days before the statutory RRA deadline (SLA Schedule A); VAT registration itself is mandatory above RWF 5M/quarter or RWF 20M/year turnover (compliance calendar) |
| Decision | File as-is, or escalate to Client for missing information (extends the target per SLA Clause 9, not a missed-target event) |
| Output | Filed statutory return with RRA acknowledgment |
| Notification | Client notified of filing completion; compliance calendar updated |
| Audit Event | Filed copy + RRA acknowledgment retained as a Deliverable (SLA Schedule A) |

## 5. Advisory — urgent compliance issue response [CURRENT]

| Field | Detail |
|---|---|
| Actor | Advisory Associate → escalates per Clause 8 if unresolved |
| Trigger | Client reports an urgent issue (e.g., EBM device failure) |
| Input | Client's description of the issue |
| Business Rule | First response within 4 business hours (SLA Schedule A) |
| Decision | Resolve directly, or escalate (Level 1 → 2 → 3 per SLA Clause 8 if unresolved past the relevant window) |
| Output | Issue resolved or escalated with revised estimate communicated to Client |
| Notification | Client informed of resolution or escalation status |
| Audit Event | Response-time logged against the 4-business-hour target |

## 6. Advisory — annual income tax return filing [CURRENT]

| Field | Detail |
|---|---|
| Actor | Advisory Associate |
| Trigger | Annual filing window opens (January–March, per compliance calendar) |
| Input | Full year's reconciled records for the client |
| Business Rule | 100% on-time filing target, Jan–Mar (SLA Schedule A) |
| Decision | File on schedule; flag any client-caused delay separately (does not count as missed target, SLA Clause 9) |
| Output | Filed annual return with RRA acknowledgment |
| Notification | Client notified of completion |
| Audit Event | Filing date logged against the Jan–Mar / 100% on-time KPI |

## 7. Academy — learner enrollment [CURRENT]

| Field | Detail |
|---|---|
| Actor | Academy Trainer (or MD/Marketing Coordinator, pre-hire) |
| Trigger | Learner registers for a cohort (individual or via a corporate client) |
| Input | Learner name, contact details |
| Business Rule | Enrollment confirmed within 2 Business Days of registration (SLA Schedule B); cohort size target 15–20 learners |
| Decision | Confirm enrollment, or waitlist if cohort is full |
| Output | Confirmed enrollment with joining details |
| Notification | Learner receives confirmation |
| Audit Event | Enrollment record created — feeds the Month-3 cumulative "30+ learners trained" KPI |

## 8. Academy — course delivery & attendance tracking [CURRENT]

| Field | Detail |
|---|---|
| Actor | Academy Trainer |
| Trigger | Scheduled session date (per published curriculum) |
| Input | Session plan (Academy Course Curriculum module outline), attendance sheet |
| Business Rule | ≥ 90% session completion rate target (SLA Schedule B) |
| Decision | Session delivered as planned, or rescheduled |
| Output | Updated attendance record |
| Notification | None specified beyond internal tracking |
| Audit Event | Attendance logged — feeds both the SLA completion metric and the certificate-eligibility check |

## 9. Academy — assessment & certificate issuance [CURRENT]

| Field | Detail |
|---|---|
| Actor | Academy Trainer |
| Trigger | Course reaches its final session |
| Input | Learner's assessment performance (Course 1: 60% practical + 40% quiz; Course 2: live pass/fail EBM demo) |
| Business Rule | Pass mark 70% combined (Course 1); pass/fail live demonstration (Course 2); certificate issued within 5 Business Days of completion (SLA Schedule B) |
| Decision | Pass → issue certificate; fail → no certificate issued (no retake process specified — see `OPEN_BUSINESS_QUESTIONS.md`) |
| Output | Certificate naming the learner and course, or no certificate |
| Notification | Learner notified of result and certificate delivery |
| Audit Event | Certificate record retained; corporate clients additionally receive an end-of-cohort summary report (attendance + assessment results, aggregate only) |

## 10. Tech — critical outage response [CURRENT]

| Field | Detail |
|---|---|
| Actor | Junior Developer (or MD, pre-hire) |
| Trigger | A hosted production system goes down |
| Input | Incident report/alert |
| Business Rule | First response within 2 hours; resolution target 8 business hours (SLA Schedule C) |
| Decision | Remediate directly, or escalate if unresolved within target |
| Output | System restored; incident documented |
| Notification | Client notified per the monthly uptime/incident report commitment (Data Privacy Policy Annex C) |
| Audit Event | Incident logged with response/resolution timestamps against SLA targets |

## 11. Tech — standard change/feature request [CURRENT]

| Field | Detail |
|---|---|
| Actor | Junior Developer |
| Trigger | Client or internal stakeholder submits a change/feature request |
| Input | Change description, agreed project brief context |
| Business Rule | First response within 2 Business Days; delivery per agreed sprint plan (SLA Schedule C) |
| Decision | Accept into scope, or flag as out-of-Schedule work requiring a separate quote (SLA Clause 3) |
| Output | Change delivered, or quoted separately |
| Notification | Requester informed of acceptance/timeline or quote |
| Audit Event | Request logged against the 2-Business-Day first-response target |

## 12. Data — standard data processing/report delivery [CURRENT]

| Field | Detail |
|---|---|
| Actor | Data Analyst (or MD, pre-hire) |
| Trigger | Client submits data for processing, or a scheduled monthly reporting cadence arrives |
| Input | Client's raw dataset or records |
| Business Rule | Standard processing delivered within 3 Business Days of receipt; monthly report/dashboard by the 5th Business Day of the following month; 99.5% accuracy target, verified by sample audit (SLA Schedule D) |
| Decision | Deliver as processed, or flag data-quality issues back to Client |
| Output | Processed dataset or report/dashboard in the agreed format |
| Notification | Delivered via access-controlled channel (not open links/unsecured email — Data Privacy Policy Annex D) |
| Audit Event | Accuracy sample-audit result logged; working copies deleted once the Deliverable is accepted unless Client requests otherwise in writing |

## 13. Data — urgent data request [CURRENT]

| Field | Detail |
|---|---|
| Actor | Data Analyst |
| Trigger | Client submits a request outside the standard cadence |
| Input | Request description |
| Business Rule | First response within 1 Business Day (SLA Schedule D); if outside retainer scope, quoted separately as ad hoc analysis |
| Decision | Handle within retainer, or quote separately |
| Output | Response delivered, or quote issued |
| Notification | Client informed of handling path |
| Audit Event | Request logged against the 1-Business-Day target |

## 14. Billing & invoicing [CURRENT]

| Field | Detail |
|---|---|
| Actor | MD / Advisory Associate (billing function not assigned to a distinct role in any document) |
| Trigger | Monthly billing cycle (arrears) per engaged Service Schedule(s) |
| Input | Agreed fee structure per Schedule, delivered Deliverables for the period |
| Business Rule | Invoices exclusive of VAT unless stated; issued via EBM-compliant system; payable within [15] days (template placeholder); late beyond [30] days may trigger suspension on 7 days' notice (SLA Clause 4) |
| Decision | Invoice issued on schedule; suspension considered only after the late-payment threshold |
| Output | EBM-compliant invoice |
| Notification | Client receives invoice; suspension notice if applicable |
| Audit Event | Invoice and payment status recorded against the compliance calendar's EBM obligation |

## 15. Client escalation procedure [CURRENT]

| Field | Detail |
|---|---|
| Actor | Service Delivery Lead → Division Manager → Managing Director (first two roles currently unfilled — MD likely absorbs all three levels today) |
| Trigger | Routine query, unresolved issue, or missed SLA target |
| Input | Client's query or complaint |
| Business Rule | L1: acknowledged per Schedule's response time. L2: unresolved after 2 Business Days, or any missed target. L3: unresolved after 5 Business Days, contractual disputes, suspension/termination matters (SLA Clause 8) |
| Decision | Resolve at current level, or escalate |
| Output | Resolution, or escalation to next level |
| Notification | Client informed at each escalation step |
| Audit Event | Not explicitly specified — no formal escalation log format is defined in source documents (see `OPEN_BUSINESS_QUESTIONS.md`) |

## 16. Data breach response [CURRENT]

| Field | Detail |
|---|---|
| Actor | Discovering staff member/contractor → DPO |
| Trigger | Suspected or confirmed data breach |
| Input | Breach details (what data, how discovered) |
| Business Rule | Staff notifies DPO within 24 hours of discovery; DPO notifies NCSA within 48 hours of Z-GATE becoming aware (Law N° 058/2021, Art. 43–44); affected Client notified within 48 hours with description, data affected, containment steps (Data Privacy Policy §9) |
| Decision | Assess severity; determine if the breach is "likely to result in high risk," which shifts individual-notification responsibility to the Client (as controller) |
| Output | Breach report, containment actions, NCSA/Client notifications sent |
| Notification | DPO → NCSA; DPO → Client; Client → affected individuals (if high risk) |
| Audit Event | Breach record retained (discovery date, notification timestamps, containment steps) |

## 17. HR — recruitment & onboarding [CURRENT]

| Field | Detail |
|---|---|
| Actor | Managing Director |
| Trigger | A role from the hiring plan (HR Policy Part 2) becomes due (e.g., Month 1 Advisory Associate) |
| Input | Job description template, candidate application |
| Business Rule | Advertised with a written job description; probation 3 months (extendable once to 6 total); confidentiality undertaking + data-protection briefing completed before system access is granted (Data Privacy Policy §8) | 
| Decision | Hire, or continue search |
| Output | Signed employment/contractor agreement |
| Notification | New hire onboarded; Division lead informed |
| Audit Event | Signed confidentiality undertaking and briefing completion recorded before access is granted |

## 18. HR — grievance & disciplinary [CURRENT]

| Field | Detail |
|---|---|
| Actor | Employee → Division lead → Managing Director |
| Trigger | Employee raises a grievance, or a performance/conduct issue arises |
| Input | Grievance description, or documented performance/conduct concern |
| Business Rule | Grievance ladder mirrors client escalation (Division lead → MD, HR Clause 11); discipline follows verbal → written → final written → termination, except gross misconduct (immediate) |
| Decision | Resolve at current level, escalate, or proceed to disciplinary step |
| Output | Resolution, or documented disciplinary action |
| Notification | Employee informed at each step |
| Audit Event | Documented improvement plan (for underperformance) or disciplinary record retained |

## 19. RDB activity-code amendment [CURRENT — in progress, not completed]

| Field | Detail |
|---|---|
| Actor | Managing Director → licensed Rwandan corporate lawyer/notary |
| Trigger | Legal & Compliance review identifies REVIEW-status codes (completed: RDB Activity-Code Review Memo) |
| Input | List of 5 REVIEW-status codes and recommendation to remove |
| Business Rule | MD must approve; licensed counsel confirms filing type and whether a board resolution is needed (not required given single-shareholder structure, per the memo); filed via RDB One Stop Centre (Law N° 007/2021); RRA notified in writing within 7 days if tax categorization changes |
| Decision | Approve removal, or hold pending further review |
| Output | Amended RDB registration certificate |
| Notification | Updated certificate filed in Z-GATE's records; compliance checklist updated |
| Audit Event | Approval signature (currently blank in the memo) + amendment confirmation retained |

---

## What this document does not do

It does not propose a system, database, or UI to run any of these workflows — that is Phase 2+ work. It does not invent process steps the source documents are silent on (e.g., a certificate-retake process for a failed Academy assessment, or a formal escalation log format) — those gaps are listed in `OPEN_BUSINESS_QUESTIONS.md` rather than filled in with a plausible-sounding answer.
