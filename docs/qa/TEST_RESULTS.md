# Z-GATE Digital Platform — Test Results

**Run date:** 2026-09-11
**Environment:** Sandboxed development session, no reachable PostgreSQL (see `TEST_STRATEGY.md`'s Sandbox limitation). Two dev servers running locally throughout this pass: backend on `:3000`, frontend on `:3001`.

## Static verification (both packages)

| Package | Lint | Typecheck | Unit/Integration tests | Build |
|---|---|---|---|---|
| Backend (`zgate-platform`) | ✅ Clean | ✅ Clean | ✅ 91/91 passing, 14 files | ✅ Clean |
| Frontend (`web`) | ✅ Clean | ✅ Clean | ✅ 4/4 passing, 2 files | ✅ Clean (22 routes built, 20 static + 2 dynamic) |

Both re-run fresh immediately before this document was written, from a clean working tree at the current `develop` HEAD.

## What "91/91 passing" actually means — an honest breakdown

This phase re-audited exactly which of the 90 backend tests execute their real assertions in this sandbox versus skip cleanly, and — more importantly — which ones were actually reachable in CI before and after `docs/security/SECURITY_TEST_REPORT.md`'s F-06 fix:

| Group | Files | Tests | DB-dependency | Status before F-06 fix | Status after |
|---|---|---|---|---|---|
| Pure unit (no DB at all) | `app.test.ts`, `health.test.ts`, `config.test.ts`, `fileSignature.test.ts` | 14 | None | Always ran for real, everywhere | Unchanged |
| DB-gated on `DATABASE_URL` only (no session needed) | `audit.test.ts`, `crm/routes.test.ts` | 5 | Direct DB writes, no login required | Already ran for real in CI (CI always set `DATABASE_URL`) | Unchanged |
| Full session-gated (`DATABASE_URL` + `SESSION_SECRET` + `SESSION_SALT`) | `academy`, `advisory`, `clients`, `crm/leads`, `documents`, `identity/password-reset`, `identity/routes`, `reporting` | 72 | Logs in via a real session cookie, then exercises authorization/IDOR/business-logic paths | **Silently skipped in CI** — the two session env vars were never set | **Now executes for real** in CI, as of the security review's fix |

In this sandbox, all 91 report as "passing" because every DB-dependent test's own skip-guard triggers cleanly (`console.warn`, then an early `return` — this is the intended, documented behavior for a developer machine without Postgres, not a failure). The 72 in the last row are the ones this QA phase cannot itself confirm pass against a real database — that confirmation is what the next CI run on this branch provides, for the first time in this engagement's history for those 72. (One of the 72 — `clients/routes.test.ts`'s new D-01 regression test, added within this same QA phase — has never existed in CI at all until this commit, so it has no "before" state to compare against.)

**Partial local verification performed anyway:** re-running `src/modules/identity/routes.test.ts` with the CI-matching env vars set (but pointing at an unreachable database) produces a real Postgres authentication error, not a skip — proving the guard now evaluates correctly and real connection code executes. This does not prove the assertions themselves pass, only that they now run.

## Live functional smoke test (against the running dev servers)

Full route sweep, both frontend and backend, performed fresh during this phase:

**Frontend — every page returns 200 (or the correct redirect-eligible 200 shell for an authenticated route without a session):**
```
/  /about  /advisory  /academy  /tech  /data  /contact  /academy/enroll
/login  /forgot-password  /reset-password
/portal  /portal/deliverables  /staff/leads  /staff/clients  /staff/reporting  /staff/academy
```
All 16 → `200`. A deliberately nonexistent route (`/this-page-does-not-exist`) → `404`, confirming Next.js's not-found handling still works.

**Backend — every authenticated endpoint correctly rejects an unauthenticated caller:**
```
GET /api/auth/session          -> 401
GET /api/clients/me            -> 401
GET /api/clients               -> 401
GET /api/leads                 -> 401
GET /api/advisory/compliance-items -> 401
GET /api/documents             -> 401
GET /api/reporting/advisory-summary -> 401
GET /api/reporting/lead-pipeline -> 401
GET /api/reporting/data-dictionary -> 401
GET /api/reporting/data-quality -> 401
```
**Genuinely public endpoints correctly attempt their work without auth:**
```
GET /api/health          -> 200
GET /api/academy/courses -> 500 (expected: no reachable database - see Sandbox limitation. Correctly a generic 500, not a leaked stack trace or DB error string - confirmed by inspecting the response body.)
GET /api/academy/cohorts -> 500 (same reason)
```
No unexpected status code anywhere in this sweep — no regression found at the routing/auth-gate layer.

## Non-functional results

- **Responsiveness:** code-review-verified against `docs/design/RESPONSIVE_RULES.md` — every data table in the codebase (leads, clients, deliverables, Academy roster) uses the same established mobile-first collapse pattern (real `<table>` markup, CSS-only visual restyling to stacked cards below `640px`). Not machine-verified — no visual-regression tooling exists (`TEST_PLAN.md`).
- **Reliability / error handling:** every page reviewed has an explicit loading (skeleton), empty, and error+retry state (no page falls through to a blank or broken-looking screen); confirmed live that a forced backend error returns only `{error:{code, message, correlationId}}` — no stack trace, no SQL error text, no internal path, in any response observed during this pass.
- **Security:** not re-tested here — see `docs/security/SECURITY_TEST_REPORT.md` for the dedicated review (7 findings, all fixed within that phase).
- **Accessibility / browser compatibility / performance:** not executed this phase — see `TEST_PLAN.md`'s non-functional table and `DEFECTS.md` for the tracked gaps.

## Regression evidence

See `REGRESSION_REPORT.md` for the full history and this phase's specific regression sweep results (summarized above, detailed there).
