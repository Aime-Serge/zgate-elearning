# Z-GATE Digital Platform — Regression Report

## What changed since the last review pass

This QA phase followed directly after a full application-security review (`docs/security/SECURITY_TEST_REPORT.md`), which itself touched shared, high-blast-radius code: `src/app.ts` (security headers, and — in an earlier phase — the rate-limiting registration fix), `src/lib/auth.ts` and `src/modules/identity/service.ts` (login timing fix), `src/lib/storage.ts` (renamed its exported functions), `src/modules/documents/routes.ts` (upload content-type verification), `apps/web/next.config.ts` (new CSP/header config), and `.github/workflows/ci.yml` (twice — session env vars, then a whole new frontend job). Changes to shared infrastructure like this are exactly where regressions hide — a fix in one module silently breaking a different module's assumption about the same shared code. This report is the deliberate check for that.

## Regression sweep performed this phase

**Full static pipeline, both packages, re-run fresh from a clean working tree** (see `TEST_RESULTS.md` for the exact output): lint, typecheck, full test suite, build — all clean, backend (90/90 tests) and frontend (4/4 tests) alike.

**Live route sweep, both dev servers, re-run fresh** (see `TEST_RESULTS.md`): every one of 16 frontend routes and every one of 10 authenticated backend endpoints returned its expected status code with no unexpected change — specifically checked because `next.config.ts`'s new CSP and `app.ts`'s new Helmet registration are exactly the kind of change that could silently 500 every route if misconfigured, and neither did.

**Specific regressions actively checked for, given what changed underneath them:**

- `lib/storage.ts`'s function rename (`writeDeliverable`/`readDeliverable` → `writeStoredFile`/`readStoredFile`) had four call sites across two modules (`documents/service.ts`, `documents/routes.ts`, `documents/routes.test.ts`, `academy/service.ts`) — confirmed all four were updated together in the same change (`git log` shows one commit renaming all four), and the full test suite passing confirms nothing was missed by the compiler either (a stale import would be a typecheck failure, not a silent runtime issue, for a TypeScript codebase like this one).
- Helmet's `Cross-Origin-Resource-Policy` default would have broken every cross-origin frontend→backend `fetch()` call in the entire app (every page that loads any live data) — caught and fixed within the same phase that introduced it (`docs/security/SECURITY_TEST_REPORT.md` F-05), confirmed via live header inspection before being reported as resolved.
- The CI workflow's two edits (session env vars, then the new `web-ci` job) were both validated for YAML correctness (parsed successfully by two independent parsers) since a malformed workflow file fails silently from a local-only perspective — GitHub Actions is the only thing that would ever report a syntax error, and this review has no way to trigger a real run to confirm that directly.
- This QA phase's own fix (D-01, the client-engagement ordering defect) was re-verified against the full test suite immediately after the change — no test broke, though see the follow-up below for why that's a weaker guarantee than it sounds.

## What this regression pass could not cover

The same sandbox limitation documented in every phase of this engagement (`TEST_STRATEGY.md`'s Sandbox limitation): no reachable PostgreSQL means no regression sweep in this session has ever been able to execute the 71 session-gated, database-dependent tests for real. Every regression claim above is either (a) a static/compiler-level guarantee (typecheck catching a broken import), (b) a live HTTP-level check that doesn't require a database (routing, headers, auth gates), or (c) code review. None of it is a substitute for the actual test suite running green against a real database — which, as of this engagement's security review fixing `docs/security/SECURITY_TEST_REPORT.md`'s F-06, will happen automatically on the next CI run for the first time.

## Follow-ups for the next real CI run

1. **Confirm all 91 backend tests and 4 frontend tests genuinely pass** against CI's real ephemeral Postgres — the first true regression signal this project will have had.
2. ~~D-01 has no dedicated test~~ — closed within this same phase: `clients/routes.test.ts` now seeds a completed engagement and two active engagements (different `started_at`) and asserts both the exclusion and the exact order `GET /api/clients/:id` returns. 90 → 91 tests.
3. **Re-run `npm audit`** on both packages as part of every future CI run (already wired into both jobs as of this review) rather than only during manual review passes.

## Regression strategy going forward

Rely on CI as the primary regression gate from this point forward — it is, for the first time, actually capable of being one. Every push/PR to `develop` or `main` now runs: backend lint/typecheck/test(against a real database)/audit/build, frontend lint/typecheck/test/audit/build, and a full-history secret scan. No manual "did I break anything" sweep should be needed for routine changes once this is confirmed working on a real run; manual live-smoke-testing (as performed in this and every prior phase) remains valuable for anything CI structurally can't check — actual browser rendering, real cross-origin behavior, and anything this sandbox's Docker limitation has prevented from ever running for real until now.
