# Risks

Combines the approved Business Plan's own Risk Register (Section A9 — FACT, business-authored) with additional risks observed during this discovery (RECOMMENDATION-flagged, this audit's own assessment).

## From the approved Business Plan Risk Register (FACT)

| Risk | Severity (as rated in the plan) | Mitigation (as planned) |
|---|---|---|
| Single-founder dependency across all 4 divisions | High | Hire Advisory associate in Month 1; document processes as they're built |
| Cash-flow gap before first invoices are collected | Medium | Prioritize Advisory retainers (fastest to revenue); keep Month 1 spend lean |
| 5 REVIEW-status RDB activity codes create brand/legal ambiguity | Medium | Resolve with legal counsel before heavy marketing spend — **still unresolved as of this audit, see `BUSINESS_ALIGNMENT.md`** |
| Established bundled competitor (ALSM Consulting Group — 55 staff, 350+ clients) already in market | Medium | Differentiate on Academy + Data, which ALSM does not offer |
| EBM/tech vendor dependency for compliance tooling | Low | Maintain relationships with 2+ certified EBM software providers |

## Additional risks observed during this discovery (RECOMMENDATION)

- **Compliance registration gap (HIGH, process):** NCSA registration and Data Protection Officer designation are both still "Pending" per the Data Privacy & Security Policy's own checklist, while the company is already or imminently handling client financial/personal data under live Advisory engagements. This is a live operational gap independent of any software platform — see `SECURITY_BASELINE.md`.
- **Draft-document risk (MEDIUM):** The Client SLA, HR Policy, and Data Privacy Policy are all still in draft/unsigned status with unfilled bracketed terms. Any future system (billing rules, SLA-tracking, HR onboarding flow) built against today's numbers risks needing rework once these are finalized by counsel.
- **Scope-creep risk against the company's own strategy (MEDIUM):** The operating brief's org chart names sub-divisions (AI Solutions, Cybersecurity, Data Engineering, AI/ML) not present in the approved 90-day plan's actual service scope. Building platform features toward that broader chart before Advisory is proven would directly contradict the company's own documented "don't overextend a single-founder company" strategy — see `BUSINESS_ALIGNMENT.md`.
- **Address/identity inconsistency (LOW–MEDIUM):** Two different registered-office addresses appear across the SLA template and the brand guide's letterhead mockup; an unconfirmed detail like this reaching a real signed contract or filing would be a legal problem, not just a documentation one.
- **Domain/asset ownership unconfirmed (LOW, until acted on):** `zgate.co` appears in brand-guide mockups as the assumed domain, but domain registration/ownership is not confirmed anywhere in this repository. Do not build DNS, email, or hosting configuration against it without confirming ownership first.
- **No technical foundation exists to absorb near-term Tech-division commitments (INFORMATIONAL, expected at this stage):** the business plan targets a client-portal MVP and a reporting pipeline live within 90 days (by ~17 Nov 2026, i.e. roughly 8 weeks from today), yet zero technology decisions (stack, hosting, data residency implementation) have been made. This is not abnormal for Day 22 of a 90-day plan, but it means the runway to a live Month-3 Tech deliverable is now materially shorter than 90 days — worth surfacing to the Managing Director as a timeline consideration before Phase 1 (Business Analysis) sets development sequencing.

No risk in this document has been acted upon or mitigated during this audit, per the operating brief's non-implementation constraint for this phase.
