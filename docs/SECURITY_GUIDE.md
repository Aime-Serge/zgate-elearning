# Z-GATE Digital Platform — Security Guide

**Full depth: `docs/security/` (architecture, threat model, requirements, RBAC model, data protection, incident response requirements, the original security test report), plus the independent security audit performed after the release-candidate phase — see the "Independent audit findings" section below, which is the most current, authoritative picture.** This document reconciles both rather than picking one and ignoring the other.

## Security posture, honestly

Two full security review passes have now happened at different points in this engagement:

1. **`docs/security/SECURITY_TEST_REPORT.md`** (during initial implementation) — found and fixed 7 issues (3 High, 4 Medium): a login timing side-channel, spoofable file-upload type validation, missing security headers on both packages, and two CI-integrity gaps. All 7 were remediated in that same pass.
2. **An independent security audit, run explicitly not trusting that first pass** (after the release-candidate phase) — found real, additional, unresolved issues the first pass missed. **That audit's own verdict was RELEASE BLOCKED.** Nothing has been fixed since. This document does not soften that.

## What's genuinely solid (independently re-verified, not just claimed)

- Session cookies: `httpOnly`, `sameSite: "lax"`, `secure` in production — real CSRF resistance, live-tested.
- CORS: single explicit origin, no wildcard, live-tested.
- File upload: MIME allowlist **and** actual byte-signature verification against the claimed type, not just a trusted client header.
- File storage: server-generated random UUIDs only, defense-in-depth path-traversal checking.
- Password reset: 256-bit random tokens, hashed at rest, single-use, time-limited.
- Object-level authorization: consistently 404 (never 403) for "not yours," across every module — avoids existence leakage.
- Dependencies: 0 vulnerabilities, both packages, independently re-audited.
- No hardcoded secret anywhere in source, independently grep-swept.

## Unresolved findings from the independent audit — not fixed, not hidden

| ID | Finding | Severity | Status |
|---|---|---|---|
| F-1 | `GET /api/leads` and `POST /api/leads` have **zero audit logging**, directly violating `docs/architecture/DATA_ARCHITECTURE.md`'s own stated requirement that `crm.leads` (Confidential-classified PII) access be logged. Every comparable module (clients, documents, advisory, academy) does this correctly — leads was simply missed. | High | Open |
| F-2 | The admin account-deactivation endpoint (`POST /api/admin/users/:id/deactivate`) has **no reactivation path anywhere in the API** and no guard against deactivating yourself or the platform's last remaining admin — a real, irreversible-without-database-access lockout risk, on the very endpoint built for incident response. | High | Open |
| F-3 | The backend's Content-Security-Policy doesn't do what its own code comment says it does — Helmet merges partial directives with its own defaults rather than replacing them, so `script-src` actually resolves to `'self'`, not blocked. Not currently exploited (the one HTML-serving route manually escapes its inputs), but the stated security assumption is wrong. | Medium | Open |
| F-4 | `staff_advisory` and `admin` are authorization-equivalent for every client's Confidential data — no per-staff assignment scoping exists. Documented as an accepted MVP limitation elsewhere, but becomes a real broken-access-control condition the day a second Advisory staff member is hired. | Medium | Open (tracked as a hiring precondition) |
| F-5 | Frontend CSP still allows `'unsafe-inline'` for `script-src`/`style-src` — zero protection against inline script execution if an XSS injection point is ever introduced. | High (residual, flagged for explicit sign-off since the original security review) | Open |
| F-6/F-7 | Minor hardening gaps: `ci`/`web-ci` GitHub Actions jobs lack an explicit `permissions:` block (currently safe only because of an out-of-band repo setting); `X-Powered-By: Next.js` leaks framework fingerprint; dev-only Docker Compose ports bind to all interfaces, not just localhost. | Low | Open |

**None of these require exotic effort to fix** — F-1 and F-2 in particular are small, well-scoped, and should be closed before this platform is trusted with a real incident or real client PII, not carried forward as "known issues" indefinitely.

## Compliance/business gates (not engineering's to resolve)

NCSA registration: Pending. DPO: unfilled (MD holds responsibility by default). Data residency/hosting region: open (`ADR-004`). These block production deployment of real Client data regardless of anything else in this document, and have been consistently, honestly tracked across every phase of this engagement — see `docs/HANDOVER.md`.

## Incident response

`docs/INCIDENT_RESPONSE.md` is the operational summary; `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` and `docs/devops/INCIDENT_RUNBOOK.md` are the full policy and runbook.
