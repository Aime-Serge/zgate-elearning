# Z-GATE Digital Platform — Incident Response Summary

**Full depth: `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` (the legally-binding policy and timeline) and `docs/devops/INCIDENT_RUNBOOK.md` (the concrete "what do you actually do" operational companion).** This document is the two-minute version.

## The binding timeline (restated because it's a legal commitment, not a suggestion)

| Step | Deadline |
|---|---|
| Staff/contractor notifies DPO of a suspected/confirmed breach | Within 24 hours of discovery |
| DPO notifies NCSA (where personal data is involved) | Within 48 hours of Z-GATE becoming aware |
| Affected Client notified, with what happened / what data / what's being done | Within 48 hours |

**The DPO role is unfilled.** The Managing Director holds this responsibility by default until it's filled — stated plainly because an incident plan that assumes a role exists when it doesn't is worse than no plan.

## Detection

Direct human report (WhatsApp/call to the MD — the established primary channel for this team size, not a ticketing system) is the realistic primary path today; monitoring-based alerting is not yet provisioned (`docs/OPERATIONS_GUIDE.md`).

## Containment — what's actually available, honestly

| Action | Status |
|---|---|
| Disable a specific account | **Available** — `POST /api/admin/users/:id/deactivate`, API-only, no UI. **Read `docs/SECURITY_GUIDE.md`'s F-2 before using this** — there is no reactivation path and no guard against deactivating the wrong account. |
| Force-logout one specific already-active session | **Not available.** Sessions are stateless (no server-side store) — deactivating an account blocks future logins immediately but doesn't invalidate a session already issued. |
| Invalidate every session platform-wide | Available — rotate `SESSION_SECRET` and redeploy. Blunt (logs out everyone), but real. |
| Rotate a credential (database password, session secret, email API key) | Available, manual, documented in `docs/devops/PRODUCTION_ARCHITECTURE.md`'s Secrets management section. |

## Post-incident

Every Medium-or-above incident gets a brief written review — what happened, what worked, what didn't. This is the mechanism by which a small team's security posture actually improves over time without a dedicated security function to drive it.

## Before this is ever relied on for real

Run the tabletop exercise `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` recommends once real Client data is live — cheap, and surfaces gaps in this plan without needing a real incident to find them.
