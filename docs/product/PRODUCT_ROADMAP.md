# Z-GATE Digital Platform — Product Roadmap

Sequenced to match the company's own priority order (commercial website → lead generation → CRM foundation → authentication → client portal → Advisory operational workflow → internal reporting → Academy → Tech operations → Data/BI expansion → advanced AI) and its existing 90-day/12-month planning horizon (`docs/business/` Phase 1 outputs). Each phase has explicit **entry criteria** (what must already be true) and **exit criteria** (what proves it's done) — a phase does not start early just because engineering capacity exists.

## MVP — target: aligned with the Business Plan's Day-90 Tech milestone (~mid-November 2026)

**Entry criteria:** Advisory is operating (client(s) signed), brand/copy assets exist (they do — Phase 0 confirmed this), a Junior Developer is in place or the MD is building directly.

**Modules:** Public Website · Lead Generation (capture) · CRM foundation · Authentication · Client Portal (Advisory only) · Advisory operational workflow · Internal reporting (Advisory + leads only).

**Explicitly excluded from MVP:** Academy, Tech-ops, Data-external, Admin Platform, multi-role Staff Portal, any billing/invoicing feature, any AI feature, any messaging/notification automation.

**Exit criteria (what proves MVP is done):**
- A real lead can move from website form → CRM record → converted client → portal access, without manual data re-entry at any step.
- At least one real Advisory client is using the Client Portal to check their own compliance status.
- The Advisory Associate no longer needs a side spreadsheet to track filing due dates.
- The MD can see Advisory client count and lead-pipeline numbers in one place instead of asking around.

## V1 — target: Month 4–6 (Business Plan's Q2), once MVP exit criteria are met

**Entry criteria:** MVP is live and actually used for at least one full monthly Advisory cycle; Academy Trainer hire has happened or is imminent (per HR Policy hiring plan).

**Modules added:** Academy (enrollment, attendance, assessment, certificate) · Staff Portal formalized (multi-role: Advisory Associate + Academy Trainer, at minimum) · Admin Platform basics (user/role management, SLA-target visibility) · Proactive notifications for Advisory deadlines (upgrade to the MVP status view).

**Rationale for what's still excluded:** Tech-ops and Data-external wait for V2 because neither has an external client yet by the time V1 starts (per the Business Plan, first external Tech conversation and first external Data client are both Day-90 targets, meaning they're just beginning as V1 starts, not ready for dedicated tooling investment).

**Exit criteria:**
- At least one Academy cohort runs its full lifecycle (enrollment → attendance → certificate) through the platform.
- More than one internal role uses the platform day-to-day (not just the Advisory Associate).
- The Admin Platform can add/remove a user's access without a developer's involvement.

## V2 — target: Month 7–12 (Business Plan's Q3–Q4)

**Entry criteria:** At least one real external Tech client and one real external Data client exist (per the Business Plan's own Q2+ projections — Tech external revenue begins Month 4, Data client base grows through Q3–Q4).

**Modules added:** Tech Operations (ticketing against SLA Schedule C's response/resolution targets, uptime tracking) · Data/BI expansion (external-client-facing report/dashboard delivery, access-controlled per Data Privacy Policy Annex D) · Client Portal expansion to Tech and Data (serves the Eric persona's multi-division journey) · Security hardening (MFA enforcement, quarterly access review tooling, DPIA/breach-response workflow support tied to the Data Privacy Policy's already-committed timelines).

**Blocked, not just deferred:** The unified multi-Schedule billing view and any cross-Schedule invoice consolidation feature stay blocked until `docs/business/OPEN_BUSINESS_QUESTIONS.md` #6 is answered — V2 does not guess at this.

**Exit criteria:**
- Tech and Data each have at least one external client actively served through the platform, not just internally.
- A Division Manager role (if hired by this point) can be represented in the Admin Platform without a redesign.

## Future — unscoped, contingent

Not scheduled, not estimated, not designed against — each item requires an explicit Managing Director decision before any product work starts:

- **Advanced AI** (any form) — no approved business document currently supports an AI/ML service line; contingent on resolving `docs/business/OPEN_BUSINESS_QUESTIONS.md` #16.
- **Cybersecurity as a service line** — same blocker.
- **Countryside/Phase 2 platform support** (Huye, Musanze) — contingent on the Business Plan's Phase 2 (Month 4+) actually starting and proving out Academy's roadshow model first; Jean's persona is not designed for before then.
- **"Z-GATE People" (5th division) tooling** — explicitly on hold per the RDB memo; not planned until the business itself decides to pursue it.
- **Full CRM/marketing-automation maturity** beyond the MVP foundation — only worth investing in once lead volume genuinely outgrows the simple list-based foundation.

## First vertical slice — the concrete build-now recommendation

The single thread every early engineering effort should target first, because it exercises every MVP module exactly once and is demonstrable end-to-end without waiting for the rest of MVP to exist:

> **Website lead form → CRM lead record → Advisory Associate converts the lead to a client → client gets portal login → client sees their compliance status (even if that status is entered manually by the Advisory Associate at this stage, not yet automated).**

This slice deliberately excludes: real EBM/RRA integration, notifications, multi-user roles beyond "staff" and "client," and any reporting beyond a single count on the MD's internal view. It proves the architecture end-to-end on the smallest real business scenario Z-GATE already has (one Advisory client), which is exactly what the company's own strategy calls for. See `USER_STORIES.md` and `ACCEPTANCE_CRITERIA.md` for the buildable breakdown.
