# Z-GATE Digital Platform — Detailed User Journey Map

Thirteen journeys, each broken into stages with **User does / Touchpoint / Feels — pain point / Trust or information need / Mobile & accessibility note**. This is research — mapping the human experience and what it needs at each moment — not a design proposal; no screen, layout, or interaction is specified. Where a stage's underlying rule is sourced, it's cited; UX-specific detail (emotional state, friction) is research judgment grounded in `UX_RESEARCH.md`, not invention of business policy.

---

## 1. Discover Z-GATE

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Trigger | Sees a Facebook/LinkedIn post, or hears by word of mouth/partnership referral (PSF, RDB One Stop Centre) | Social feed or in-person conversation | Neutral to mildly curious; not yet looking for Z-GATE specifically | Needs the message to be immediately relevant to a felt problem (e.g., EBM struggle), per the Business Plan's message-house strategy (§B1) | Facebook/WhatsApp-dominant channel; must render well on a basic phone |
| First impression | Reads the headline claim ("stop juggling four vendors...") | Ad copy / landing content | Skeptical of a brand-new, unproven company | A credible, specific claim beats a vague one — "cut your close time from 12 days to 4," not "unlock synergistic value" (Brand Identity Guide, Voice & Tone table) | Copy must be scannable in a few seconds on mobile |
| Decision to continue | Clicks through, or ignores | Website (once it exists) or continues via WhatsApp | Low commitment moment — one bad load time or confusing page loses them | Fast load on a possibly slow connection (34.2% internet penetration) | Page weight matters more than visual richness |

## 2. Explore service

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Orientation | Lands on a division page (e.g., Advisory) | Website division page | Wants to know "is this for me" fast | Plain-language division mission (already exists as approved copy) | Same page must work for a shop owner (Solange) and a corporate ops manager (Eric) — different sophistication, same page |
| Depth-seeking | Looks for specifics: what exactly is included, how much does it cost | Service description | Uncertainty — no public pricing exists in any approved document today | An honest "contact us for pricing" beats a vague page with no next step | — |
| Cross-division curiosity | Notices the other three divisions exist | Navigation to other division pages | Realization this could be a bundled relationship, not a single service | Reinforce the "one gate, four rooms" idea without overwhelming a single-need visitor | — |

## 3. Request consultation

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Decision to act | Chooses to reach out | Contact form or WhatsApp | A small but real commitment — "will anyone actually respond" | Explicit expectation-setting ("we typically respond within X") — no such commitment is documented publicly yet, a real gap | Form must be fast to complete one-handed on mobile |
| Submission | Fills in name, contact, need | Contact form (`docs/product/PRODUCT_BACKLOG.md` FEAT-01.2) | Relief if simple, frustration if the form demands unnecessary fields | Minimal required fields — matches the "simplest valuable implementation" already scoped in Phase 2 | — |
| Confirmation | Sees a confirmation | On-screen message | Needs reassurance the submission worked, especially on a flaky connection | A visible, unambiguous confirmation state (ST-02 acceptance criteria) | Must not silently fail on a slow connection without feedback |

## 4. Become lead

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Waiting | Waits for a response | None (passive) | Anxiety grows the longer the wait, especially for an urgent compliance worry (Solange) | A stated response-time expectation reduces anxiety even before contact happens | — |
| First human contact | Advisory Associate/MD reaches out (WhatsApp, call, or email) | Human channel, not the product | First real trust-building moment — this is a person, not a form | Warm, plain-language first contact (brand voice rule: "write to a person, not a file") | Likely WhatsApp for Solange-type leads, LinkedIn/email for Eric-type |
| Qualification | Discusses need, division fit clarified | Conversation | Wants to feel understood, not sold to | Direct answers, not hedged ones (brand value: "Precision over polish") | — |

## 5. Become client

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Terms discussion | Reviews Service Schedule scope/fees | SLA document (human-mediated, not a product feature per `docs/product/PRD.md` non-goals) | Wants clarity on what's included vs. billed separately (SLA Clause 3) | Plain explanation of what happens if something isn't in the signed Schedule | — |
| Signing | Signs the Master SLA + Schedule(s) | Physical/document signature process | A real commitment moment — data-sharing consent is being given here (SLA Clause 6) | Explicit confirmation of what data protection applies from this point forward | — |
| Immediate aftermath | Receives portal access (once MVP exists) | Account creation, credentials sent | First "is this really working" test | A working first login is disproportionately important to first impressions of a brand-new company's professionalism | Credentials delivery method must work on the client's primary channel (WhatsApp for Solange, email for Eric) |

## 6. Client onboarding

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| First login | Logs into the Client Portal for the first time | Auth (FEAT-04.2) | Uncertainty about what they're looking at — first-ever experience with any Z-GATE software | A brief, plain orientation to what the portal shows (status, deliverables) prevents confusion | Must work cleanly on the same mobile device used for everything else |
| Empty state | Sees a new account with little/no data yet | Compliance status view (FEAT-05.1) | Could read as "broken" if not handled deliberately | ST-11's acceptance criteria already requires a clear "nothing due yet" state, not a blank/error screen | — |
| First real update | Sees their first real status update (e.g., first month's close-out) | Same view, populated | Builds or breaks trust in the system going forward | Accuracy above all — a wrong status here does lasting damage to adoption | — |

## 7. Client accesses portal (ongoing)

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Routine check | Logs in periodically (own initiative or habit) | Compliance status view | Wants a fast, low-effort way to confirm "everything's fine" | Status must be scannable in seconds, in plain language, no jargon | Mobile-first — this is likely a quick phone check, not a desk session |
| Deliverable retrieval | Looks for a specific document | Deliverables list (FEAT-05.2) | Frustration if hard to find or slow to load | Chronological, clearly labeled list — no complex filtering needed at this scale | Download must work reliably on mobile data |
| Anxious check | Logs in specifically because worried about a deadline | Status view, near a due date | Higher emotional stakes than routine checks | This is the moment accuracy matters most — a stale or wrong "on track" status here is the worst possible failure mode | — |

## 8. Client receives service

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Notification of delivery | Learns a deliverable is ready (currently WhatsApp/email; portal makes it visible too) | Portal + existing channel | Wants to know without having to ask | Some signal that something changed, even if full notification automation is a V1 feature, not MVP | — |
| Review | Opens/reviews the delivered report or filing copy | Deliverable view | Wants confidence the work is correct — this is the entire value proposition of Advisory | Clear labeling of what the document is and when it covers | — |
| Ongoing cadence | Comes to expect a predictable monthly rhythm (5th-business-day close-out target) | Recurring | Predictability itself builds trust over a relationship | Consistency matters more than any single delivery being impressive | — |

## 9. Client submits support request

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Urgent issue arises | E.g., EBM device failure (SLA Schedule A urgent-issue category) | WhatsApp (current channel; no in-portal request feature exists until V1+) | Stress — this is often a time-pressured, compliance-risk moment | A committed 4-business-hour first-response target reduces anxiety if the client knows it exists | WhatsApp remains the right channel for this — building a portal-only request flow before it's needed would be premature (matches Phase 2's MVP exclusions) |
| Waiting for response | Waits within the SLA window | — | Escalating stress if response feels slow, even within target | Explicit acknowledgment ("we've received this, working on it") matters more than the eventual fix, in the moment | — |
| Resolution | Issue resolved or escalated | — | Relief, or frustration if escalation isn't visible/explained | SLA Clause 8's escalation ladder should feel like a safety net, not a bureaucratic wall | — |

## 10. Learner discovers Academy

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Trigger | Sees a Facebook/Instagram post about a course | Social feed | Curiosity, but also self-doubt ("is this for someone like me") | Course description should speak to outcome, not process ("your team ships their first pipeline in week three" — Brand Identity Guide voice example) | Facebook/Instagram-native — must be visually simple and mobile-first |
| Evaluation | Checks dates, fee, prerequisites | Course page (FEAT-08.1) | Price sensitivity is real (RWF 40,000 is a meaningful sum for the target segment) | Clear, upfront fee and what's included — no hidden costs | — |
| Credibility check | Wonders if the certificate means anything | Course page / testimonials (none exist yet — no cohort has run) | Real uncertainty, currently unaddressed since Z-GATE has no track record yet | Curriculum's real differentiator (built from actual Advisory casework) should be surfaced, not buried | — |

## 11. Learner enrolls

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Decision | Chooses to enroll | Enrollment form (FEAT-08.2) | Commitment moment — has real time in a life already reflected in working full days | Minimal friction — this persona is time-poor, not just price-sensitive | Mobile-first, few fields |
| Confirmation | Receives enrollment confirmation | Within the 2-business-day SLA target | Wants certainty about a seat before rearranging their schedule | A clear yes/no, fast — ambiguity here is worse than a short wait | — |
| Pre-course anticipation | Waits for the cohort to start | — | First-time-course nerves for many in this segment (no prior accounting background assumed) | Any pre-course info (what to bring, where, when) reduces day-one anxiety | — |

## 12. Staff manages client

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Start of day/month | Opens the client list (FEAT-06.1) | Advisory operational workflow | Wants an immediate answer to "what needs my attention today" | Sorted by urgency, not alphabetical or by client size | Mixed desktop/mobile (client-facing role) |
| Doing the work | Performs bookkeeping/filing, marks complete (FEAT-06.2) | Internal tool | This work carries real regulatory weight — a mis-click has consequences | The tool must feel trustworthy enough to record a compliance-critical action confidently | — |
| Client-facing follow-through | Uploads the resulting Deliverable (FEAT-06.3) | Internal tool → client portal | Wants the client-facing result to reflect well on their own work | Confidence that what they upload is what the client actually sees, correctly | — |

## 13. Admin manages organization

| Stage | User does | Touchpoint | Feels / Pain point | Trust or info need | Mobile/accessibility |
|---|---|---|---|---|---|
| Routine oversight | Checks the internal reporting view (FEAT-07.1/07.2) | Internal reporting | Wants a fast pulse-check, not a deep audit, most days | A small number of trustworthy figures beats a large dashboard of uncertain ones | Likely checked on the go, given single-founder reality |
| Exception handling | Notices something needs attention (a missed target, a stalled lead) | Same view | Needs to know where to intervene, not just that something's wrong | Enough context to act without switching to another tool first | — |
| Administrative task | Adds/removes a staff account as hires happen (FEAT-09.2, V1) | Admin Platform | Wants this to be simple enough to not need a developer | Confidence the access change took effect correctly and immediately | — |

---

## Cross-journey observations

- **The riskiest moments for trust are the "firsts":** first form submission, first login, first status view, first deliverable. Getting these right matters disproportionately for a brand-new company with no track record — this shows up in nearly every journey above (§1, §5, §6, §10).
- **WhatsApp remains a legitimate, permanent channel for urgent/human moments** (Journey 9) — the research does not support replacing it with an in-product request flow at MVP or even V1; that would remove a channel clients already trust rather than adding one.
- **Mobile-first is confirmed as a cross-cutting requirement** by every external-facing journey (1–5, 7, 10–11), consistent with `UX_RESEARCH.md`'s cross-cutting findings.
