# Z-GATE Domain Model

**Purpose:** A conceptual business-domain model — entities, attributes, and relationships as they exist in Z-GATE's approved business documents. This is **not** a database schema, ORM design, or implementation artifact — no data types, tables, or storage decisions are made here. It exists so that future technical design has an accurate, sourced picture of the business's own concepts to work from.

**Source order used:** approved business documents → Phase 0 audit (`docs/discovery/`) → repository (no code exists) → prior product decisions (none exist). Every entity below is traceable to a specific document; none are invented. Entities implied but not fully specified are marked **(partial)**.

---

## 1. Organization entities

| Entity | Business-meaningful attributes | Source |
|---|---|---|
| **Company** | Legal name (Z-GATE LTD), trading name (Z-GATE Solution), TIN/Company Code, registration date, registered office, share capital, financial year start | Business Project Development Report §01 |
| **Division** | Name (Advisory/Academy/Tech/Data), mission statement, brand color, registered activity codes in production | Mission/Vision doc; Brand Identity Guide; Business Project Development Report §03 |
| **ActivityCode** | RDB code, registered activity description, division, strategic status (CORE / ADJACENT / RESERVE / REVIEW) | RDB Activity-Code Review Memo; Business Project Development Report §02 |
| **Employee / Contractor** | Name, division, role/job description, employment type (indefinite / fixed-term / part-time / contract), reporting line, start date, probation status | HR Policy Manual Parts 1–2 |
| **JobDescription** | Role title, division, reports-to, employment type, working hours, location, indicative compensation, responsibilities, qualifications, KPIs | HR Policy Manual Part 2 |

## 2. Client-relationship entities

| Entity | Business-meaningful attributes | Source |
|---|---|---|
| **Prospect / Lead** | Source channel (Facebook/LinkedIn/WhatsApp/in-person/referral), persona segment (see below), status | Business Plan Part B (Personas, Channel Strategy) |
| **Client** | Legal name, TIN/registration number, registered/principal address, primary contact — becomes a Client once a Master SLA is signed | Client SLA Template, Part 1 signature block |
| **Contact** | Name, role at client, preferred channel **(partial — no formal Contact entity defined beyond the SLA signature block; inferred from persona and channel data)** | Business Plan Part B |
| **MasterSLA** | Client, effective date, initial term (template: 12 months), renewal terms, attached Service Schedules | Client SLA Template, Part 1, Clause 2–3 |
| **Engagement / Service Schedule** | Division, scope of services, fee structure, SLA performance targets, status, start date | Client SLA Template, Part 2 (Schedules A–D) |
| **Deliverable** | Type (report, filing, system, dataset, certificate), owning Engagement, due date, status — explicitly defined term in the SLA | Client SLA Template, Clause 1 (Definitions) |
| **Document** | Type, classification (Public / Internal / Confidential / Sensitive Personal Data), owning engagement/division | Data Privacy & Security Policy §3 |

**Persona segments** (used for lead qualification, not a CRM feature): Solange (CBD shop owner, Advisory), Eric (operations manager, Advisory+Tech+Data), Aline (recent graduate, Academy), Jean (cooperative lead, Phase 2/Academy) — Business Plan Part B.

## 3. Advisory-division entities

| Entity | Attributes | Source |
|---|---|---|
| **BookkeepingLedger / MonthlyClose** | Client engagement, month, reconciliation status, close-out date (target: 5th business day of following month) | SLA Schedule A |
| **TaxFiling** | Type (VAT/EBM, personal/business income tax, annual return), engagement, due date, filed date, RRA acknowledgment | SLA Schedule A; Business Project Development Report §06 |
| **ComplianceCalendar** | Client, obligation, trigger/timing, frequency | SLA Schedule A Deliverables; Business Project Development Report §06 |
| **EBMRecord (partial)** | Receipt records issued via EBM — entity implied by the EBM compliance service line but not itself specified as a business record beyond "filed copies with RRA acknowledgment" | SLA Schedule A |

## 4. Academy-division entities

| Entity | Attributes | Source |
|---|---|---|
| **Course** | Title, audience, duration, module outline, fee (RWF 40,000/learner), pass mark, learning objectives | Academy Course Curriculum, Parts 1–2 |
| **Cohort** | Course, cohort number, start month, target learner count (15–20), trainer | Academy Course Curriculum; SLA Schedule B |
| **Learner** | Name, contact details | SLA Schedule B; Data Privacy Policy Annex B |
| **Enrollment** | Learner, cohort, confirmation date (target: within 2 business days), status | SLA Schedule B |
| **AttendanceRecord** | Enrollment, session, present/absent — feeds the 90% session-completion SLA metric | SLA Schedule B; Academy Course Curriculum "Materials Checklist" |
| **Assessment** | Enrollment, type (practical exercise + quiz for Course 1; live pass/fail demo for Course 2), score, pass/fail | Academy Course Curriculum, Parts 2 |
| **Certificate** | Learner, course, issue date (target: within 5 business days of completion), certificate name | SLA Schedule B; Academy Course Curriculum |

## 5. Tech-division entities

| Entity | Attributes | Source |
|---|---|---|
| **Project / Build** | Internal or external, scope/brief, status — first internal builds are Advisory's client portal and Data's reporting pipeline | SLA Schedule C; Business Plan 90-Day Roadmap |
| **HostedSystem** | Owner (internal or client), monthly uptime target (99%, excl. scheduled maintenance) | SLA Schedule C |
| **SupportTicket / Incident** | Severity (critical outage / high-priority defect / standard change), first-response target, resolution target | SLA Schedule C |
| **Vendor / Sub-processor** | Name, service provided, data-safeguard assessment, named in applicable Service Schedule | Data Privacy Policy §8, §11 |

## 6. Data-division entities

| Entity | Attributes | Source |
|---|---|---|
| **Dataset** | Client/engagement, source, sensitivity classification | Data Privacy Policy Annex D |
| **ReportTemplate / Dashboard** | Format, delivery cadence (target: 5th business day of following month) | SLA Schedule D |
| **DataRequest** | Type (standard processing / urgent), received date, delivery target (3 business days standard, 1 business day urgent first response) | SLA Schedule D |
| **DataAccuracyAudit** | Dataset/deliverable, accuracy rate (target 99.5%), verification method (sample audit) | SLA Schedule D |

## 7. Compliance & governance entities

| Entity | Attributes | Source |
|---|---|---|
| **DataProtectionOfficer** | Internal or external, responsible for policy, NCSA registration, breach coordination, subject/client requests — role currently unfilled ("Pending") | Data Privacy Policy §2, Approval checklist |
| **DPIA** (Data Protection Impact Assessment) | Engagement, risk description, outcome — required before high-risk processing | Data Privacy Policy §12 |
| **DataBreach** | Discovery date/time, DPO notification (≤24h), NCSA notification (≤48h), Client notification (≤48h), containment steps | Data Privacy Policy §9 |
| **ConsentRecord (partial)** | Client's confirmation of lawful basis for shared personal data — referenced (SLA Clause 6 "Client confirms it has necessary consent") but no structured record format specified | Client SLA Template, Clause 6 |

## 8. HR entities

| Entity | Attributes | Source |
|---|---|---|
| **EmploymentContract** | Type, probation period (3 months, extendable once to 6 total), notice period | HR Policy Manual, Clauses 3–4, 12 |
| **LeaveBalance** | Accrual (1.5 days/month), carry rules, usable after 12 months' service | HR Policy Manual, Clause 6 |
| **PerformanceReview** | Employee, review date, outcome — occurs at 3-month probation mark, then ≥ every 6 months | HR Policy Manual, Clause 9 |
| **GrievanceCase** | Employee, level (Division lead → MD), status | HR Policy Manual, Clause 11 |

## 9. Financial entities

| Entity | Attributes | Source |
|---|---|---|
| **Invoice** | Client, engagement, amount, VAT treatment, EBM-compliant, due date, status | Client SLA Template, Clause 4 |
| **Payment (partial)** | Invoice, amount, date — no formal payment-record entity beyond "invoices payable within [15] days" | Client SLA Template, Clause 4 |
| **CostCategory / BudgetLine** | Staffing, marketing, tools/software, legal/compliance — used for internal 90-day/12-month planning, not a client-facing entity | 90-Day Financial Model |

---

## Relationships (business-level, not a schema)

- **Company** → has four **Divisions**; each **Division** owns one or more **ActivityCodes**.
- **Client** signs exactly one **MasterSLA**, which attaches one or more **Engagements** (Service Schedules A–D) — a Client may be served by 1–4 divisions concurrently under one relationship (this is the core "one gate, four rooms" structural fact, not an assumption).
- **Engagement** belongs to exactly one **Division** and produces one or more **Deliverables**.
- **Employee/Contractor** is assigned to specific **Engagements**; data-privacy rules require this assignment to be logged and least-privilege (Data Privacy Policy Annexes A–D) — see `ROLE_MATRIX.md`.
- **Advisory Engagement** → one **ComplianceCalendar**, many **TaxFilings**, one ongoing **BookkeepingLedger**.
- **Academy Engagement** (a corporate cohort) or an individual **Learner** enrolls in a **Cohort** of a **Course**; **Enrollment** produces **AttendanceRecords** and an **Assessment**, which may produce a **Certificate**.
- **Tech Engagement** → one or more **Projects/Builds** and/or **HostedSystems**, which generate **SupportTickets/Incidents**.
- **Data Engagement** → one or more **Datasets** and **DataRequests**, producing **ReportTemplates/Dashboards** subject to **DataAccuracyAudits**.
- **DataProtectionOfficer** has cross-division oversight of **DPIAs** and **DataBreaches** — the one entity explicitly scoped across all four divisions rather than per-division (Data Privacy Policy §2).
- **Invoice** belongs to one **Engagement** (or bundles multiple Engagements under one Client — **not specified**, see `OPEN_BUSINESS_QUESTIONS.md`).

## What this model deliberately does not do

- It does not assign primary keys, foreign keys, data types, or storage/indexing decisions — that is implementation work, out of scope for Phase 1.
- It does not invent entities beyond what the documents name or clearly imply (each "(partial)" tag above marks a spot where the documents gesture at an entity without fully specifying it — these are candidates for `OPEN_BUSINESS_QUESTIONS.md`, not filled in here).
- It does not resolve whether "Client" is one shared record across divisions or per-division records — this is a real open question (see `OPEN_BUSINESS_QUESTIONS.md` #3).
