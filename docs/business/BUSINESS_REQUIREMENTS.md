# Z-GATE Business Requirements

**Purpose:** What the business needs, sourced from approved documents — not a feature list, not an application spec. Every requirement below distinguishes **[CURRENT]** (already committed to in the 90-day plan / signed-template scope) from **[FUTURE]** (implied by the company's long-term philosophy or org structure but not yet operationalized). Nothing here is invented — where the documents are silent, that silence is recorded in `OPEN_BUSINESS_QUESTIONS.md`, not filled in with an assumed requirement.

## 1. Company-wide requirements

| Requirement | Status | Source |
|---|---|---|
| One Client relationship can span 1–4 division engagements under a single Master SLA | [CURRENT] | Client SLA Template, Part 1 |
| A shared 3-level escalation structure (Service Delivery Lead → Division Manager → MD) applies uniformly across client service and internal HR grievances | [CURRENT] | SLA Clause 8; HR Policy Clause 11 |
| A single company-wide Data Protection Officer function, not one per division | [CURRENT — role defined, unfilled] | Data Privacy Policy §2 |
| All client billing routes through an EBM-compliant billing system | [CURRENT] | SLA Clause 4 |
| Personal data defaults to Rwanda-based storage; any offshore transfer requires an NCSA certificate + client notice | [CURRENT] | Data Privacy Policy §6 |
| A single brand system (identity, voice, color-per-division) represents all four divisions as one company, not four separate brands | [CURRENT] | Brand Identity Guide |
| A unified lead-generation funnel (Facebook, LinkedIn, WhatsApp Business, in-person/partnerships) feeds prospects toward whichever division fits their need | [CURRENT] | Business Plan Part B |
| A regulatory compliance calendar (VAT, PAYE, EBM, BO updates, annual/quarterly filings) governs Z-GATE's own obligations, ahead of offering it as an Advisory client service | [CURRENT] | Business Project Development Report §06 |
| Cross-division referral/cross-sell mechanics (e.g., an Advisory client being offered Academy training) | [FUTURE — philosophy states the intent ("one gate, four rooms"); no documented trigger, owner, or process exists yet] | Mission/Vision doc; see `CROSS_DIVISION_WORKFLOWS.md` |
| A fifth division ("Z-GATE People" — staffing/HR services) | [FUTURE, explicitly on hold] | RDB Activity-Code Review Memo §3 |

## 2. Z-GATE Advisory requirements

| Requirement | Status | Source |
|---|---|---|
| Tax representation and advisory before RRA | [CURRENT — registered main business activity] | SLA Schedule A; Business Project Development Report §02 |
| Preparation/filing of personal and business income tax returns | [CURRENT] | SLA Schedule A |
| EBM setup support and ongoing compliance monitoring | [CURRENT — flagship entry point per market research: 59% of SMEs struggle with EBM] | SLA Schedule A; Business Plan §A1–A2 |
| Monthly bookkeeping and transaction recording | [CURRENT] | SLA Schedule A |
| Business & management advisory on request | [CURRENT] | SLA Schedule A |
| A productized, repeatable compliance calendar service for clients | [CURRENT — Day-90 target] | Business Plan §A10 |
| 10 active retainer clients by Day 90 | [CURRENT — target, actual progress unconfirmed] | Business Plan §A1, §A10 |

## 3. Z-GATE Academy requirements

| Requirement | Status | Source |
|---|---|---|
| Course design sourced from Advisory's own tax/bookkeeping/EBM expertise | [CURRENT] | Business Plan §A5–A6; Academy Course Curriculum |
| Two first courses: "Tax & Bookkeeping Fundamentals" (Cohort 1, Month 2) and "EBM & Digital Invoicing Mastery" (Cohort 2, Month 3) | [CURRENT] | Academy Course Curriculum |
| Enrollment, attendance tracking, and certificate issuance per course | [CURRENT] | SLA Schedule B |
| 2 cohorts run, 30+ learners trained cumulative by Day 90 | [CURRENT — target] | Business Plan §A10 |
| Computer repair training | [FUTURE — ADJACENT-status activity code, held for 6-month review] | RDB Activity-Code Review Memo |
| Countryside (Huye/Musanze) Academy roadshow | [FUTURE — Phase 2, Month 4+] | Business Plan §B6 |

## 4. Z-GATE Tech requirements

| Requirement | Status | Source |
|---|---|---|
| Design, development, and maintenance of software/systems/web applications per agreed brief | [CURRENT — service line registered and in SLA Schedule C] | SLA Schedule C |
| Onsite/remote management of client computer systems and data-processing facilities | [CURRENT] | SLA Schedule C |
| Hosting and infrastructure support for systems Z-GATE builds/manages | [CURRENT] | SLA Schedule C |
| First internal deliverable: Advisory's own client portal MVP | [CURRENT — Month 1–3 target] | Business Plan §A5–A6 |
| Second internal deliverable: Data's reporting pipeline | [CURRENT — Month 2 target] | Business Plan §A5–A6 |
| At least 1 external Tech client conversation in progress by Day 90 | [CURRENT — target] | Business Plan §A10 |
| Packaged software publishing | [FUTURE — ADJACENT, "relevant if Tech ships a packaged product"] | RDB Activity-Code Review Memo |
| Hosting/infrastructure as a standalone offered service | [FUTURE — ADJACENT] | RDB Activity-Code Review Memo |
| AI Solutions, Cloud & DevOps (as named sub-divisions), Cybersecurity | [FUTURE / UNCONFIRMED — named in this engagement's operating brief's org chart but not present in any approved Z-GATE document's current service scope; requires MD confirmation before being treated as active scope] | See `docs/discovery/BUSINESS_ALIGNMENT.md` |

## 5. Z-GATE Data requirements

| Requirement | Status | Source |
|---|---|---|
| Data entry and processing from client records into an agreed format | [CURRENT] | SLA Schedule D |
| Standard reporting and dashboard delivery on agreed cadence | [CURRENT] | SLA Schedule D |
| Ad hoc analysis on request (quoted separately if outside retainer scope) | [CURRENT] | SLA Schedule D |
| Standard reporting templates defined first against Advisory's own client data | [CURRENT — Month 1–2 target] | Business Plan §A5–A6 |
| 1 external Data client onboarded by Day 90 | [CURRENT — target] | Business Plan §A10 |
| Formal BI/analytics layer as a distinct offering beyond data entry/processing | [FUTURE — Business Project Development Report §03 frames this as Data's "highest-value near-term move," built largely by Tech, not yet operational] | Business Project Development Report §03 |
| Data Engineering, AI/ML (as named sub-divisions) | [FUTURE / UNCONFIRMED — same caveat as Tech above] | See `docs/discovery/BUSINESS_ALIGNMENT.md` |

## 6. Compliance & governance requirements

| Requirement | Status | Source |
|---|---|---|
| NCSA registration as data controller/processor | [CURRENT — required, status "Pending"] | Data Privacy Policy, Approval checklist |
| Designated Data Protection Officer | [CURRENT — required, status "Pending"] | Data Privacy Policy §2 |
| Data-breach notification workflow (DPO ≤24h, NCSA ≤48h, Client ≤48h) | [CURRENT — policy defined, not yet operationally tested] | Data Privacy Policy §9 |
| DPIA process before high-risk engagements | [CURRENT — policy defined] | Data Privacy Policy §12 |
| RDB activity-code amendment removing 5 REVIEW-status codes | [CURRENT — recommended, not filed; MD approval outstanding] | RDB Activity-Code Review Memo |
| Legal counsel review of SLA, HR Policy, Data Privacy Policy, RDB memo | [CURRENT — explicitly required before any is adopted; status unconfirmed] | Each document's own disclaimer |

## 7. Explicitly out of scope for this specification (not invented)

- No CRM, client portal, billing system, or any other application feature is specified here — that is Phase 2+ technical design, and this document deliberately stops short of it per the operating brief.
- No pricing tiers beyond the single planning-estimate figures in the Financial Model are defined — there is no documented tiered pricing model.
- No cross-division commission, referral fee, or internal transfer-pricing structure exists in any document — do not assume one for financial modeling.
- No service lines beyond the 11 CORE + 5 ADJACENT + 1 RESERVE registered activity codes are treated as current scope; the 5 REVIEW-status codes are explicitly recommended for removal, not expansion.

See `docs/discovery/BUSINESS_ALIGNMENT.md` for the fuller reconciliation between this engagement's operating-brief org chart and the company's actual registered/contracted scope.
