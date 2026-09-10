# Z-GATE Open Business Questions (Phase 1)

Business-process and policy decisions still needed to fully specify Z-GATE's operating model. Distinct from `docs/discovery/OPEN_QUESTIONS.md` (Phase 0's document-level/technical questions), though several carry forward because they block a business rule from being finalized, not just a technical decision. Grouped by the document set (`BUSINESS_REQUIREMENTS.md`, `BUSINESS_WORKFLOWS.md`, `DOMAIN_MODEL.md`, `ROLE_MATRIX.md`, `BUSINESS_RULES.md`, `CROSS_DIVISION_WORKFLOWS.md`) each question blocks.

## Role & organizational structure

1. **(blocks ROLE_MATRIX, BUSINESS_WORKFLOWS §15, §18)** Until Service Delivery Lead and Division Manager roles are filled, does the Managing Director functionally hold Levels 1, 2, and 3 of the escalation/grievance ladder simultaneously? If so, does a "missed Level 1 target" even trigger a real escalation today, or is it moot until headcount grows?
2. **(blocks ROLE_MATRIX)** What is the current, real-time status of the Month 1–3 hiring plan as of today — has the Advisory Associate, Marketing Coordinator, Academy Trainer, Junior Developer, and/or Data Analyst actually been hired? The HR Policy and Business Plan only describe *targets*; nothing in the repository records actual hires made.
3. **(blocks BUSINESS_WORKFLOWS §1, §10-13)** Who formally owns the Lead → Prospect → Client conversion workflow — is this the Marketing Coordinator's responsibility end-to-end, or does it hand off to the MD/Advisory Associate at a defined point?

## Cross-division mechanics

4. **(blocks CROSS_DIVISION_WORKFLOWS §1, §3-5)** Is a "Client" one shared record visible to every division serving them, or does each division maintain its own record linked only by the Master SLA? No document states this either way.
5. **(blocks CROSS_DIVISION_WORKFLOWS, "what is NOT documented")** Is there an intended formal cross-sell/referral workflow between divisions (who initiates, when, how tracked), or is cross-division growth expected to happen informally/ad hoc for now? The philosophy ("one gate, four rooms") states intent but no process.
6. **(blocks BUSINESS_RULES §1, billing)** If a Client has multiple Service Schedules, is billing consolidated into one invoice or issued per Schedule? SLA Clause 4 describes fees per Schedule but doesn't address invoice consolidation.
7. **(blocks BUSINESS_RULES §1)** If a Client is in good standing on one Service Schedule but delinquent on another, does the late-payment suspension clause (Clause 4) apply only to the delinquent Schedule, or can it affect the whole relationship? Not addressed in the SLA template.

## Document finalization

8. **(blocks BUSINESS_RULES §1)** What are the final values for the SLA's bracketed placeholders — contract term ("[12] months"), payment terms ("[15] days"), late-payment suspension notice ("[30] days" + "[7] days"), confidentiality survival ("[3] years")? These require legal counsel review before being treated as committed business rules.
9. **(carried forward from Phase 0; blocks BUSINESS_RULES §4)** What is the actual statutory retention period for Advisory tax/financial records under Rwandan law? The Data Privacy Policy explicitly defers this to legal counsel.
10. **(blocks BUSINESS_WORKFLOWS §19)** Has the Managing Director approved the RDB activity-code amendment (5 REVIEW-status codes)? Has it been filed? The memo's approval section is unsigned as of the last recorded state.
11. **(blocks BUSINESS_REQUIREMENTS §6)** Has NCSA registration and DPO designation been completed since the Phase 0 audit? Both were "Pending" as of the Data Privacy Policy's last recorded checklist state — this blocks the Data Breach Response workflow (`BUSINESS_WORKFLOWS.md` §16) from having a real, tested notification contact rather than a policy-on-paper.

## Academy process gaps

12. **(blocks BUSINESS_WORKFLOWS §9)** What happens when a learner fails the final assessment (below 70% for Course 1, or fails the live demo for Course 2)? No retake, remediation, or partial-credit process is documented.
13. **(blocks CROSS_DIVISION_WORKFLOWS §4)** Is there a formal sign-off step confirming Advisory case data has been properly anonymized before becoming Academy course material, or is this left to the Trainer's/Advisory Associate's judgment? The Data Privacy Policy's confidentiality obligations apply to the underlying data, but no specific anonymization-approval step is named.

## Data-handling edge cases

14. **(blocks BUSINESS_RULES §4, Annex B)** SLA Schedule B allows corporate clients an aggregate cohort summary but not individual learner performance without consent — has this boundary been tested against a real corporate client request yet, or is it purely theoretical at this stage?
15. **(blocks ROLE_MATRIX §4)** Who can initiate a DPIA in practice, given the DPO role is itself unfilled? Is this an MD responsibility by default until a DPO is named?

## Scope reconciliation

16. **(blocks BUSINESS_REQUIREMENTS §4-5)** Are "AI Solutions," "Cybersecurity" (Tech) and "Data Engineering," "AI/ML" (Data) — named in this engagement's operating brief's org chart — confirmed as the company's actual long-term target sub-division structure, or does the org chart need reconciling with the Business Project Development Desk's own documents (which describe Tech and Data more narrowly) before being treated as planning input?
17. **(blocks nothing directly, informational)** Should the "Z-GATE People" fifth-division candidate (activity code SN783001, held for Month-6 review) be tracked in any business-analysis artifact going forward, or does it stay out of scope until the Managing Director raises it?

## Procedural note

None of the above were resolved by inference or precedent from similar companies — every question above exists because a specific approved document is either silent, uses a placeholder, or leaves an explicit "Pending" status. This document should be revisited and pruned as the Managing Director resolves each item, rather than treated as a one-time deliverable.
