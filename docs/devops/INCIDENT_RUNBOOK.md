# Z-GATE Digital Platform — Incident Runbook

`docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` defines the policy — the legally-binding notification timeline, the roles (DPO unfilled, MD by default), the severity scheme, the six phases. **This document is its operational companion: the concrete "what do you actually do, right now" version**, written for whoever is on the other end of that direct WhatsApp/call line when something goes wrong. Where this document lists a concrete action, it only lists ones actually possible in the running system today — this phase specifically checked that, and found (and closed) one real gap; see **Known gap, closed this phase** below.

## Before you do anything: is this actually an incident?

Use `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s severity table. Quick version:

- **Confirmed unauthorized access to Confidential data, across multiple clients, or clearly cross-client exposure → Critical.** Stop reading this section, go to **Critical/High response** below immediately.
- **Suspected but unconfirmed breach, or one compromised account with unclear scope → High.** Same immediate posture, framed as urgent confirmation rather than assumed-confirmed.
- **A vulnerability found with no evidence of exploitation, or a misconfiguration caught and fixed proactively → Medium.** Investigate and remediate on a short timeline; not an emergency page.
- **A blocked attack attempt (e.g., rate-limited login brute-force) with no sign of success → Low.** Log it, review at the next regular check-in. Do not page anyone for this.

## Detection — where a signal actually comes from

| Source | What it looks like | Where to check |
|---|---|---|
| Monitoring alert | `/api/ready` down, error-rate spike (`docs/devops/MONITORING.md`) | Whatever channel the eventual monitoring tool sends to — direct to MD, per that document |
| `access_log` anomaly | An unusual pattern of Confidential-data access (many records viewed rapidly, access outside expected hours, access by an account that shouldn't have that scope) | `access_log` table — no dashboard exists for this yet; a direct query is today's tool, proportionate to team size |
| Direct report | A staff member or Client reports something wrong | The same direct MD channel this whole platform already treats as primary (`docs/ux/EXPERIENCE_REQUIREMENTS.md` §5) |
| Deploy-correlated failure | A production deploy's post-deploy monitoring window (`docs/devops/DEPLOYMENT_RUNBOOK.md` step 8) shows a problem | The deploying engineer, in real time — this is the fastest possible detection path for a deploy-caused incident, don't skip the monitoring window |

## Triage & classification

Apply the severity table above. Write down (even a one-line note): what was observed, when, severity classification, and who's currently investigating. This is the seed of the post-incident review required in phase 6 — starting it now costs nothing and saves reconstructing the timeline later from memory.

## Containment — what's actually available today

`docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` requires these to be "operationally possible... from MVP, not added later when first needed under pressure." Here's the honest state of each, as of this phase:

| Action | How | Status |
|---|---|---|
| **Disable a specific account** | `POST /api/admin/users/:id/deactivate` (admin-role session required) — added this phase | **Now available.** Immediately blocks that account from logging in again (`src/modules/identity/service.ts`'s `deactivateUser`, checked at every login attempt). Idempotent — safe to call again if you're not sure it worked the first time. |
| **Force-logout / revoke an already-active session for one account** | — | **Not available as a per-account action.** Sessions are stateless, signed cookies (`@fastify/secure-session`, ADR-005) with no server-side session store to revoke a single one from. Deactivating the account (above) stops *future* logins immediately, but an already-issued session for that account remains valid until it naturally expires or until every session platform-wide is invalidated (next row). This is a real, honestly-tracked gap — see below, not glossed over. |
| **Invalidate every session platform-wide** | Rotate `SESSION_SECRET` in the production secret store and redeploy | **Available**, but blunt — logs out every currently-authenticated user (every Client, every Staff member, every admin), not just the one account of concern. Use this when a single-account force-logout is genuinely needed *right now* and the alternative (leaving that one session live until it expires) is unacceptable given what's at stake — e.g., Critical severity, confirmed compromise, active session confirmed still valid. |
| **Rotate a specific credential** | `DATABASE_URL` password, `SESSION_SECRET`/`SESSION_SALT`, `EMAIL_PROVIDER_API_KEY` — rotate at the source (Postgres user password, generate new random secret values) and update the production secret store, then redeploy | Available — see `docs/devops/PRODUCTION_ARCHITECTURE.md`'s Secrets management section for what "at the source" means for each. |

### Known gap, closed this phase

Before this phase, **no admin-facing "disable this account" action existed at all** — `deactivated_at` was already checked at login (defensively coded in an earlier phase), but nothing in the API could ever set it. `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md`'s own words — "these must be *operationally possible*... from MVP, not added later when first needed under pressure" — described a requirement the running system didn't actually satisfy. This phase closed that specific gap (`POST /api/admin/users/:id/deactivate`, tested in `src/modules/identity/routes.test.ts`).

**What's still genuinely open, tracked honestly rather than hidden (matching `docs/security/SECURITY_ARCHITECTURE.md`'s "known, accepted gaps" table elsewhere in this engagement):** true per-account session revocation (force-logout one specific already-logged-in session, without logging out everyone else) would need either a server-side session store or a per-user "session version" checked on every request — both are real architectural changes to a session design that deliberately chose to be stateless (ADR-005, "no session-store table, consistent with 'no new recurring vendor cost' reasoning"). That tradeoff was made deliberately in an earlier phase and isn't this phase's call to silently reverse. **Recommendation for a future phase, not built now:** if per-account force-logout becomes a real operational need (vs. a theoretical one), the smallest fix is a `session_version` column on `users`, incremented on deactivation and checked once per request against the session's own copy of that number — cheap, and doesn't require a full session-store migration. Until then, the mitigations above (deactivate blocks future logins immediately; global `SESSION_SECRET` rotation is available for a genuinely urgent single-session case) are the real, available tools — not a gap this document pretends doesn't exist.

### Other containment actions

- **Preserve evidence before remediating**, where possible — a copy of relevant `access_log` rows, the monitoring alert that triggered detection, timestamps. Remediating (patching, rotating) is still the priority; this is "don't casually destroy what you'll want for the post-incident review," not a reason to delay containment.
- **Do not hand-edit the database directly, including now.** `docs/database/MIGRATION_STRATEGY.md` and `docs/devops/ROLLBACK_RUNBOOK.md` are explicit: containment actions operate on data/access (deactivate an account, rotate a credential), never on schema, and never via a direct, unreviewed SQL statement against production — even under incident pressure, especially under incident pressure.

## Eradication & recovery

- Root cause addressed (patch, configuration fix, credential rotation) before declaring the incident closed — not just contained.
- If data integrity was affected: `docs/devops/BACKUP_RECOVERY.md`'s restore procedure, not an ad hoc fix. This is exactly why that document requires *tested* quarterly restores — an incident is the worst possible time to discover a restore procedure doesn't actually work.
- If the incident was deploy-correlated: `docs/devops/ROLLBACK_RUNBOOK.md`.

## Notification — the legally-binding part, not this document's to soften

Restated from `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` because it's binding, not optional:

| Step | Deadline | Owner |
|---|---|---|
| Staff/contractor notifies DPO of a suspected/confirmed breach | Within 24 hours of discovery | Any staff/contractor |
| DPO notifies NCSA (where personal data is involved) | Within 48 hours of Z-GATE becoming aware | DPO — **currently unfilled; the MD holds this responsibility by default** |
| Affected Client notified, with breach description, data affected, containment steps | Within 48 hours | DPO (MD, today) |
| Client notifies affected individuals (if high risk) | Without undue delay | Client (as data controller), with Z-GATE providing needed information |

**Notification content, at minimum:** what happened, what data was affected, what's being done about it — the same directness standard already binding on every other Client communication on this platform ("This is running two days late because of X. Here's the new date").

## Post-incident review

Every Medium-or-above incident gets a brief written review: what happened, what worked, what didn't, what changes (if any) follow. Kept lightweight given team size, not skipped. **If this incident involved the session/force-logout gap above**, the review should explicitly note whether the available mitigations (account deactivation, global secret rotation) were sufficient in practice or whether the deferred `session_version` fix should actually be prioritized now — this is exactly the mechanism by which a real incident should move a "recommended, not built" item into "now justified," rather than this document's own judgment call in the abstract.

## What this document does not do

It does not describe an incident that has occurred — none has, since no system is live in production yet. It does not commit to dedicated incident-response tooling (a SIEM, a dedicated IR platform) — disproportionate to current team size and budget, same reasoning as `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` already gives; this runbook plus the direct human channel it's built on are the actual mechanism. It does not replace that document's legal/policy content — this is the "what to actually run" layer on top of it, not a second, competing policy.
