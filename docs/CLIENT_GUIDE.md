# Z-GATE Digital Platform — Client Guide

**Audience:** a Z-GATE client using the Client Portal, or whoever at Z-GATE explains it to them. This describes what actually exists today, including the one real gap in how a client gets started — stated honestly rather than glossed over, because a handover document that hides its own product's biggest gap isn't a handover document worth trusting.

## Before anything else: how you get access

**As of this handover, there is no self-service way to create your own Portal account.** A member of the Z-GATE team must set up your login directly — there is currently no "sign up," "invite," or "create your account" flow built into the product. If you're reading this as a Z-GATE client wondering why you don't have a login yet, that's a real, known gap in the platform, not something you're missing — see `docs/HANDOVER.md`'s Known Limitations for the full detail, and ask your Z-GATE contact directly for credentials in the meantime.

Once you have an email and password:

## Logging in

`https://<the site's real domain>/login`. Sessions last 24 hours before you need to log in again.

**Forgot your password?** `/forgot-password` — enter your email, and if it matches an account, you'll receive a reset link by email (valid for 1 hour, single-use). For privacy, the response is identical whether or not your email matches an account — this is deliberate, not a bug, so someone probing the login form can't use it to discover which emails belong to real clients.

## What you can see and do

| Page | What it shows |
|---|---|
| `/portal` | Your engagement status — active service schedules, compliance items and their due/completed dates |
| `/portal/deliverables` | Documents Z-GATE has prepared for you (filings, reports, other deliverables) — download any of them directly |

Everything you see is scoped to your own client record only — the platform enforces this at the database query level, not just by hiding UI elements, and it's been specifically tested against attempts to view another client's data by manipulating a URL or request (`docs/qa/`, `docs/security/SECURITY_TEST_REPORT.md`).

## What the Portal does not do yet

- No in-portal messaging or document upload from your side — communication with your Z-GATE contact happens the same way it always has (phone, WhatsApp, email), not through the platform.
- No notifications when a new deliverable is ready — you'd need to check the Portal or wait to be told directly.
- No account self-service (changing your email, managing users under your company account) beyond the password-reset flow above.

None of this is a defect exactly — it reflects the platform's actual, current, MVP-stage scope (`docs/product/PRODUCT_ROADMAP.md`), not a promise that was broken. If any of it matters enough to prioritize, it belongs on the roadmap conversation (`docs/ROADMAP.md`), not assumed to already exist.

## If something looks wrong

Contact Z-GATE directly (phone/WhatsApp/email — see the Contact page) rather than assuming a technical issue is something you can fix from your end; account and access issues on this platform currently require a Z-GATE team member with database or admin access to resolve.
