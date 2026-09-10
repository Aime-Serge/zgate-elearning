# Z-GATE Role Matrix

Roles as documented — not invented job titles. Distinguishes **CONFIRMED** (a named hire or a role explicitly defined in an approved document) from **IMPLIED, UNFILLED** (a role the SLA/policy documents reference structurally but which has no named person or hiring plan yet).

## 1. Internal roles

| Role | Status | Division | Reports to | Core responsibility | Source |
|---|---|---|---|---|---|
| **Managing Director** (also Board Chairperson) | CONFIRMED — Aime Serge UKOBIZABA | All (cross-divisional) | Founding shareholder (self) | Sole current decision authority; apex of both client escalation (SLA Level 3) and HR grievance (Clause 11) ladders; runs every division personally until hires land | Business Project Development Report §01; SLA Clause 8; HR Policy Clause 11 |
| **Advisory Associate / Bookkeeper** | CONFIRMED — Month 1 hire, indefinite-term | Advisory | MD | Bookkeeping, VAT/EBM filing support, routine client queries within SLA response time | HR Policy Manual Part 2 |
| **Marketing Coordinator** | CONFIRMED — Month 1 hire, part-time (20h/wk) | Cross-divisional (Marketing & Brand) | MD | Executes launch calendar, manages Facebook/LinkedIn, tracks lead KPIs | HR Policy Manual Part 2 |
| **Academy Trainer** | CONFIRMED — Month 2 hire, contract per cohort | Academy | MD | Delivers course sessions, tracks attendance/assessment, collects testimonials | HR Policy Manual Part 2; Academy Course Curriculum |
| **Junior Developer** | CONFIRMED — Month 3 hire, contract/internship | Tech | MD | Builds Advisory's client portal MVP and supports Data's reporting pipeline | HR Policy Manual Part 2 |
| **Data Analyst** | CONFIRMED — Month 3 hire, contract | Data | MD | Formalizes reporting templates, onboards first external Data client | HR Policy Manual Part 2 |
| **Service Delivery Lead** | **IMPLIED, UNFILLED** — structurally required per engagement, no named role/hire | Per-engagement (any division) | Division Manager | Level 1 escalation contact; routine query acknowledgment; day-to-day data handling accountability for a specific client engagement | SLA Clause 8; Data Privacy Policy §2 |
| **Division Manager** | **IMPLIED, UNFILLED** — no distinct role exists yet; divisions currently run through the MD directly | Per-division | MD | Level 2 escalation; resolves issues unresolved after 2 business days or any missed SLA target | SLA Clause 8 |
| **Data Protection Officer (DPO)** | **IMPLIED, UNFILLED** — explicitly "Pending" designation | Cross-divisional | MD | Company-wide breach coordination, NCSA registration owner, DPIA oversight, data-subject/client request handling | Data Privacy Policy §2, Approval checklist |

**Open question:** until Service Delivery Lead / Division Manager roles are filled, does the MD functionally hold Levels 1–3 simultaneously? See `OPEN_BUSINESS_QUESTIONS.md` #1.

## 2. Client-side roles

| Role | Description | Source |
|---|---|---|
| **Client** (legal entity) | Data controller by default under Law N° 058/2021; signs the Master SLA; confirms lawful basis for any personal data shared | SLA Clause 6; Data Privacy Policy §2 |
| **Client Primary Contact / Signatory** | Named signatory on the SLA; receives deliverables and escalations | SLA Part 1, signature page |

## 3. External / regulatory roles (not Z-GATE staff, but named actors in documented workflows)

| Role | Relevance | Source |
|---|---|---|
| **Licensed Rwandan legal counsel** | Must review the SLA, HR Policy, Data Privacy Policy, and RDB memo before any is adopted/signed/filed | Disclaimer on every business document reviewed |
| **Rwanda Revenue Authority (RRA)** | Regulator for Advisory's tax representation, VAT/EBM filings; receives statutory filings | SLA Schedule A; Business Project Development Report §06 |
| **National Cyber Security Authority (NCSA) / Data Protection Office** | Regulator for data protection; breach-notification recipient (`databreach@dpo.gov.rw`); issues data-controller/processor registration and offshore-transfer certificates | Data Privacy Policy §2, §6, §9 |
| **RDB One Stop Centre / Office of the Registrar General** | Company registration authority; activity-code amendments filed here | RDB Activity-Code Review Memo §4 |

## 4. Per-division data access matrix (business rule, not an invented access-control design)

Sourced directly from the Data Privacy & Security Policy's division annexes (Annex A–D) — these are documented rules Z-GATE has already committed to, not a future system's permission model:

| Role | Advisory data | Academy learner data | Tech systems/credentials | Data-division datasets |
|---|---|---|---|---|
| Advisory Associate | Full — assigned clients only, access logged | No | No | No |
| Academy Trainer | No | Full — assigned cohort only | No | No |
| Junior Developer | No | No | Full — assigned systems only; secrets never stored in plaintext | Shared hosting infrastructure only, not dataset contents |
| Data Analyst | No (unless separately assigned) | No | No | Full — assigned engagement only, named and logged |
| Marketing Coordinator | No | Aggregate cohort summary only (for testimonials/case studies), not individual learner records, and only with consent | No | No |
| Managing Director | Full (cross-divisional oversight) | Full | Full | Full |
| Data Protection Officer | Cross-divisional oversight for breach/DPIA purposes only — not routine operational access | Same | Same | Same |

## 5. Escalation ladder (shared structure — confirmed identical across two different documents)

The Client SLA's escalation clause (Clause 8) and the HR Policy's grievance procedure (Clause 11) use the **same three-level structure**, which this audit treats as a single company-wide escalation model rather than two separate ones:

| Level | Client-facing trigger (SLA Clause 8) | Internal trigger (HR Clause 11) | Handled by |
|---|---|---|---|
| 1 | Routine query / standard service request | Grievance first raised | Service Delivery Lead *(unfilled — see above)* |
| 2 | Unresolved after 2 Business Days, or any missed SLA target | Unresolved after Level 1 | Division Manager *(unfilled — see above)* |
| 3 | Unresolved after 5 Business Days, contractual dispute, suspension/termination matters | Unresolved after Level 2 | Managing Director |

## What this matrix does not do

It does not invent a "system role" model (Admin/Editor/Viewer, etc.) — that is application design, out of scope for this business-analysis phase. It reports only the organizational and data-access roles the business itself has already defined or clearly implied.
