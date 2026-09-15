# Z-GATE Digital Platform — Experience Requirements

Requirements synthesized from `UX_RESEARCH.md` and `USER_JOURNEY_MAP.md` — what the experience must deliver, not how it should look. This is still research/requirements, not design: no layout, component, or visual-system decision is made here (the Brand Identity Guide already governs visual identity — `docs/discovery/UI_UX_AUDIT.md` — and is not revisited). Each requirement states its source and which phase it's relevant to, per `docs/product/PRODUCT_ROADMAP.md`.

## 1. Performance & connectivity

| Requirement | Why | Relevant phase |
|---|---|---|
| Every public-facing page must be usable on a slow/intermittent mobile connection | Rwanda's internet penetration is 34.2% against 88.7% mobile connectivity (Business Plan §A2) — a heavy page excludes a large share of the actual addressable market | MVP (website) |
| Portal pages should load and be usable without requiring a large one-time download | Client Portal users (Solange-type) are mobile-primary, often checking status quickly, not settling in for a session | MVP (Client Portal) |
| Submission actions (lead form, enrollment) must give clear feedback even on a slow connection | Journey 3 and 11 both identify "did it actually submit" anxiety as a real failure point on unreliable connections | MVP, V1 |

## 2. Language & clarity

| Requirement | Why | Relevant phase |
|---|---|---|
| All client-facing text must avoid unexplained jargon, or define it inline once | Direct brand voice rule (Brand Identity Guide, Voice & Tone: "no jargon without translation") — reinforced by the research finding that digital/financial literacy varies widely across the client base | All phases, all client-facing surfaces |
| Status information must be expressible in a short, plain sentence, not a technical state name | UX_RESEARCH §2 and §5: clients and learners need "am I okay right now," not a system-status label | MVP (compliance status view) |
| **Open gap, not yet a settled requirement:** whether the platform needs Kinyarwanda and/or French alongside English | No approved business document requires multilingual content (only "a plus" for one job description); but this is a Rwanda-market product and the gap should be resolved by the business before V1, not silently assumed either way | Flag for `docs/business/OPEN_BUSINESS_QUESTIONS.md` — not decided here |

## 3. Trust & credibility

| Requirement | Why | Relevant phase |
|---|---|---|
| First-time experiences (first form, first login, first status view, first deliverable) must be deliberately reliable and clear, even if simple | Cross-journey finding: "firsts" are the highest-risk trust moments for a brand-new, unproven company (`USER_JOURNEY_MAP.md` cross-journey observations) | MVP |
| Empty/new-account states must read as "nothing due yet," never as broken or blank | ST-11's acceptance criteria already requires this; UX research confirms it's a real first-impression risk (Journey 6) | MVP |
| Any stated response-time or SLA commitment shown to a client must be one the business can actually honor | SLA Schedule A/B/C/D already define real targets — the experience should surface these honestly rather than implying faster service than committed to | V1+ (once client-facing SLA-target display is built) |
| The platform must never claim data protections that aren't actually in place yet | NCSA registration and DPO designation are still "Pending" (`docs/discovery/SECURITY_BASELINE.md`) — the experience must not overstate current compliance status to build false trust | MVP (copy-level requirement, applies immediately) |

## 4. Accessibility & digital literacy

| Requirement | Why | Relevant phase |
|---|---|---|
| Core flows (status check, enrollment) must be completable by a user with limited prior digital-tool experience | The persona set spans from Aline (high digital fluency) to Jean (near-zero) — designing only for the fluent end excludes a real market segment | MVP, V1 |
| Critical actions (marking a compliance item complete, issuing a certificate) should be hard to trigger accidentally | UX_RESEARCH §3, §6: these actions carry real regulatory/business weight for Advisory Associate and Academy Trainer, both of whom are new to using any Z-GATE software at all | MVP, V1 |
| Visual/text contrast and legibility should meet a reasonable baseline for outdoor/bright-light mobile use | Inferred from the client base's mobile-first, often-on-the-go usage pattern (shop owners, field contexts) — not a documented business rule, but a defensible accessibility baseline | MVP |

## 5. Channel continuity

| Requirement | Why | Relevant phase |
|---|---|---|
| WhatsApp must remain a legitimate, supported channel alongside the product, not be replaced by it | Journey 9 (urgent support requests): WhatsApp is Solange's primary channel and the current urgent-issue path; removing it before an equally trusted alternative exists would be a regression, not an improvement | MVP and beyond — do not build a "WhatsApp replacement" feature prematurely |
| The product should not require a client to learn a new channel for something they already do comfortably in WhatsApp | Same reasoning — matches `docs/product/PRD.md`'s MVP exclusion of any messaging/notification automation | MVP |

## 6. Emotional/moment-of-truth handling

| Requirement | Why | Relevant phase |
|---|---|---|
| The compliance status view must be at its most reliable and clear specifically near a due date | Journey 7 identifies the "anxious check near a deadline" as the highest-stakes moment for the single most important MVP screen | MVP |
| Urgent-issue acknowledgment should happen even before resolution | Journey 9: stress is driven as much by silence as by the underlying problem — an acknowledgment reduces anxiety independent of resolution speed | Applies to the current WhatsApp-based process now, and to any future in-product request flow |

## 7. Staff/internal experience requirements

| Requirement | Why | Relevant phase |
|---|---|---|
| The Advisory Associate's task list must be ordered by urgency (compliance due date), not by any other default sort | Journey 12; matches FEAT-06.1's already-scoped behavior | MVP |
| Internal tools for contract/temporary roles (Academy Trainer) must be learnable in minutes, not require onboarding time | UX_RESEARCH §6: trainers are engaged per cohort, not long-term staff — a steep learning curve here has an outsized relative cost | V1 |
| The Admin experience (adding/removing staff access) must not require developer involvement to complete a routine task | Matches FEAT-09.2; UX_RESEARCH §4 notes the MD's time is explicitly meant to go to sales/strategy, not admin friction | V1 |

## What this document does not do

It does not specify colors, layouts, component libraries, or interaction patterns — those decisions come after this research phase, and reference the existing Brand Identity Guide when they do. It does not resolve the multilingual-content open gap (§2) — that's a business decision, recorded, not made here.
