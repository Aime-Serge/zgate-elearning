# Z-GATE Digital Platform — Integration Architecture

**The shortest integration architecture is often the most honest one at this scale.** Per `SYSTEM_CONTEXT.md`, this platform integrates with almost nothing external at MVP/V1 — that's a deliberate, sourced position, not an oversight.

## Integrations that exist (MVP)

| Integration | Purpose | Scope |
|---|---|---|
| Transactional email | Password reset, account-related notices | Minimal — a standard transactional email provider (specific vendor deferred to implementation), not marketing/campaign email (that stays on `docs/marketing/SOCIAL_STRATEGY.md`'s channels, outside this platform) |

## Integrations explicitly NOT built, and why

| Not built | Why |
|---|---|
| EBM billing system integration | Z-GATE operates through a certified third-party EBM provider operationally; the platform is not becoming a billing system (`docs/product/PRD.md` §2 non-goal, `docs/discovery/RISKS.md`'s "maintain relationships with 2+ certified EBM providers") |
| RRA filing API | No such API is described as available in any approved document; filings happen through RRA's own systems, outside this platform's boundary |
| WhatsApp Business API | Deliberately excluded at MVP/V1 — `docs/ux/EXPERIENCE_REQUIREMENTS.md` §5 finds that replacing WhatsApp's human-operated channel with an automated in-product flow would remove trust-building value, not add it. **This is the most likely future integration** (see V1+ direction below), but it is not built now. |
| Zoho/Frappe or other Tech-implementation-partner tools | These are tools a future external *Tech client* might use — they're what Z-GATE Tech might implement *for* a client, not something Z-GATE's own platform integrates with (`docs/marketing/CONVERSION_FUNNEL.md`'s referral strategy, §B7) |
| Any AI/ML service | No approved business document scopes this (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #16) — no integration point is designed for it |
| Payment gateway | No documented need — invoicing/payment flows through the existing EBM relationship, not this platform |

## V1 direction (not built, but planned around)

- **WhatsApp Business API**, if/when proactive Advisory deadline notifications (`docs/product/PRODUCT_ROADMAP.md` V1) are built — the notification module should be designed so its delivery channel is swappable (email today if needed as a stopgap, WhatsApp as the real target), rather than hardwiring email deep into the notification logic now and having to rework it later.

## Integration principles (for whenever a real integration is eventually needed)

- **No integration is built speculatively** — every integration above exists only because a specific, sourced product/business need already justifies it (or is explicitly deferred with a reason, not silently forgotten).
- **Any future integration handling Client personal data crosses borders only under the Data Privacy Policy's existing rule**: an NCSA-issued transfer certificate and written Client notice before the transfer, and the vendor named in the applicable Service Schedule (`docs/business/BUSINESS_RULES.md` §4, §8) — this applies to *any* future third-party tool touching Client data, not just the ones named above.
- **Secrets for any integration** (API keys, credentials) are never stored in plaintext in version control, managed through an access-controlled secrets store — already a committed rule (Data Privacy Policy Annex C) this architecture must honor from the first integration onward.

## What this document does not do

It does not select a specific email provider, WhatsApp Business API vendor, or secrets-management tool — those are implementation-phase choices. It does not design an integration for anything not already justified by an approved business or product requirement.
