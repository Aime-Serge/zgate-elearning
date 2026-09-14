# Z-GATE Digital Platform — Known Issues

Consolidated from every specialized review phase this engagement has run (QA, Security, Performance, SEO/Content, DevOps) plus this release cycle's own verification — one place to see everything currently open, so nothing is only discoverable by reading six other documents. Nothing here is re-litigated; each item cites its source document as the authority on detail and evidence.

**Zero Blocker. Zero Critical.** Every item below is High-with-owner-sign-off-only, Medium, Low, or Informational, or is a business/compliance precondition rather than a software defect.

## Requires explicit owner sign-off before calling fully hardened

| ID | Issue | Severity | Source | Status |
|---|---|---|---|---|
| KI-01 | Frontend CSP allows `'unsafe-inline'` for `script-src`/`style-src` — Next.js App Router's own hydration payload needs it, no nonce wired up | High (residual, intentional) | `docs/security/SECURITY_TEST_REPORT.md` F-04 | Open, documented tradeoff — not a launch blocker per that report's own release-readiness statement, but the one item flagged for someone to explicitly accept or schedule a nonce-based hardening pass |

## Business/compliance preconditions (block production deployment, not this release candidate's correctness)

| ID | Issue | Status | Source |
|---|---|---|---|
| KI-02 | Hosting region / data residency undecided | ADR-004 **Open** | `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md` |
| KI-03 | NCSA registration incomplete | **Pending** | `docs/discovery/SECURITY_BASELINE.md`, carried every phase |
| KI-04 | DPO role unfilled (MD holds responsibility by default) | **Pending** | `docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md` |
| KI-05 | Backup storage location/residency undecided | Gated on KI-02 | `docs/devops/BACKUP_RECOVERY.md` |

## DevOps/release-process gaps

| ID | Issue | Severity | Status | Source |
|---|---|---|---|---|
| ~~KI-06~~ | ~~No `main` branch or git remote exists — CI has never executed on real GitHub infrastructure at any point in this engagement~~ | High for release automation, not for code correctness | **Resolved 2026-09-14** — repo created (`github.com/Aime-Serge/z-gate`), `main`/`develop` pushed, PR #1 opened, real CI ran and passed (96/96 backend, 4/4 frontend, migrations applied against live Postgres, gitleaks clean). Also surfaced and fixed two real, previously-unexercised DB-dependent test bugs — see `docs/release/RELEASE_CHECKLIST.md`'s Update section. | `docs/release/RELEASE_CHECKLIST.md` |
| KI-07 | External uptime/error monitoring, alerting, and log aggregation not provisioned | Medium | Open, deliberately deferred pending a hosting target | `docs/devops/MONITORING.md` |
| KI-08 | No per-account session revocation (force-logout one already-active session without logging out everyone else) — sessions are stateless by design (ADR-005) | Medium | Open, with real available mitigations (account deactivation blocks future logins immediately; global `SESSION_SECRET` rotation is available for a genuinely urgent case) | `docs/devops/INCIDENT_RUNBOOK.md` |
| KI-09 | `jsdom@30.0.1` (frontend test dependency) wants Node `^22.22.2` or newer; this development sandbox runs `22.22.1` | Low | Open, non-fatal (`EBADENGINE` warning only, tests pass) | Found this release cycle |
| KI-10 | Backend `package.json` version (`0.0.0`) and frontend (`0.1.0`) are inconsistent, both untouched scaffold defaults | Low | Open, recommended follow-up | `docs/release/RELEASE_NOTES.md` |

## Functional defects (QA phase)

| ID | Issue | Severity | Status | Source |
|---|---|---|---|---|
| KI-11 | Academy assessment score rendered with raw DB formatting (`"85.00"` instead of `"85"`) | Low, cosmetic | Open, not fixed (deferred) | `docs/qa/DEFECTS.md` D-02 |
| KI-12 | Attendance `sessionNumber` has no upper bound tied to a course's real session count | Low, unreachable via the shipped UI | Open, not fixed (deferred) | `docs/qa/DEFECTS.md` D-03 |

## Coverage gaps (process maturity, not defects in running code)

| ID | Issue | Severity | Source |
|---|---|---|---|
| KI-13 | No end-to-end (real-browser) test suite | Low | `docs/qa/DEFECTS.md` G-01 |
| KI-14 | No automated accessibility testing (axe-core/jest-axe) | Low | `docs/qa/DEFECTS.md` G-02 |
| KI-15 | No cross-browser compatibility testing | Low | `docs/qa/DEFECTS.md` G-03 |
| KI-16 | No performance/load testing (no production traffic exists yet to target) | Informational | `docs/qa/DEFECTS.md` G-04 |

## Performance items identified and deliberately not changed

| ID | Issue | Reasoning | Source |
|---|---|---|---|
| KI-17 | Forms bundle (~100KB gzipped: zod + react-hook-form + schemas) | Real cost, but not yet justifying a lighter-weight alternative at current scale | `docs/performance/PERFORMANCE_REPORT.md` |
| KI-18 | `compliance_items` has no full index on `engagement_id` | Currently inconsequential at real data volumes; revisit if that changes | `docs/performance/PERFORMANCE_REPORT.md` |

## Content findings (review, not defects)

| ID | Issue | Status | Source |
|---|---|---|---|
| KI-19 | About page has no closing call-to-action (every other public page does) | Open, flagged for a future content pass — not fixed this engagement since the SEO/content phase's scope was "review," not "rewrite" | `docs/marketing/CONTENT_AUDIT.md` |
| KI-20 | No public page states its audience/ICP segment explicitly | Open, same reasoning as KI-19 | `docs/marketing/CONTENT_AUDIT.md` |

## Fixed this release cycle (listed for traceability, not open)

- A deadlock in `/api/ready` (`await reply.code(503)` never resolving) and a missing database-connection timeout that would have hung any request during a real outage — both found via manual verification, both fixed, both regression-tested.
- An untracked `apps/web/public/` directory that would have broken a from-scratch production Docker build.
- CI's migration application step replaced with the same idempotent runner staging/production will use, closing a gap where the prior approach would have failed against any persistent (non-ephemeral) database.

## What this document does not do

It does not re-derive severity, evidence, or fix detail already fully documented in each item's cited source — this is an index for release-time visibility, not a replacement for `docs/qa/DEFECTS.md`, `docs/security/SECURITY_TEST_REPORT.md`, `docs/performance/PERFORMANCE_REPORT.md`, or the `docs/devops/` runbooks. It does not claim any of KI-02 through KI-05 as resolved by this release — those remain exactly as open as they were before this release cycle began; this document's job is only to make sure a release approver sees them in one place.
