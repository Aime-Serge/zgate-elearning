# Business Alignment Audit

## Source of truth for this audit

Per explicit confirmation from the Managing Director (this session, 2026-09-10), the business source of truth is the set of documents found in this repository, plus the division structure pasted into the operating brief. No separate external business document store was named. **REQUIREMENT** statements below cite the specific source document.

**Company identity (FACT):**
- Legal name: **Z-GATE LTD**, company limited by shares, registered in Rwanda.
- Company Code / TIN: **156848508**. Registered: **19 August 2026**.
- Managing Director: **Aime Serge UKOBIZABA**.
- Share capital: **RWF 5,000,000** (100 ordinary shares × RWF 50,000).
- At registration, the company recorded **zero employees** — every division currently runs through the founder.
- Brand/trading name used in marketing copy and the brand guide: **"Z-GATE Solution"** (vs. the legal "Z-GATE LTD" used in the SLA/HR/legal documents). This is a naming-convention distinction to track, not necessarily a conflict — see `OPEN_QUESTIONS.md`.
- Motto: **"Where Business Meets Technology."** Core line (elevator pitch): *"One gate, four rooms, no translation lost between them."* — this exact phrase is in the approved mission/vision copy and matches the operating brief's stated philosophy. **No conflict.**

## Divisions as approved (FACT, from `zgate-mission-vision-about(1).md` and the RDB activity-code memo)

| Division | Mission (approved copy) |
|---|---|
| **Z-GATE Advisory** | Keep the business compliant, tax-efficient, and financially sound. |
| **Z-GATE Academy** | Build the specific, usable skills a team needs — capability, not a certificate. |
| **Z-GATE Tech** | Build the systems a business runs on — reliable, maintainable, explained plainly. |
| **Z-GATE Data** | Turn what a business already has into a clear, honest answer to "is this working." |

**Comparison to the operating brief's org chart:** The brief lists Tech as {Software Engineering, AI Solutions, Cloud & DevOps, Cybersecurity} and Data as {Data Analytics, Business Intelligence, Data Engineering, AI/ML}. **OPEN QUESTION / possible conflict:** none of the approved business documents (SLA Schedule C, RDB activity-code memo, brand guide) currently name "AI Solutions," "Cybersecurity," "Data Engineering," or "AI/ML" as active or near-term service lines. SLA Schedule C's actual scope is: software/systems/web-app development and maintenance, systems/data-processing management, hosting/infrastructure support. The RDB memo's ADJACENT-status codes (held, not core) include telecom capacity resale, packaged software publishing, and hosting infrastructure — but not AI or cybersecurity as named lines. **Recommended resolution:** treat the brief's four-sub-division breakdown as the *target future shape* of Tech and Data (consistent with the company's own long-term division names), not the *current* registered/contracted scope — do not build AI or cybersecurity service offerings into any near-term platform work without an explicit decision from the Managing Director, since it isn't in the approved 90-day plan.

## Business priority alignment (FACT — directly matches the operating brief's Section 20)

The approved 90-Day Business Plan independently arrives at the same sequencing the operating brief prescribes:
- **Advisory is the flagship/commercial anchor**, entering via the EBM/VAT compliance pain point (59% of Rwandan SMEs report difficulty operating Electronic Billing Machines; 51% cite affordability).
- **Academy, Tech, and Data are explicitly sequenced behind Advisory**, not launched simultaneously at full scope.
- **Tech and Data are built first as internal reference tools** (Advisory's own client portal; Advisory's own reporting pipeline) **before external sale** — the plan's own words: *"a working internal case study sells faster and costs less than a campaign."*
- Explicit Day-90 targets: Advisory 10 retainer clients; Academy 2 cohorts / 30+ learners; Tech — internal portal + reporting pipeline live, 1 external conversation open; Data — 1 external client onboarded.

**No conflict, no invented scope needed** — the operating brief's caution against "a massive enterprise platform before validating core workflows" (Section 20) is already the company's own stated strategy, not just a discovery-phase guardrail.

## Geographic/market scope (FACT, not previously implied by the operating brief — additive context)

- Phase 1: Kigali only (Nyarugenge CBD first, then Gasabo, then Kicukiro), first 90 days from 19 Aug 2026.
- Phase 2 (Month 4+): secondary cities Huye and Musanze, Academy-led rollout (training travels cheaper, builds trust before a compliance sale).
- Today is **2026-09-10 — Day 22 of the 90-day plan**, i.e. currently in Month 1, approaching the Month 1→2 transition. Current actual progress against the roadmap (clients signed, hires made) is not recorded anywhere in this repository — see `OPEN_QUESTIONS.md`.

## Cross-divisional shared capabilities implied by the approved documents (REQUIREMENT-shaped signal, not a design decision)

Identity/access, client records, documents, and communications are already described as shared across divisions in the SLA and Data Privacy Policy, even though no system exists yet to implement it:
- **One Master SLA + per-division Service Schedules** under one Client relationship (SLA Part 1/Part 2) — a Client entity that can hold 1–4 concurrent engagements is a first-class business concept, not an assumption.
- **Escalation ladder is shared** across all divisions: Service Delivery Lead → Division Manager → Managing Director (SLA Clause 8), mirrored exactly in the HR Policy's grievance procedure (Clause 11) — same 3-level structure reused for both client and internal escalation.
- **Confidentiality and data-protection obligations are company-wide**, not per-division (Data Privacy Policy Part 1 applies to "all four divisions"; HR Policy Clause 8 cross-references it).
- A **Data Protection Officer** role is shared across all client engagements company-wide (not appointed per division).

This directly supports the operating brief's Section 18 instinct (shared Identity/Clients/Documents/Projects/SLA capabilities) — it is confirmed by the business documents themselves, not just a technical best-practice assumption.

## Divergence/possible future division (FACT — flag, do not act)

The RDB activity-code memo notes one ADJACENT-status code (SN783001 — provision of human resources for client businesses) as *"a candidate for a future fifth division ('Z-GATE People') if staffing demand emerges."* This is explicitly "Hold — revisit at Month 6," not an approved fifth division. **Do not design for a fifth division now** — noted here only so it isn't rediscovered as a surprise later.

## Unresolved compliance item with direct brand impact (HIGH — see `RISKS.md`)

The RDB activity-code memo recommends removing 5 of Z-GATE's 21 registered business-activity codes (photojournalism, materials testing, architectural consulting, print/catalog publishing, inpatient consulting) because they are publicly visible on Z-GATE's RDB registration and unrelated to any of the four divisions — a reputational/credibility risk once marketing scales ("an unresolved mismatch between the public record and client-facing materials undercuts that credibility"). **The memo's own approval checkbox and Managing Director signature are blank** — this action has not been confirmed as complete or even approved as of the document's last recorded state.

## Registered-office address — RESOLVED (FACT, confirmed 2026-09-10)

The **Business Project Development Report** (`zgate-business-project-report.docx`, restating the RDB registration certificate) confirms the legal registered office as **Inyarurembo, Kiyovu, Nyarugenge, Kigali, Rwanda** — matching the SLA template. The Brand Identity Guide's letterhead ("Kigali Heights, KN 7 Ave") is a visual-mockup placeholder, not the real registered address. **Do not use the Kigali Heights address in any real filing, letterhead, or system.**

## Contact-detail discrepancy (FACT — newly found, unresolved)

The Business Project Development Report records Z-GATE's actual registered contact details as **phone +250 792 957 513, email `info@zgaterw.com`**. The Brand Identity Guide's mockups instead use a `zgate.co` domain (`a.mutoni@zgate.co`, `ZGATE.CO`) for its fictional persona cards. **Open question:** is `zgaterw.com` the company's real/intended production domain, with `zgate.co` just an aspirational placeholder chosen for the brand guide's visual mockups (shorter, cleaner for design purposes) — or is `zgate.co` actually the intended eventual domain and `zgaterw.com` a placeholder used only at RDB registration? Do not assume either is correct for a future platform's domain/email configuration without confirming. See `OPEN_QUESTIONS.md`.

## Full RDB activity-code portfolio (FACT, from Business Project Development Report §02 — the primary source the RDB Activity-Code Review Memo cites)

Z-GATE LTD's 21 registered activity codes (1 main + 20 other), sorted by division and strategic status:

| Division | CORE (active) | ADJACENT (hold, 6–12mo review) | RESERVE/REVIEW |
|---|---|---|---|
| **Advisory** | SM692005 (main activity — tax rep.), SM692004 (income tax filing), SM692001 (bookkeeping), SM702001 (business advisory), SM749011 (other technical consulting) | — | — |
| **Tech** | SJ620101 (software/web dev — flagship), SJ620202 (onsite systems mgmt) | SJ582001 (software publishing), SJ631201 (web directory/hosting), SJ631101 (hosting infrastructure, shared w/ Data) | SJ611002 (telecom capacity resale) — RESERVE |
| **Data** | SJ631106 (data entry), SJ631105 (data processing — flagship) | — | — |
| **Academy** | SP854914 (computer training — flagship) | SP852205 (computer repair training) | — |
| **New/5th line** | — | SN783001 (HR provision for clients — candidate future "Z-GATE People" division) | — |
| **Unrelated** | — | — | SM742003 (photojournalism), SM712001 (materials testing), SM711001 (architectural consulting), SJ581901 (print/catalog publishing), SQ862006 (inpatient consulting) — all **REVIEW, recommended for removal** |

**Minor documentation inconsistency (informational, not decision-relevant):** the report's own narrative text says "11 CORE activities," but the table above (as extracted) lists 10 distinct CORE-labeled codes. Also, this report (24 Aug) labels SJ611002 as "RESERVE" while the later RDB Activity-Code Review Memo (28 Aug, the more recent and more thorough single-issue review) labels it "ADJACENT — hold." Treat the memo's classification as current since it supersedes the report on this point; the discrepancy itself has no engineering impact.

## Regulatory compliance calendar (REQUIREMENT, from Business Project Development Report §06 — drawn from the RDB certificate)

Obligations Advisory must manage for Z-GATE itself before offering the equivalent as a client service — relevant context for any future compliance-calendar feature in a client portal:

| Obligation | Timing | Frequency |
|---|---|---|
| Annual Income Tax return | Jan–Mar (following year) | Annual |
| Quarterly Income Tax prepayments | By 30 Jun, 30 Sep, 31 Dec | Quarterly |
| Annual company returns & accounts | Jan–Jul (following year) | Annual |
| PAYE registration & payment | Ongoing, if any employee earns > RWF 60,000 basic salary | Ongoing |
| VAT registration | Mandatory above RWF 5M/quarter or RWF 20M/year turnover | Threshold-triggered |
| EBM invoicing | Required from registration, all sales | Ongoing |
| Beneficial Owner (BO) info update | Within 14 days of any change | As needed |
| Company detail changes | Report to Registrar General via RDB portal | As needed |

## Academy's first two courses (FACT, from `zgate-academy-course-curriculum.docx`, issued 29 Aug 2026)

Confirms and details the Academy roadmap already summarized from the Business Plan:
- **Course 1 — "Tax & Bookkeeping Fundamentals for Small Business Owners"** (Cohort 1, Month 2, target 18 learners): 4 weeks, 8 sessions × 1.5hrs, RWF 40,000/learner, 70% pass mark, built entirely from Advisory's own anonymized casework.
- **Course 2 — "EBM & Digital Invoicing Mastery"** (Cohort 2, Month 3, target 15 learners): 2 weeks, 4 sessions × 1.5hrs, live hands-on EBM operation assessment (pass/fail).
- Both courses are still in **draft, unsigned** status (Managing Director approval section blank), consistent with every other business document reviewed.
- **Implication for a future Academy LMS/module:** the domain model needs cohorts, sessions, attendance (feeding the SLA's 90% completion metric), a mixed assessment model (practical exercise + quiz for Course 1; pass/fail live demo for Course 2), and certificate issuance tied to a 5-business-day SLA — this is real product-shape signal, not speculation.

## Correction note

This section was revised after the Managing Director confirmed a fuller "zgate-full-document-package" exists elsewhere on the machine, containing the Business Project Development Report (the primary source the RDB memo cites but which was not in this project directory during the first audit pass) and the Academy Course Curriculum. Both have now been copied into this project directory and reviewed. See `docs/discovery/REPOSITORY_MAP.md` for the process note on how this was discovered.
