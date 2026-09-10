# Z-GATE Digital Platform — User Stories

Format: **ST-xx — As a [persona], I want [capability], so that [outcome].** Each story maps to one `PRODUCT_BACKLOG.md` feature ID. MVP stories are fully specified (all are part of the first implementation-ready vertical slice or its immediate surroundings); V1 stories are included to show the pattern continues, not as a complete V1 breakdown. Acceptance criteria for MVP stories are in `ACCEPTANCE_CRITERIA.md`, matched by ID.

## MVP stories

**ST-01** (FEAT-01.1) — As a **Prospect**, I want to read about Z-GATE's four divisions on a website, so that I can decide if any of them solve my problem before contacting anyone.

**ST-02** (FEAT-01.2 / FEAT-02.1) — As a **Prospect**, I want to submit my contact details and what I need through a simple form, so that someone at Z-GATE follows up without me having to find a WhatsApp number.

**ST-03** (FEAT-02.2) — As the **Marketing Coordinator**, I want to manually log a lead that came in through WhatsApp or Facebook, so that every lead — regardless of channel — is counted toward the weekly KPI report.

**ST-04** (FEAT-03.1) — As the **Marketing Coordinator**, I want to see all leads in one list with their status and channel, so that I can report weekly progress against the 500-contact target without reconciling three channels by hand.

**ST-05** (FEAT-03.2) — As the **Advisory Associate**, I want to mark a lead as "converted to client" once an SLA is signed, so that the lead becomes a real Client record I can start tracking compliance work against.

**ST-06** (FEAT-04.1) — As a **staff member**, I want to log in with my own account, so that I only see the internal tools relevant to my work.

**ST-07** (FEAT-04.2) — As an **Advisory client** (e.g., Solange), I want to log in and see only my own information, so that my business's compliance data stays private to me.

**ST-08** (FEAT-06.1) — As the **Advisory Associate**, I want to see my clients sorted by their next compliance due date, so that no filing deadline gets missed because it wasn't top of mind.

**ST-09** (FEAT-06.2) — As the **Advisory Associate**, I want to mark a client's monthly close-out or filing as complete, so that there's a timestamped record of whether we hit the SLA target (5th business day close-out; ≥2 business days ahead of filing deadline).

**ST-10** (FEAT-06.3) — As the **Advisory Associate**, I want to upload a Deliverable (report, filed-return copy) to a client's record, so that the client can retrieve it themselves instead of me sending it over WhatsApp.

**ST-11** (FEAT-05.1) — As an **Advisory client**, I want to see my current compliance status and next due date in plain language, so that I know where I stand without messaging the Advisory Associate to ask.

**ST-12** (FEAT-05.2) — As an **Advisory client**, I want to see and download the documents Z-GATE has delivered for my business, so that I have them in one place instead of scattered across WhatsApp/email.

**ST-13** (FEAT-07.1) — As the **Managing Director**, I want to see how many active Advisory clients I have and what share of filings were on time, so that I know the business's real status without asking the Advisory Associate directly every week.

**ST-14** (FEAT-07.2) — As the **Managing Director**, I want to see lead volume and conversion by channel, so that I can judge whether marketing spend is working without waiting for the Marketing Coordinator's manual report.

## V1 stories (representative sample — not a full V1 breakdown)

**ST-15** (FEAT-08.1) — As **Aline** (prospective learner), I want to see upcoming Academy course dates, fees, and what I'll be able to do afterward, so that I can decide whether to enroll.

**ST-16** (FEAT-08.2) — As the **Academy Trainer**, I want to confirm a learner's enrollment within 2 business days, so that I meet the Schedule B SLA target and the learner knows they have a seat.

**ST-17** (FEAT-08.3) — As the **Academy Trainer**, I want to record attendance per session, so that I can prove the 90% completion rate the SLA requires.

**ST-18** (FEAT-08.4) — As the **Academy Trainer**, I want to record a learner's final assessment result and generate their certificate on a pass, so that certification happens within the 5-business-day target.

**ST-19** (FEAT-09.2) — As the **Managing Director**, I want to add or deactivate a staff member's account myself, so that onboarding a new hire (e.g., the Academy Trainer) doesn't require a developer.

## What is deliberately not a story yet

No story exists for: automated filing-deadline notifications (flagged as a V1 enhancement in `USER_JOURNEYS.md` Journey 1, not required for MVP's status view to be valuable on its own), any Tech/Data external-client story (V2, blocked on a real external client existing first), any multi-division Client Portal story for Eric (blocked on `docs/business/OPEN_BUSINESS_QUESTIONS.md` #4), and anything AI-related (Future, unscoped).
