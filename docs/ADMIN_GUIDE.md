# Z-GATE Digital Platform — Admin Guide

**Audience:** whoever holds the `admin` role (today, the Managing Director by default — `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` notes the DPO role is unfilled and the MD holds that responsibility until it is). This is the accurate, current picture of what an admin account can actually do — not an aspirational one.

## Logging in

`https://<the frontend's real domain>/login` — email and password. There is currently no self-service password-setup for a *new* admin account; the account itself must be created directly in the database (see "What admin cannot do yet" below).

## What the staff platform gives you

An `admin` account sees every section of the staff platform (`/staff/*`), regardless of division — the sidebar (`StaffNav`) shows Leads, Clients, Academy, and Reporting for `admin` specifically because the role check for each is `["<the relevant staff role>", "admin"]`, everywhere in the codebase:

| Page | What you can do |
|---|---|
| `/staff/leads` | View all leads, filter by status/channel, convert a lead to a client |
| `/staff/clients` | View every client, open a client's detail page, upload deliverables, mark compliance items complete |
| `/staff/academy` | View cohorts, manage enrollment/attendance/assessments, issue certificates |
| `/staff/reporting` | Advisory summary, lead pipeline, plus two admin-only sections: **Data quality** and **Data dictionary** (schema structure and cross-division completeness signals — no non-admin role has a documented need for these) |

Because `admin` is authorization-equivalent to `staff_advisory` for client data today (`src/lib/engagementAccess.ts` — a documented, accepted MVP limitation, not a bug), there is no separate "admin view" of client records distinct from what an Advisory staff member sees.

## Incident containment — API only, no UI

`POST /api/admin/users/:id/deactivate` disables a user's account (blocks future logins immediately). **This has no frontend page** — as of this handover, using it requires a direct authenticated API call (e.g., `curl` with your session cookie, or a tool like Postman/Insomnia), not a button in the staff platform. Full procedure and the honest limitations of this action (no self-deactivation guard, no "last admin" guard, no way to undo it via the API) are in `docs/SECURITY_GUIDE.md` and `docs/INCIDENT_RESPONSE.md` — **read those before using this in a real incident**, not after.

## What admin cannot do yet

Stated plainly rather than discovered the hard way:

- **Cannot create a new user account of any role (admin, staff, or client) through the product.** Every account in `users` today exists because someone inserted it directly into the database. There is no signup form, no "invite a staff member" button, no "create client login" action anywhere in the API or UI (`grep -rn 'insertInto("users")'` across every route/service file returns zero matches outside the schema itself). This is the single most significant gap identified in the platform's most recent commercial-readiness review — see `docs/HANDOVER.md`.
- **Cannot reactivate a deactivated account through the product** — same gap, opposite direction. Undoing a deactivation requires direct database access.
- **Cannot assign a specific Advisory staff member to a specific client** — no assignment concept exists in the schema yet (`docs/security/RBAC_SECURITY_MODEL.md`'s documented limitation); every `staff_advisory` account sees every client.

## Support

If something in the staff platform looks wrong or an action fails unexpectedly, the correlation ID in the error response (visible in the browser's network tab, or in the plain-language error message's fine print) maps to a structured server log entry — see `docs/OPERATIONS_GUIDE.md` for how to find it.
