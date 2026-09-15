# Z-GATE Digital Platform — Incident Response Requirements

Operationalizes the Data Privacy & Security Policy's already-committed breach-response timeline (`docs/business/BUSINESS_RULES.md` §4) into a concrete process. The timeline itself is not this document's to change — it's a legal commitment under Law N° 058/2021, Articles 43–44. This document defines how the platform's architecture supports meeting it.

## Already-committed timeline (restated, binding)

| Step | Deadline | Owner |
|---|---|---|
| Staff/contractor notifies DPO of a suspected/confirmed breach | Within 24 hours of discovery | Any staff/contractor |
| DPO notifies NCSA (where personal data is involved) | Within 48 hours of Z-GATE becoming aware | DPO (currently unfilled — MD by default, see below) |
| Affected Client notified, with breach description, data affected, containment steps | Within 48 hours | DPO |
| Client notifies affected individuals (if high risk) | Without undue delay, with Z-GATE providing needed information | Client (as data controller) |

## Current gap this document does not paper over

**The DPO role is unfilled** (`docs/discovery/SECURITY_BASELINE.md`, carried through every phase). Until it is, **the Managing Director holds DPO responsibilities by default** — consistent with `docs/security/RBAC_SECURITY_MODEL.md`'s treatment of the `admin` role. This is stated explicitly here because an incident response plan that assumes a role exists when it doesn't is worse than useless in an actual emergency — it's a false sense of preparedness.

## Incident response phases

### 1. Detection

- Sources: `audit.access_log` anomalies (`docs/architecture/DATA_ARCHITECTURE.md`), application/error monitoring alerts (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`), a direct report from staff or a Client.
- **Requirement:** any staff member must have a clear, simple, known way to report a suspected incident immediately — given the small team, this is a direct line to the MD (WhatsApp or call, matching the channel this whole platform already treats as primary and trusted, `docs/ux/EXPERIENCE_REQUIREMENTS.md` §5), not a formal ticketing system disproportionate to team size.

### 2. Triage & classification

Severity classification, consistent with this document's Critical/High/Medium/Low scheme (matching `docs/security/THREAT_MODEL.md`):

| Severity | Example | Response posture |
|---|---|---|
| **Critical** | Confirmed unauthorized access to Confidential data (financial/TIN records) across multiple clients; confirmed cross-client data exposure | Immediate, all-hands (i.e., MD directly) response; breach-notification clock starts immediately |
| **High** | Suspected but unconfirmed breach of Confidential data; a single compromised staff account with unclear access scope | Urgent investigation to confirm/rule out within hours, not days |
| **Medium** | A vulnerability discovered with no evidence of exploitation; a misconfiguration found and fixed proactively | Investigated and remediated on a short timeline; not a breach unless evidence emerges otherwise |
| **Low** | A failed, blocked attack attempt (e.g., rate-limited brute-force attempts) with no indication of success | Logged, reviewed at the next regular security check-in, not an emergency |

### 3. Containment

- Predefined containment actions available to the MD (as current incident lead) without needing to wait for anyone else: force-logout/revoke sessions for a specific account, disable a specific account, rotate a specific credential — these must be *operationally possible* (i.e., the `identity` module must support them) from MVP, not added later when first needed under pressure.

### 4. Eradication & recovery

- Root cause addressed (patch, configuration fix, credential rotation) before declaring the incident closed.
- Recovery uses the backup/restore process already specified in `docs/architecture/DEPLOYMENT_ARCHITECTURE.md` if data integrity was affected — this is exactly why that document requires *tested* restores quarterly, not just "backups exist."

### 5. Notification

- Follows the committed timeline table above exactly — no discretion to delay beyond it.
- **Notification content, at minimum:** what happened, what data was affected, what's being done about it — matching the brand voice rule already binding on every other client communication ("This is running two days late because of X. Here's the new date" — the same directness applies here, arguably more urgently).

### 6. Post-incident review

- Every Medium-or-above incident gets a brief written review: what happened, what worked, what didn't, what changes (if any) follow — kept lightweight given team size, but not skipped, since this is the mechanism by which a small team's security posture actually improves over time without a dedicated security function to drive it otherwise.

## Preparedness requirements (before any real incident occurs)

- **A tabletop exercise** (a walkthrough of "what would we actually do if X happened," not a live drill) should be run once MVP is live with real Client data — cheap, doesn't require a real incident to surface gaps in this plan, and is proportionate to current team size and budget.
- **This document itself should be revisited** once NCSA registration completes and/or a DPO is actually designated — the "MD by default" fallback throughout this document is an honest description of today's reality, not a permanent design choice.

## What this document does not do

It does not describe an incident that has occurred — none has, since no system is live yet. It does not commit to specific incident-response tooling (a dedicated IR platform, a SIEM) — disproportionate to current team size and budget; the requirements above are met through the architecture already specified (audit logging, monitoring) plus direct human process, not additional purchased tooling.
