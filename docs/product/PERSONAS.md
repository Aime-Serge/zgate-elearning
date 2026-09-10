# Z-GATE Digital Platform — Personas

Sourced from `docs/business/BUSINESS_REQUIREMENTS.md`, the Business Plan's persona section, and `docs/business/ROLE_MATRIX.md`. No persona here is invented beyond what those documents already describe — where a detail is a reasonable product-design inference rather than a documented fact, it's marked **(inferred)**.

## External personas

### Solange — CBD Shop Owner (Advisory)
- **Where:** Nyarugenge CBD / Kimironko. **Primary channel:** WhatsApp Business, word of mouth.
- **Goal:** Stay compliant without needing to understand tax law herself.
- **Core pain:** Struggles operating her EBM; unsure if she owes VAT this quarter (Business Plan §B2).
- **Product need (inferred):** A view she can check on her phone, in plain language, of "am I compliant right now" and "what's due next" — not a dashboard built for an accountant. WhatsApp remains her primary channel; the product should not force her onto email.
- **MVP relevance:** Primary persona for the Client Portal's first (Advisory-only) version.

### Eric — Operations Manager (Advisory + Tech + Data)
- **Where:** Kacyiru / Kimihurura / Remera (Gasabo). **Primary channel:** LinkedIn, referrals.
- **Goal:** Stop juggling separate vendors for books, systems, and reporting (Business Plan §B2).
- **Core pain:** No single view across the multiple providers he currently manages.
- **Product need (inferred):** Once he's a multi-Schedule client, one login showing Advisory status, Tech project/ticket status, and Data deliverables together — this is explicitly a **V1/V2** need, since Tech and Data aren't selling externally in MVP.
- **MVP relevance:** Not served in MVP (Advisory-only); a target persona for V1's multi-division Client Portal.

### Aline — Recent Graduate (Academy)
- **Where:** Kigali-wide. **Primary channel:** Facebook, Instagram.
- **Goal:** A job-ready certificate employers actually recognize (Business Plan §B2).
- **Core pain:** Needs practical, credible, affordable skills — not a lecture series.
- **Product need (inferred):** Simple, mobile-first course discovery and enrollment; clear cohort dates; a certificate she can point to (and, eventually, an employer can verify).
- **MVP relevance:** Not served in MVP — Academy is a **V1** module, once Advisory is proven.

### Jean — Cooperative Lead (Phase 2 / future)
- **Where:** Huye / Musanze. **Primary channel:** Phone calls, local associations.
- **Goal:** Digitize records; trusts people over ads (Business Plan §B2).
- **Core pain:** No digital records today; low existing digital touchpoint.
- **Product need (inferred):** Mostly human-mediated delivery (Academy roadshow, per the Countryside Expansion Strategy) — the product's role for Jean is minimal in any near-term phase; over-building for him now would be premature investment ahead of Phase 2 (Month 4+).
- **MVP/V1 relevance:** Out of scope — Future tier only, contingent on Phase 2 countryside rollout actually starting.

### Prospect (unqualified website visitor)
- **Where:** Any channel. **Primary channel:** Facebook/LinkedIn ad, organic search, referral.
- **Goal:** Quickly figure out if Z-GATE solves their problem.
- **Core pain:** Currently no company website exists at all — the only touchpoints are social channels and word of mouth.
- **Product need:** A credible public site answering "who is Z-GATE, what do the four divisions do, how do I start" in under a minute, with a low-friction way to leave contact details.
- **MVP relevance:** Primary persona for the public website + lead-capture module.

## Internal personas

### Managing Director — Aime Serge UKOBIZABA
- **Role:** Founder, sole decision authority, currently absorbs Service Delivery Lead, Division Manager, and DPO responsibilities across all four divisions (`docs/business/ROLE_MATRIX.md` §1).
- **Goal:** See enough, across every division, to know what needs his personal attention — without needing four separate tools or a manual status round-up.
- **Product need:** One cross-division view (even a simple one) beats four polished single-division dashboards he has to check separately. This shapes MVP's internal reporting toward "one screen for the MD," not per-division dashboards first.

### Advisory Associate / Bookkeeper
- **Role:** Month 1 hire; the platform's first and most important daily internal user (HR Policy Manual, Part 2).
- **Goal:** Never miss a filing deadline across a growing client list; close monthly books on time (5th business day target).
- **Core pain today:** No system exists — this role runs entirely on manual tracking as of Phase 0/1 discovery.
- **Product need:** A client list with compliance-calendar status, a way to log a close-out/filing as done, and a way to push a Deliverable to the client — this is the operational core of MVP.

### Marketing Coordinator
- **Role:** Month 1 hire, part-time, cross-divisional (HR Policy Manual, Part 2).
- **Goal:** Report weekly lead-pipeline KPIs (target: 500+ qualified contacts by Day 90) without manually reconciling three channels.
- **Product need:** A lightweight place to log/import leads from Facebook, LinkedIn, and WhatsApp Business and see conversion status — the CRM foundation module.

### Academy Trainer
- **Role:** Month 2 hire, contract per cohort (HR Policy Manual, Part 2).
- **Goal:** Run a cohort (attendance, assessment, certificate issuance) without a spreadsheet.
- **Product need:** Not an MVP user — first served in V1 alongside the Academy module.

### Junior Developer
- **Role:** Month 3 hire, contract/internship — dual role: builds the platform AND is its first Tech-operations internal user (HR Policy Manual, Part 2).
- **Goal:** Ship the Advisory portal MVP and Data's reporting pipeline; later, use the platform's own Tech-ops tooling (ticket/uptime tracking) once that module exists.

### Data Analyst
- **Role:** Month 3 hire, contract (HR Policy Manual, Part 2).
- **Goal:** Build standard reporting templates against Advisory's own data first, then onboard the first external Data client.
- **Product need:** Internal reporting/BI views in MVP; external-client-facing Data deliverables are a V2 concern.

### Service Delivery Lead / Division Manager / Data Protection Officer *(roles exist in business rules, currently unfilled)*
- **Status:** Structurally required by the SLA escalation ladder and the Data Privacy Policy, but no person holds these roles yet (`docs/business/ROLE_MATRIX.md` §1).
- **Product implication:** The platform's role/permission model should be able to represent these roles when they're filled (so onboarding a Division Manager later doesn't require a redesign), but **no UI or workflow should be built for them in MVP** — building screens for roles nobody occupies yet is exactly the kind of feature creep this phase is meant to avoid.
