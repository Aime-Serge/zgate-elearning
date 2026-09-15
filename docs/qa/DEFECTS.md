# Z-GATE Digital Platform — Defects

Classification: **Blocker** (system-breaking, no workaround) · **Critical** (major function broken or a security/data-integrity failure) · **High** (a real defect with a clear, if narrower, impact) · **Medium** (real but limited impact, or only reachable under specific conditions) · **Low** (cosmetic, or a gap that doesn't affect current correctness).

**No Blocker or Critical defect was found.** Two functional defects were found via focused code review this phase (one fixed, one and a coverage-related item tracked as Low). `docs/security/SECURITY_TEST_REPORT.md`'s seven findings are cross-referenced, not duplicated — all seven are already fixed as of that review.

## Functional defects found this phase

### D-01 — Client-detail engagement selection was unordered and unfiltered — Medium — **Fixed**

**Affected area:** `src/modules/clients/service.ts`, `getClientDetail` — consumed by `apps/web/.../staff/clients/[id]/page.tsx`'s upload flow (FEAT-06.3).

**Description:** `getClientDetail`'s `engagementIds` query had no `WHERE status = 'active'` filter and no `ORDER BY`. The staff client-detail page picks `engagementIds[0]` to decide which engagement an uploaded deliverable attaches to. With no defined order, `[0]` was whichever row Postgres happened to return first — which could be a `completed` or `terminated` engagement rather than the active one, and would become genuinely nondeterministic the day a client has more than one engagement (not yet possible at MVP scale — only Advisory is active — but the query was already wrong ahead of that).

**Evidence:** Read directly from `src/modules/clients/service.ts` before fix — the query was `db.selectFrom("engagements").select("id").where("client_id", "=", clientId).execute()`, no further clauses.

**Impact if untriggered:** none currently observable — every client in the system today has at most one (Advisory) engagement, so `[0]` happens to always be correct by coincidence, not by design. This is exactly the kind of latent defect a QA pass exists to catch before it becomes user-visible.

**Fix:** Added `.where("status", "=", "active").orderBy("started_at", "desc")` — deterministic, and the correct engagement (the current active one, most recent if more than one) is used every time.

**Verification status:** Fixed. No existing test exercised this specific ordering (single-engagement fixtures throughout), so a dedicated regression test was added in the same phase: `clients/routes.test.ts` — "engagementIds excludes terminated/completed engagements and orders active ones most-recent-first," seeding one completed and two active engagements (different `started_at`) and asserting both the exclusion and the exact order. Full backend suite re-run clean (91/91) after adding it.

---

### D-02 — Academy assessment score displayed with raw database formatting — Low — Not fixed

**Affected area:** `apps/web/src/app/staff/academy/[cohortId]/page.tsx`

**Description:** `assessments.score` is a SQL `numeric(5,2)` column, which `pg`/Kysely surface as a string (e.g. `"85.00"`) to avoid floating-point precision loss — a correct, deliberate backend choice. The frontend renders this string directly: `` `(${entry.assessment.score})` ``, so a Trainer sees "(85.00)" instead of "(85)". Cosmetic only — the underlying data is correct, this is a display formatting gap.

**Evidence:** `apps/web/src/app/staff/academy/[cohortId]/page.tsx`, the assessment-display branch.

**Recommended fix (not applied — Low, deferred):** parse and format at render time, e.g. `Number(score)` before interpolating, trimming trailing zeros.

---

### D-03 — Attendance `sessionNumber` has no upper bound tied to a course's actual session count — Low — Not fixed

**Affected area:** `src/modules/academy/schema.ts`, `attendanceInputSchema`

**Description:** `sessionNumber: z.number().int().positive()` accepts any positive integer. The built UI can never send an out-of-range value (it always sends `attendance.length + 1`, incrementing by exactly one), so this is unreachable through the actual product — but a direct API call (a bug in a future UI change, or a deliberate call) could record attendance for, say, session 9999 against a course with 8 real sessions, producing a meaningless but harmless record (no security bypass, no cross-record impact).

**Evidence:** `src/modules/academy/schema.ts`; cross-checked against `courses.total_sessions`, which exists in the schema specifically to know a course's real session count but isn't consulted by this validation.

**Recommended fix (not applied — Low, deferred):** look up the enrollment's course and reject a `sessionNumber` greater than its `total_sessions` in `recordAttendance`. Deferred because it requires an extra query on every attendance write for a validation gap the shipped UI cannot itself trigger.

## Coverage gaps (not defects in running code — tracked for completeness)

| ID | Gap | Severity | Notes |
|---|---|---|---|
| G-01 | No end-to-end (real-browser) test suite exists | Low | No Playwright/Cypress/etc. anywhere in the codebase. Every functional verification in this engagement has been API-level (Fastify `inject()`) or manual live smoke-testing via `curl` against running dev servers — real, but not a substitute for an actual browser exercising real user interactions (clicks, form fills, navigation). Reasoned as an accepted gap for the platform's current scale in `TEST_STRATEGY.md`, not silently missed. |
| G-02 | No automated accessibility testing (axe-core, jest-axe, or equivalent) | Low | Accessibility is built with real intent throughout (ARIA labelling, semantic HTML, `aria-live`/`aria-busy`, focus-visible styles, real table semantics under responsive collapse) and reviewed by eye during every frontend-building phase, but never machine-checked. |
| G-03 | No cross-browser compatibility testing | Low | No BrowserStack/Playwright cross-browser matrix exists. The stack (Next.js App Router, standard CSS, no exotic browser APIs) is unlikely to have major compatibility issues on evergreen browsers, but this is an assumption, not a verified result. |
| G-04 | No performance/load testing | Informational | Reasoned out of scope in `TEST_STRATEGY.md` — no production traffic exists yet to have a real target against. |
| ~~G-05~~ | ~~D-01's fix had no dedicated regression test~~ | — | **Closed within this phase** — a test was added alongside the fix (see D-01 above). Left here, struck through, so the report's own history stays visible rather than silently rewritten. |

## Cross-referenced: security findings (already resolved)

`docs/security/SECURITY_TEST_REPORT.md` found and fixed seven issues in the same codebase this QA phase reviewed (three High, four Medium) — a login timing side-channel, spoofable file-upload type checking, missing security headers on both packages (plus a self-caught regression in that fix), and two CI/testing-integrity gaps (the missing `SESSION_SECRET`/`SESSION_SALT` that silently skipped 71 of this suite's 90 tests in CI, and zero CI coverage for the frontend package at all). All seven are fixed as of that review; none are re-listed here to avoid two documents disagreeing about the same finding's status. See that report for full detail, evidence, and verification status per finding.

## Release-readiness statement

Zero Blocker, zero Critical. One Medium defect found and fixed within this phase (D-01). Two Low defects and several Low/Informational coverage gaps documented, none blocking. Combined with `docs/security/SECURITY_TEST_REPORT.md`'s clean release-readiness statement, nothing in this codebase currently requires a risk-acceptance to proceed — the coverage gaps (G-01 through G-04) are process maturity items for a future phase, not defects in what's built.
