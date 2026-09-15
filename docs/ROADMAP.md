# Z-GATE Digital Platform — Roadmap

**Full depth: `docs/product/PRODUCT_ROADMAP.md`, `PRODUCT_BACKLOG.md`, `PRODUCT_KPIS.md`.** This document reorders that roadmap around what's actually true today — real defects and real gaps found by the most recent review passes come first, ahead of new feature work, because shipping new features on top of an unresolved release-blocker would be the wrong priority for whoever inherits this next.

## Before anything else ships to production

These are not "nice to have eventually" — they are the specific findings that kept the most recent release candidate from being approved:

1. **Build a client account-provisioning path.** No signup, invite, or "create client login" flow exists anywhere in the product — the single most significant gap found in the commercial-readiness review, sitting directly at the Client → Portal handoff this whole platform's value proposition depends on. Smallest viable fix: a staff/admin-facing "create portal account for this client" action that generates credentials and (once email is truly wired up) sends them, or at minimum a documented manual process until that's built.
2. **Add audit logging to the CRM leads module.** `GET /api/leads` and `POST /api/leads` currently log nothing, in direct violation of this platform's own documented data-classification requirement for Confidential data. Small, mechanical fix — the pattern already exists correctly in every other module.
3. **Add a reactivation path and a self/last-admin guard to account deactivation.** The incident-containment endpoint built for exactly this purpose currently has no undo and no safety rail.
4. **Resolve `ADR-004`** (hosting region / data residency) with the Managing Director and Rwandan legal counsel — this single decision unblocks staging provisioning, backups, monitoring, and eventually production itself. Nothing else on this list matters commercially until real infrastructure exists to run it on.
5. **Complete NCSA registration and designate a DPO** — both already tracked as Pending/unfilled across every phase of this engagement, both legal prerequisites independent of anything engineering can fix.

## Near-term, once the above is closed

- The homepage headline currently leads with a brand metaphor before the concrete pain point a cold visitor needs to see first — a sequencing fix, not a rewrite (`docs/release/COMMERCIAL_READINESS.md`).
- About page has no closing call-to-action.
- No privacy-policy page or link exists anywhere on the public site, despite the site collecting personal data through a public form.
- The global footer omits phone/WhatsApp, the established primary trusted channel for this market, despite it being present on the dedicated Contact page.
- Provision real staging infrastructure and exercise the deployment/rollback runbooks for the first time against something real.
- Provision external uptime monitoring and a backup mechanism, once a hosting target exists to point either at.

## V1 scope (per the original product roadmap, unchanged by this review)

Assignment-scoped Advisory access (closing the `staff_advisory`/`admin` equivalence gap identified as a real broken-access-control risk once headcount grows), a per-account session-revocation mechanism (closing the "can't force-logout one specific session" gap), and whatever V1 feature scope `docs/product/PRODUCT_ROADMAP.md` already defines — not re-litigated here.

## Explicitly not recommended yet

New feature surface area (Tech-division client work, an Admin UI, Case Studies/Insights content, localization) — every one of these was already evaluated and deliberately deferred earlier in this engagement, for reasons that still hold (`docs/SYSTEM_OVERVIEW.md`'s "Deliberately not built" section). Nothing in this review changes that calculus; if anything, the findings above argue for closing what's already started before opening anything new.

## What this document does not do

It does not commit to dates — this engagement's own working style has been phase-by-phase, verified-before-moving-on, not calendar-driven, and imposing a fabricated timeline here would violate the same no-fabrication discipline this whole project has held to throughout. `docs/product/PRODUCT_ROADMAP.md`'s Day-90/Month-4-6/Month-7-12 framing is the Business Plan's own timeline, not invented here.
