# Z-GATE Digital Platform — UX Research

**Source order:** business requirements (`docs/business/`) → product requirements (`docs/product/`) → current application (none exists — `docs/discovery/CURRENT_FUNCTIONALITY.md`) → current website (none exists — `docs/discovery/REPOSITORY_MAP.md`) → existing user experience (the Brand Identity Guide is the only UX artifact that exists — `docs/discovery/UI_UX_AUDIT.md`). This is research, not design: it maps needs, not screens. No feature, layout, or interaction is proposed here.

**Note on evidence quality:** because no application or website exists yet, none of this is validated by real usage data (no analytics, no user testing, no support tickets exist to mine). Every need below is either **[SOURCED]** — directly traceable to a business/product document — or **[INFERRED]** — a reasonable UX conclusion drawn from sourced facts but not itself stated in any document. Inferred items should be validated with real users once the MVP vertical slice (`docs/product/PRODUCT_ROADMAP.md`) is live, not treated as settled.

**Rwanda context data points used throughout (Business Plan §A2, [SOURCED]):** internet penetration 34.2% (5.01M users), mobile connections 88.7% of population (13.0M), Facebook the dominant marketing platform, WhatsApp near-universal reach. This is why mobile-first, low-bandwidth-tolerant design is treated as a baseline need across nearly every persona below, not a preference.

---

## 1. Prospective clients (any division)

- **Goals [SOURCED]:** quickly determine whether Z-GATE solves their problem; leave contact details with minimal friction (Business Plan personas §B2).
- **Pain points [SOURCED]:** Solange struggles operating her EBM and doesn't know if she owes VAT; Eric juggles separate vendors for books, systems, and reporting; today there is no website at all to even start this journey (`docs/discovery/CURRENT_FUNCTIONALITY.md`).
- **Objections [INFERRED from Business Plan §A2, §A4]:** price sensitivity (51% of SMEs cite EBM affordability as a barrier); "is this a legitimate, licensed company" — Z-GATE registered 19 August 2026, with no market track record yet; "why trust a bundled provider" when the competitive landscape shows mostly single-service providers (Big 4, mid-market firms are Advisory-only).
- **Trust requirements [INFERRED]:** visible credibility markers (registered/licensed status, professional affiliations Z-GATE is pursuing like ICPAR — Business Plan §B7); a clear, honest statement of what happens after a form is submitted (who responds, how fast) rather than a black-hole contact form.
- **Information needs [SOURCED]:** plain-language explanation of what each division does (Mission/Vision copy already answers this) — the gap is that it exists nowhere public yet.
- **Accessibility needs [INFERRED, flagged gap]:** no approved document specifies a language requirement beyond English (the Marketing Coordinator job description notes Kinyarwanda/French as "a plus," not a requirement) — this is a real open gap for a Rwanda-market public site, not a decided non-requirement. See `EXPERIENCE_REQUIREMENTS.md`.
- **Mobile needs [SOURCED, high]:** given 34.2% internet penetration but 88.7% mobile connectivity and WhatsApp as Solange's primary channel, the site must work well on a mobile connection that may be slow or intermittent — this is not a "nice to have."

## 2. Existing clients

- **Goals [SOURCED]:** confidence their compliance obligations are handled; visibility into status without having to ask (SLA Schedule A; Journey 1 in `docs/product/USER_JOURNEYS.md`).
- **Pain points [SOURCED]:** today, "status" lives only in the Advisory Associate's memory and WhatsApp history — nothing is written down anywhere a client can check.
- **Objections [INFERRED]:** will a portal replace the personal WhatsApp relationship they value (Solange's primary channel is explicitly WhatsApp, not email or an app); is my financial/personal data safe with a system instead of a person.
- **Trust requirements [SOURCED]:** Rwanda data residency by default (Data Privacy Policy §6); a defined escalation path if something's wrong (SLA Clause 8) — though NCSA registration and DPO designation are still "Pending" (`docs/discovery/SECURITY_BASELINE.md`), which is a real, current trust gap, not just a perception problem.
- **Information needs [SOURCED]:** current status, next due date, deliverables history, in plain language (brand voice rule — Brand Identity Guide, Voice & Tone section: "no jargon without translation").
- **Accessibility needs [INFERRED]:** cannot assume high digital literacy — Z-GATE's own persona set includes Jean (no digital records, "trusts people over ads"), suggesting the client base spans a wide digital-literacy range even if Jean himself is Phase 2/future.
- **Mobile needs [SOURCED, high]:** same reasoning as prospective clients.

## 3. Staff (Advisory Associate; extends to Academy Trainer, Junior Developer, Data Analyst)

- **Goals [SOURCED]:** complete daily compliance work without relying on memory; hit hard SLA targets (5th-business-day close-out, ≥2-business-day-ahead filing, 4-business-hour urgent response — SLA Schedule A).
- **Pain points [SOURCED]:** this role runs entirely on manual tracking today (`docs/discovery/CURRENT_FUNCTIONALITY.md`); the Advisory Associate is also the company's first-ever software user, with no institutional habit to build on.
- **Objections [INFERRED]:** fear that a new tool adds admin overhead rather than saving time; concern the tool doesn't match how compliance work actually happens day-to-day (built by people who've never done the job).
- **Trust requirements [INFERRED]:** for a compliance-critical action (marking a filing complete carries real regulatory weight), the tool must feel authoritative and hard to misuse accidentally.
- **Information needs [SOURCED]:** a clear task list ordered by urgency (compliance due dates), not a general-purpose database to search through.
- **Accessibility/mobile needs [INFERRED]:** the Advisory Associate role is explicitly "client-facing" (HR Policy job description, location: Nyarugenge, client-facing) — mixed desktop (close-out/filing work) and mobile (client visits) use should both be assumed.

## 4. Administrators (Managing Director; future Division Manager/DPO)

- **Goals [SOURCED]:** cross-division oversight without personally chasing status from each function (Journey 3 in `docs/product/USER_JOURNEYS.md`).
- **Pain points [SOURCED]:** the MD currently absorbs Service Delivery Lead, Division Manager, and DPO responsibilities simultaneously across all four divisions (`docs/business/ROLE_MATRIX.md` §1) — a real cognitive-load problem, not a hypothetical one.
- **Objections [INFERRED]:** any admin tool that pulls MD attention away from sales/strategy work is actively counter to the Business Plan's own staffing logic ("hire Advisory associate... to free the founder for sales" — Business Plan §A7).
- **Trust requirements [SOURCED]:** accuracy over polish (brand value "Precision over polish" — Brand Identity Guide) — a wrong number in an oversight view is a bigger failure than an unpolished one.
- **Information needs [SOURCED]:** a compact, cross-division-capable summary (client count, on-time rate, lead pipeline) — not a per-division deep-dive by default.
- **Mobile needs [INFERRED, medium-high]:** a single-founder company implies the MD needs to check status anywhere, not just at a desk.

## 5. Academy learners (Aline; Jean as a future/Phase-2 case)

- **Goals [SOURCED]:** a job-ready, employer-recognized certificate; practical skill applicable the same week (Academy Course Curriculum, Design Principles).
- **Pain points [SOURCED]:** no prior accounting background assumed; limited time/capital as a working SME owner or career-changer.
- **Objections [INFERRED]:** "will this certificate actually mean something to an employer" (no employer-verification mechanism is documented yet); "will I actually finish" — relevant since no retake/remediation process exists for a failed assessment (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #12).
- **Trust requirements [SOURCED]:** curriculum built from real Advisory casework, not generic content (Academy Course Curriculum, Design Principles) — a genuine, documented differentiator worth surfacing in the UX, not just a backend fact.
- **Information needs [SOURCED]:** course outline, schedule (2–4 weeks, specific session count), fee (RWF 40,000), pass mark (70% or live pass/fail), cohort size (15–20).
- **Accessibility needs [INFERRED]:** Aline (Facebook/Instagram-native) likely has moderate-to-high digital literacy; Jean (future) explicitly does not — the Academy's *public-facing* enrollment experience should not assume Jean-level literacy is out of scope forever, even though Jean himself is Phase 2/Future.
- **Mobile needs [SOURCED, high]:** Facebook/Instagram is the primary channel for this persona.

## 6. Academy trainers

- **Goals [SOURCED]:** deliver sessions per schedule, hit the 90% completion metric, issue certificates within 5 business days (SLA Schedule B).
- **Pain points [SOURCED]:** attendance and feedback are currently paper-based (Academy Course Curriculum, Materials Checklist: "attendance tracking sheet," "learner feedback form").
- **Objections [INFERRED]:** trainers are contract, per-cohort hires (HR Policy Manual, Part 2) — a tool that takes meaningful time to learn is a poor fit for someone engaged for one cohort at a time.
- **Trust requirements [INFERRED]:** must not slow down a live, hands-on session — both courses are explicitly workshop-style, not lecture-style (Academy Course Curriculum, Design Principles: "Practical over theoretical").
- **Information needs [SOURCED]:** roster, per-session attendance, assessment entry, certificate-issuance trigger.
- **Mobile/accessibility needs [INFERRED, high]:** in-person delivery in Nyarugenge means the tool is likely used live, in-room, on a phone or tablet — not at a desk.

## 7. Tech clients (external — no real client exists yet as of this research)

- **Goals [INFERRED from SLA Schedule C]:** reliable systems, transparency on incidents and uptime, fast response on critical issues (2-hour first response, 99% monthly uptime).
- **Pain points [SOURCED, via Eric persona]:** currently juggling separate vendors for systems work, same as the general corporate persona.
- **Objections [INFERRED]:** trusting a brand-new Tech division (no external Tech client exists yet — Business Plan Month 1–3 is internal-only) with production systems. The company's own documented strategy is to solve this by proving Tech internally first (Advisory's own portal) rather than through marketing claims (`docs/business/CROSS_DIVISION_WORKFLOWS.md` §3) — this is itself a trust-building UX strategy, not just an engineering sequencing decision.
- **Trust requirements [SOURCED]:** demonstrated uptime/incident response against stated SLA numbers, not just a promise.
- **Information needs [INFERRED]:** ticket status, uptime history — not yet needed until V2 (`docs/product/PRODUCT_ROADMAP.md`).
- **Mobile/accessibility needs [INFERRED]:** likely a more technical user comfortable on desktop, though a quick mobile ticket-status check is a reasonable want.

## 8. Data clients (external — no real client exists yet)

- **Goals [INFERRED from SLA Schedule D]:** accurate (99.5% target), timely (monthly, 5th-business-day) reports they can act on.
- **Pain points [SOURCED]:** the target segment — "NGOs & SMEs with manual records" (Business Plan §A3) — is struggling to make sense of data they already have, not lacking data itself.
- **Objections [INFERRED]:** confidentiality — will their data be benchmarked against or mixed with another client's (explicitly forbidden without consent, Data Privacy Policy Annex D, but a real prospective-client question nonetheless).
- **Trust requirements [SOURCED]:** access-controlled delivery only — never open links or unsecured email (Data Privacy Policy Annex D).
- **Information needs [INFERRED]:** clear, low-jargon report/dashboard design given the target segment's own described data sophistication ("manual records"), not a dense analyst-grade dashboard by default.
- **Mobile/accessibility needs [INFERRED]:** given the NGO/SME manual-records profile, plain visual reports (not raw data tables) are likely to matter more than for a typical BI power user.

---

## Cross-cutting findings

- **No user testing or analytics exist** — every "need" above is document-sourced or inferred, not observed. This should be stated plainly to whoever reads this research, not hedged into invisibility.
- **Trust is the dominant theme**, not feature richness — a brand-new, single-founder company asking clients to trust it with tax filings, personal data, and course fees needs the UX to carry credibility signals (accuracy, transparency, plain language) more than it needs sophistication.
- **Mobile-first is not optional** for any external-facing persona, given Rwanda's connectivity profile (Business Plan §A2) — this is the single most consistent finding across all 8 user types.
- **Digital literacy varies widely** across the client base (from Aline's Facebook fluency to Jean's near-zero digital footprint) — designing only for the most digitally fluent persona would exclude a real, documented part of the target market.
