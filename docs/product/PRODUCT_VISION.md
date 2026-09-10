# Z-GATE Digital Platform — Product Vision

**Source order:** `docs/business/*` (Phase 1) → `docs/discovery/*` (Phase 0) → approved business documents. No product goal below exists without a business requirement behind it.

## Vision statement

The Z-GATE Digital Platform is the software expression of one fact the business has already proven on paper: a client, a course learner, or an internal team member should never have to feel Z-GATE's four divisions as four separate vendors. The platform starts small and internal — proving itself inside Advisory, the company's revenue anchor — and earns its way outward to Academy, Tech, and Data, exactly as the approved 90-Day Business Plan and Business Project Development Report already sequence the business itself (`docs/business/BUSINESS_REQUIREMENTS.md` §1–5).

## Product goals

1. **Make Advisory's compliance work provably reliable** — give clients and the Advisory Associate a shared, accurate view of filing status, deadlines, and deliverables, replacing informal WhatsApp/email tracking with something that can't quietly drop a deadline. (Grounded in SLA Schedule A's hard turnaround targets — `docs/business/BUSINESS_RULES.md` §2.)
2. **Turn the lead pipeline into a system, not a memory** — the Marketing Coordinator already owes a weekly KPI report against a 500+-contact target (`docs/business/ROLE_MATRIX.md` §1); the product should make that reportable without manual reconciliation across Facebook, LinkedIn, and WhatsApp.
3. **Prove Tech and Data internally before selling them** — the platform's own Client Portal and reporting pipeline ARE the "internal reference build" the Business Plan calls for (`docs/business/CROSS_DIVISION_WORKFLOWS.md` §3, §5). Building this product is itself the Month 1–3 Tech deliverable, not a separate initiative.
4. **Extend to Academy only once Advisory is running** — Academy's enrollment/attendance/certificate workflow becomes a platform module in V1, not MVP, matching the business's own "internal tools before external sale, Advisory first" sequencing.
5. **Never build ahead of a signed business decision** — where an Open Business Question blocks a feature (bracketed SLA terms, unfilled Service Delivery Lead role, unconfirmed AI/Cybersecurity scope), the product ships the smallest version that doesn't require the answer, and flags the rest.

## Guiding principles (carried from the brand's own values, applied as product principles)

- **Threshold, not silo** → one Client record visible across every division that serves them (once more than one division is live) — not four disconnected app modules wearing the same logo.
- **Precision over polish** → a correct filing-deadline view beats a beautiful dashboard with stale data. Ship the accurate version first.
- **Warm engineering** → every screen a client or learner sees should be explainable in one plain sentence — no unexplained jargon, matching the brand's own voice rule (Brand Identity Guide, Voice & Tone).
- **Internal tool before external product** → every module proves itself running Z-GATE's own operations before it is offered to a paying client, mirroring the company's explicit Tech/Data strategy.

## What this product is explicitly NOT (anti-scope, to prevent creep)

- **Not a simultaneous four-division platform.** Academy, Tech-external, and Data-external are sequenced deliberately behind Advisory — see `PRODUCT_ROADMAP.md`.
- **Not an EBM billing replacement.** Z-GATE's own Risk Register calls for maintaining relationships with certified EBM providers, not building one (`docs/discovery/RISKS.md`); the platform integrates with/records against EBM compliance, it does not become the EBM system.
- **Not an AI product.** No approved business document currently scopes an AI/ML service line — "advanced AI" sits in `PRODUCT_ROADMAP.md`'s Future tier, explicitly contingent on Managing Director confirmation (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #16), not a planned build.
- **Not a generic multi-tenant SaaS from day one.** MVP is sized for one company running its own operations for its own clients, not a platform meant to be resold — nothing in the approved documents describes Z-GATE as a software vendor to other consultancies.
- **Not a system that invents business rules.** Every SLA target, escalation rule, and data-handling rule the product enforces is sourced from `docs/business/BUSINESS_RULES.md` — the product does not decide policy.

## Success definition

The platform succeeds if, by the end of V1, an Advisory client's filing status is never something the Advisory Associate has to reconstruct from memory or chat history, the Marketing Coordinator's weekly lead report takes minutes instead of manual reconciliation, and Academy can run a cohort without a spreadsheet. See `PRODUCT_KPIS.md` for the measurable version of this.
