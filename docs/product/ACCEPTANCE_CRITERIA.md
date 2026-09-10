# Z-GATE Digital Platform — Acceptance Criteria

Given/When/Then criteria for every MVP story (ST-01 through ST-14) in `USER_STORIES.md`. Scoped to MVP only, since this is the first implementation-ready set — V1+ stories will get their own acceptance criteria when their phase starts, not speculatively now.

## ST-01 — Read about the four divisions

- **Given** a visitor lands on the Z-GATE website, **when** they view the home page, **then** they see the four division names, one-line missions, and a way to navigate to each division's page.
- **Given** a visitor is on a division page, **when** they read it, **then** the content matches the approved Mission/Vision copy verbatim (no paraphrasing/invention).

## ST-02 — Submit contact form

- **Given** a visitor is on the contact page, **when** they submit name, contact info, and stated need, **then** a lead record is created with those fields plus channel = "website" and a timestamp.
- **Given** a required field is missing, **when** the visitor submits, **then** the form blocks submission and indicates what's missing.
- **Given** a successful submission, **when** it completes, **then** the visitor sees a confirmation message (no email/SMS automation required for MVP).

## ST-03 — Manually log a non-web lead

- **Given** the Marketing Coordinator is logged in, **when** they add a lead with name, contact, channel (WhatsApp/Facebook/LinkedIn/other), and stated need, **then** a lead record is created identical in structure to a website-sourced lead.
- **Given** the lead is saved, **when** viewed in the lead list, **then** its channel is correctly distinguishable from website-sourced leads.

## ST-04 — View all leads with status/channel

- **Given** the Marketing Coordinator is logged in, **when** they open the lead list, **then** they see every lead (web + manually logged) with channel and status (new/qualified/converted/lost).
- **Given** the list is open, **when** filtered by status or channel, **then** only matching leads display.

## ST-05 — Convert lead to client

- **Given** the Advisory Associate is viewing a lead, **when** they mark it "converted to client," **then** a Client record is created and linked to the original lead, and the lead's status updates to "converted."
- **Given** a lead is already converted, **when** viewed again, **then** the conversion action is no longer available (prevents duplicate Client records from the same lead).

## ST-06 — Staff login

- **Given** a staff member has valid credentials, **when** they log in, **then** they reach the internal tools appropriate to their role.
- **Given** invalid credentials, **when** login is attempted, **then** access is denied with no indication of which field was wrong (standard security practice, not a documented business rule but a baseline correctness requirement).

## ST-07 — Client login

- **Given** an Advisory client has valid credentials, **when** they log in, **then** they see only their own Client record's data.
- **Given** a client is logged in, **when** they attempt to access another client's data by any means, **then** access is denied.

## ST-08 — Client list sorted by due date

- **Given** the Advisory Associate is logged in, **when** they open the client list, **then** clients are sorted with the nearest compliance due date first.
- **Given** a client has no upcoming due item recorded, **when** viewed in the list, **then** this is shown clearly rather than silently omitted.

## ST-09 — Mark close-out/filing complete

- **Given** the Advisory Associate is viewing a client, **when** they mark a monthly close-out or filing as complete, **then** the action is timestamped and stored against that client and that month/filing.
- **Given** a close-out is marked complete after the 5th business day of the following month, **when** viewed later, **then** the record still shows the actual completion date (no retroactive "on time" claim) so the SLA target can be honestly assessed.

## ST-10 — Upload a Deliverable

- **Given** the Advisory Associate is viewing a client, **when** they upload a document and tag its type (report/filed-return copy/other), **then** it is stored against that client's record with an upload timestamp.
- **Given** a Deliverable is uploaded, **when** the corresponding client logs into their portal, **then** it appears in ST-12's deliverables list without further action.

## ST-11 — View compliance status (client-facing)

- **Given** an Advisory client is logged in, **when** they view their status page, **then** they see their current compliance status and next due date in plain language (no unexplained tax/accounting jargon, per the brand's voice rule).
- **Given** no due item has been recorded yet for a new client, **when** they view the page, **then** it clearly indicates there's nothing currently due rather than showing a blank or error state.

## ST-12 — View/download deliverables (client-facing)

- **Given** an Advisory client is logged in, **when** they open their deliverables list, **then** they see every document the Advisory Associate has uploaded for them, with type and date.
- **Given** a deliverable is listed, **when** the client selects it, **then** they can view/download it.

## ST-13 — MD's Advisory summary

- **Given** the MD is logged in, **when** they view the internal reporting page, **then** they see: count of active Advisory clients, and the share of filings/close-outs completed on time (per the SLA targets logged via ST-09).
- **Given** no clients exist yet, **when** the MD views the page, **then** it shows zero/empty state clearly, not an error.

## ST-14 — MD's lead pipeline summary

- **Given** the MD is logged in, **when** they view the internal reporting page, **then** they see lead counts broken down by status and by channel.
- **Given** the underlying lead list (ST-04) changes, **when** the MD refreshes the reporting page, **then** the numbers reflect the current state (no stale caching requirement beyond "refreshed on view," per `PRODUCT_BACKLOG.md` FEAT-07.1's simplest-implementation note).

## Cross-cutting acceptance note (applies to all MVP stories)

No story's acceptance criteria assume EBM/RRA system integration, automated notifications, or multi-factor authentication — these are explicitly out of MVP scope (`PRD.md` §2, `PRODUCT_ROADMAP.md` MVP exclusions) and their absence is not a defect in this phase.
