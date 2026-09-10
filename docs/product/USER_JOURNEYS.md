# Z-GATE Digital Platform — User Journeys

Each journey shows **Current State** (how it happens today, per Phase 0/1 discovery — almost entirely manual) against **Future State** (with the platform), tagged to the phase that delivers it. Journeys are the throughline that `PRODUCT_BACKLOG.md` and `USER_STORIES.md` implement piece by piece.

## Journey 1 — Solange: Lead to compliant Advisory client [MVP]

| Step | Current State | Future State | Phase |
|---|---|---|---|
| Discovery | Sees a Facebook post or hears by word of mouth | Sees a Facebook post → clicks through to Z-GATE's public website | MVP |
| Initial contact | Messages on WhatsApp Business directly | Submits a short contact form on the site, or still messages WhatsApp — either lands in the same lead record | MVP |
| Qualification | Marketing Coordinator/MD manually tracks the conversation | Lead appears in the CRM foundation with channel + stated need | MVP |
| Engagement | SLA discussed and signed informally/by document | Same signing process (SLA execution is not a platform feature yet — signing stays a business/legal step); once signed, Advisory Associate marks the lead "converted to client" | MVP |
| Ongoing service | Solange asks "am I compliant?" over WhatsApp, Advisory Associate checks manually | Solange logs into a simple Client Portal and sees her filing status and next deadline in plain language | MVP |
| Notification | Advisory Associate remembers to message her before a deadline | Portal/WhatsApp reminder ahead of a filing deadline **(V1 — MVP ships the status view; proactive notifications are a V1 enhancement, not required for the view to be valuable on its own)** | MVP view / V1 notification |

## Journey 2 — Advisory Associate: Monthly compliance cycle [MVP]

| Step | Current State | Future State | Phase |
|---|---|---|---|
| Start of month | Mental/manual list of which clients are due for close-out | Client list view sorted by compliance-calendar due date | MVP |
| Bookkeeping close-out | Reconciles records manually, tracks the 5th-business-day target informally | Marks a client's monthly close-out complete; system timestamps it against the SLA target | MVP |
| VAT/EBM filing | Files via the existing EBM device/app, tracks the ≥2-business-day-ahead target manually | Logs the filing against the client's compliance calendar; portal reflects "filed" status to the client | MVP |
| Urgent issue | Client messages WhatsApp, Associate responds ad hoc against a 4-business-hour target with no tracking | Logs an urgent issue with a timestamp so the 4-hour target is visible, not just remembered | V1 (MVP: manual logging is enough; automated timers are a V1 refinement) |
| Deliverable handoff | Sends reports via WhatsApp/email | Uploads the Deliverable to the Client Portal, where the client can see and retrieve it | MVP |

## Journey 3 — Managing Director: Cross-division oversight [MVP light → V1 full]

| Step | Current State | Future State | Phase |
|---|---|---|---|
| Weekly check-in | Personally asks each function for status (Advisory clients, lead count, Academy progress) | One internal reporting view: Advisory client/filing status summary, lead-pipeline count | MVP (Advisory + leads only) |
| Full cross-division view | N/A — only Advisory exists as a real operation today | Adds Academy cohort status, Tech ticket/uptime status, Data deliverable status to the same view | V1–V2, as each division's module ships |
| Escalation visibility | Learns of a missed SLA target informally, if at all | Sees any Advisory SLA target at risk (e.g., approaching the 2-business-day escalation threshold) before it's missed | V1 |

## Journey 4 — Aline: Academy enrollment to certificate [V1]

| Step | Current State | Future State | Phase |
|---|---|---|---|
| Discovery | Facebook/Instagram ad → informal inquiry | Course page on the public website with dates, fee, and outcomes | V1 |
| Enrollment | Manual registration (WhatsApp/in-person) | Simple enrollment form; confirmation within the 2-business-day SLA target | V1 |
| Attendance | Trainer tracks on paper | Trainer logs attendance per session, feeding the 90%-completion SLA metric | V1 |
| Assessment & certificate | Manual grading, certificate produced ad hoc | Trainer records assessment result; certificate generated and issued within the 5-business-day target | V1 |
| Not addressed anywhere yet | — | What happens on a failed assessment (no retake process is documented — `docs/business/OPEN_BUSINESS_QUESTIONS.md` #12) | Not built until the business rule exists |

## Journey 5 — Eric: Multi-division engagement visibility [V1/V2]

| Step | Current State | Future State | Phase |
|---|---|---|---|
| Onboarding | Signs one Master SLA with multiple Service Schedules, tracked on paper | Same signing process; system reflects one Client with multiple active Engagements | V1 (requires the Client Portal to exist beyond Advisory-only, i.e. after Tech/Data have their own modules) |
| Ongoing visibility | Separate conversations per division | One login shows Advisory compliance status, Tech project/ticket status, Data deliverable status together | V2 (depends on Tech-ops and Data modules both existing) |
| Billing | Per-Schedule invoicing, consolidation not defined (`docs/business/OPEN_BUSINESS_QUESTIONS.md` #6) | Not resolved by this roadmap — flagged as blocked until the business answers the consolidation question | Blocked, not scheduled |

## Journey 6 — Data Analyst: Internal reporting pipeline [MVP internal → V2 external]

| Step | Current State | Future State | Phase |
|---|---|---|---|
| Building the first templates | No system — data pulled manually from wherever Advisory keeps records | Standard reporting templates run against Advisory's own operational data (client count, filing on-time rate) | MVP |
| Internal use | N/A | MD and Advisory Associate see this as the "internal reporting" view in Journey 3 | MVP |
| External Data client | Not yet operating | Data client receives their own dashboard/report through the platform, access-controlled per Data Privacy Policy Annex D | V2 |

## What's deliberately not a journey yet

No journey is defined for Jean (Phase 2/countryside), for an AI-assisted interaction of any kind, or for a Cybersecurity-service client — none of these have a business workflow behind them yet (`docs/business/BUSINESS_REQUIREMENTS.md` §4–5, `OPEN_BUSINESS_QUESTIONS.md` #16). Mapping a journey before the business scope is confirmed would itself be feature creep.
