# Z-GATE LTD — Project Audit (Engineering Discovery, Phase 0)

**Date:** 2026-09-10 · **Prepared by:** Engineering discovery pass, this session · **Status:** Discovery only — no implementation performed.

Legend: **FACT** (verified from repository/documents) · **REQUIREMENT** (business demands it) · **RECOMMENDATION** (this audit's advice) · **ASSUMPTION** (temporarily inferred, unconfirmed) · **OPEN QUESTION** (needs Managing Director confirmation).

---

## Executive Summary

Z-GATE LTD is a real, newly registered Rwandan company (TIN 156848508, registered 19 August 2026) currently 22 days into a documented 90-day business launch plan, operating through a single founder (Managing Director and Board Chairperson Aime Serge UKOBIZABA) with zero recorded employees at registration. The company has produced a complete and unusually thorough set of business foundation documents — a strategic Business Project Development Report (the master strategy document), a 90-day business plan and go-to-market strategy grounded in real Rwandan SME market research, a 90-day/12-month financial model, a full brand identity system, HR policy and first-hire job descriptions, client SLA templates, a data-privacy/security policy aligned to Rwandan law, an Academy course curriculum for its first two cohorts, and a legal memo reviewing its RDB business-activity registration (10 documents total, after a mid-audit discovery of two additional source files — see `REPOSITORY_MAP.md`).

**No digital platform exists.** This repository contained no application code, no git history, and no technology decisions prior to this session — it held only these business documents. The "digital ecosystem" described in this engagement's operating brief (public site, CRM, client/staff/admin portals, billing, Academy LMS, Data/BI) is entirely future work. Critically, the company's own approved business plan already prescribes the same disciplined, Advisory-first sequencing the operating brief calls for — this is not a case of the codebase needing to be reconciled with the business strategy; it is a case of no codebase yet existing to align.

## Current System

**FACT:** Empty of code. The repository is a flat collection of business/legal/brand documents (`.docx`, `.xlsx`, `.md`, `.html`) with no source tree, no dependency manifest, and (before this session) no version control. See `REPOSITORY_MAP.md`.

## Current Business Alignment

**FACT:** See `BUSINESS_ALIGNMENT.md` for full detail. Summary:
- The four-division structure, motto, and "one gate, four rooms" philosophy in the operating brief match the approved mission/vision copy verbatim — no conflict.
- The operating brief's Tech/Data sub-division breakdown (AI Solutions, Cybersecurity, Data Engineering, AI/ML) is **broader** than what's in the approved SLA/RDB documents' current scope — flagged as an open reconciliation item, not acted on.
- Business priority (Advisory-first, Tech/Data as internal tools before external sale, no premature enterprise platform) is independently confirmed by the company's own 90-Day Business Plan and its source Business Project Development Report — strong alignment.
- The registered-office address discrepancy flagged in the first audit pass is **now resolved**: Inyarurembo, Kiyovu, Nyarugenge, Kigali is confirmed correct; the brand guide's "Kigali Heights" address was a mockup placeholder.
- A **new discrepancy** surfaced instead: the company's real registered contact email is `info@zgaterw.com`, while brand-guide mockups use a `zgate.co` domain — which is the intended production domain is unconfirmed.
- One unresolved compliance action remains open (5 RDB activity codes recommended for removal, still unsigned) — flagged for Managing Director decision, not resolved here.

## Technology Stack

**FACT:** None chosen or implemented. See `TECHNOLOGY_STACK.md` for the full machine-tooling inventory (Node 22, Python 3.14, Docker 29, git 2.53, etc. available locally — none of this implies a project decision) and the compliance-driven constraints (Rwanda data residency, EBM-compliant billing, encryption/MFA baselines) any future stack choice must satisfy.

## Architecture

**FACT:** None exists. **OPEN QUESTION:** to be decided in a future phase, informed by the constraints above — not this phase.

## Repository Structure

See `REPOSITORY_MAP.md`.

## Existing Features

**FACT:** None. See `CURRENT_FUNCTIONALITY.md` — every platform capability area (auth, CRM, portals, billing, LMS, BI, support) is NOT IMPLEMENTED.

## Existing UX/UI

**FACT (partial — a real asset exists):** No application UI exists, but a complete, well-specified Brand Identity Guide does (colors, type, logo system, voice/tone, application mockups). See `UI_UX_AUDIT.md`. **RECOMMENDATION:** treat it as binding for all future UI work rather than redesigning it.

## Database

**FACT:** None exists. See `DATABASE_AUDIT.md` for the business-domain entities (Client, Service Schedule, Deliverable, per-division records) implied by the SLA and privacy policy — input for future data modeling, not a schema decision made here.

## APIs

**FACT:** None exist. See `API_AUDIT.md`.

## Authentication

**FACT:** None exists. No auth provider has been chosen.

## Security

**FACT:** No application security surface exists to scan. **HIGH (process, not technical):** NCSA registration and DPO designation — required under Rwandan law (N° 058/2021) for a company about to handle client financial/personal data — are still "Pending" per the company's own Data Privacy & Security Policy checklist. See `SECURITY_BASELINE.md`.

## Testing

**FACT:** NOT CONFIGURED across every test category. See `TESTING_BASELINE.md`.

## DevOps

**FACT:** No CI/CD, no hosting, no deployment target. `git init` was performed this session as part of establishing the discovery baseline; no remote configured. See `DEVOPS_BASELINE.md`.

## Deployment

**FACT:** Nothing is deployed anywhere. No domain ownership is confirmed (`zgate.co` appears only in brand-guide mockup contact details).

## Technical Debt

**FACT:** Zero code-level debt (no code exists). Real **process debt** does exist: several foundational documents (Data Privacy Policy, HR Policy, Client SLA) remain in draft/unsigned status with unfilled bracketed terms. See `TECHNICAL_DEBT.md`.

## Risks

See `RISKS.md` for the full list, combining the business plan's own Risk Register (single-founder dependency, cash-flow gap before first invoices, the 5 REVIEW-status RDB codes, the ALSM competitor, EBM vendor dependency) with discovery-flagged additions (compliance registration gap, draft-document risk, scope-creep risk against the company's own strategy, the address/domain inconsistencies, and a shortened effective runway to the Month-3 Tech deliverable now that ~8 weeks remain).

## Missing Capabilities

Everything under Section 2 of the operating brief (public presence, marketing, lead gen, CRM, onboarding, client management, project management, SOW/SLA management, document management, support, billing, Academy/Tech/Data operations, reporting, analytics, auth, admin) is currently missing in full. The approved business plan itself only commits to two concrete Tech-division deliverables inside the current 90-day window: an internal Advisory client-portal MVP and Data's reporting pipeline — everything beyond that is longer-horizon.

## Recommended Architecture Direction

**RECOMMENDATION, not a decision made here:** None should be chosen during this discovery phase. When a direction is set, it should be selected against the concrete constraints already established by the approved documents (Rwanda data residency by default, EBM-compliant billing integration, per-engagement role-based access control, encryption/MFA baselines) rather than generic best practice alone — those constraints are business requirements, not engineering preferences.

## Recommended Development Sequence

**RECOMMENDATION, matches the company's own approved plan — do not deviate without cause:**
1. Confirm the open questions in `OPEN_QUESTIONS.md` that block any real design work (registered address, domain ownership, current actual roadmap progress, document approval status).
2. Build the Month-1–2 internal Tech deliverable first — Advisory's own client portal MVP — scoped as an internal tool, not a public multi-tenant platform.
3. Build Data's reporting pipeline alongside it, using Advisory's own client data as the first real dataset (per the approved plan).
4. Treat CRM, Academy LMS, public marketing site, admin portal, and billing/EBM integration as sequenced *after* the internal reference builds prove out, consistent with the company's explicit "internal reference tools before external sale" strategy.
5. Do not begin scoping Cybersecurity or AI/ML service-line features (from the operating brief's org chart) until the Managing Director confirms these are active near-term scope — they are not yet in the approved SLA/RDB service lines.

## Blockers

- No technology stack decision has been made, and the business plan's own Month-3 Tech deliverable target is now ~8 weeks away.
- Several foundational legal/compliance actions (NCSA registration, DPO designation, RDB activity-code amendment) are unresolved and sit upstream of any client-data-handling system design.
- Registered-office address and domain ownership are unconfirmed — both would need to be correct before any client-facing artifact (site footer, invoice, letterhead-driven document) is generated by a future system.

## Open Questions

See `OPEN_QUESTIONS.md` for the full list (13 items) — spanning document-internal blanks, this discovery's own findings, and sequencing questions for the Managing Director.

---

**This audit does not claim Z-GATE's digital platform is production-ready, in progress, or scoped — it does not exist yet.** No code was written, no dependencies installed, no infrastructure provisioned, and no architectural decision made during this phase, consistent with the operating brief's Phase 0 constraints.
