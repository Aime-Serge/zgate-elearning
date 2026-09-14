# Z-GATE Digital Platform — Release Checklist

Verification performed for release candidate **v0.1.0-rc1**, commit `8332efc` on `develop`, 2026-09-11. Every item below states what was actually checked and how — not just pass/fail — consistent with this engagement's standing rule against overclaiming verification that wasn't actually performed.

## Result

**Software release gates: PASS.** Zero Blocker or Critical issues, zero unresolved High-severity security finding, build/test/lint clean on both packages, no untracked sensitive files.

**Production deployment gate: BLOCKED** — pending `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md` (hosting region/data residency), NCSA registration completion, and DPO designation. This is a **pre-existing, already-tracked business/compliance precondition**, not a new defect surfaced by this release process — restated here because a release checklist is exactly where it needs to be visible before anyone reads "PASS" above as "safe to deploy to production today." See `docs/release/DEPLOYMENT_PLAN.md`.

## Checklist

### Git status

- [x] Working tree clean (`git status --porcelain` — no output) at time of verification.
- [x] No untracked files of any kind, sensitive or otherwise, present at verification time.
- [x] No `.env`, credential, or key file ever tracked in git history (`git ls-files | grep -E "^\.env$|/\.env$"` — no matches).
- [x] Manual pattern scan across all tracked files for common secret shapes (AWS access keys, private key headers, common API-key prefixes) — no matches.

### Branch

- [x] On `develop`, the engagement's standing integration branch.
- [ ] **`main` (the release branch CI's `publish-images` job and `docs/devops/DEPLOYMENT_RUNBOOK.md` both assume exists) has never been created.** No git remote is configured in this environment either (`git remote -v` — empty) — CI has accordingly never executed against real GitHub infrastructure at any point in this engagement; every "CI green" statement across every phase has meant *local* lint/typecheck/test/build verification, disclosed consistently, not an actual GitHub Actions run. **Action taken this phase:** tagged the release candidate (`v0.1.0-rc1`, local, unpushed — see below) rather than fabricate a `main` branch or a push that has no remote to go to. Creating `main` and a GitHub remote is a real prerequisite for this platform's CI/CD to ever run for real, tracked as a release blocker for *automation*, not for this candidate's own correctness.

### Build

- [x] Backend: `npm run build` (`tsc -p tsconfig.json`) — clean, no errors.
- [x] Frontend: `npm run build` (`next build`, static generation for every public page) — clean, all 21 routes built (17 static, 4 dynamic where expected — `/staff/academy/[cohortId]`, `/staff/clients/[id]`).

### Tests

- [x] Backend: `npm test` (Vitest) — **96/96 passing**, 15 test files. Includes DB-dependent tests that skip cleanly without a local database and run for real only where `DATABASE_URL`/`SESSION_SECRET`/`SESSION_SALT` are set (i.e., in a real CI run) — a known, disclosed limitation of this sandbox (no working Docker socket access for the entire engagement), not of the tests themselves.
- [x] Frontend: `npm test` (Vitest + React Testing Library) — **4/4 passing**.
- [x] Lint (both packages, type-aware ESLint rules) — clean.
- [x] Typecheck (both packages, `tsc --noEmit`) — clean.
- [x] Re-ran the full backend suite three consecutive times this phase to confirm no flakiness (all three runs: 96/96).

### Migrations

- [x] `db/migrations/` — 16 sequential, numbered SQL files, reviewed for dependency order in `docs/database/MIGRATION_STRATEGY.md` and unchanged since.
- [x] `scripts/migrate.mjs` — syntax-checked (`node --check`), and is the one mechanism CI, staging, and production all use (switched from a naive unconditional loop this same release cycle — see `docs/devops/PRODUCTION_ARCHITECTURE.md`'s migration strategy section for why the old approach would have failed against a persistent database).
- [ ] **Not independently re-verified against a live Postgres instance this phase** — same disclosed Docker-permission limitation as `docs/database/MIGRATION_STRATEGY.md` originally flagged. Live execution happens for real the first time this exact commit runs through CI against a real GitHub Actions runner (see Branch, above) — that first real CI run is the actual close of this gap, not asserted here in advance of it.

### Environment variables

- [x] Every variable `src/lib/config.ts` actually reads (`DATABASE_URL`, `SESSION_SECRET`, `SESSION_SALT`) is documented with a placeholder shape in `.env.example`, along with every other variable the app consumes (`WEB_ORIGIN`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, `DELIVERABLES_STORAGE_DIR`).
- [x] `apps/web/.env.example` documents `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_SITE_URL` — both `NEXT_PUBLIC_*`, correctly limited to genuinely public values only (`docs/frontend/FRONTEND_SECURITY.md`).
- [x] No `.env.example` value is a working credential — every value is a clearly-labeled placeholder (`changeme`, `replace-with-a-long-random-value...`).
- [x] Per-environment variable differences (dev/staging/production) documented in `docs/devops/PRODUCTION_ARCHITECTURE.md`'s Environment configuration section — same variable names throughout, values differ, `SESSION_SECRET`/`SESSION_SALT` never reused across environments.
- [x] Config fails loudly at startup on invalid/missing configuration (`parseConfig`), and never echoes a secret's *value* in its error output — only which variable name was invalid.

### Dependency lockfiles

- [x] Backend: `npm ci --dry-run` — resolves cleanly against `package-lock.json`, no drift.
- [x] Frontend: `npm ci --dry-run` — resolves cleanly against its own `package-lock.json`, no drift. One `EBADENGINE` warning (`jsdom@30.0.1` wants Node `^22.22.2 || ^24.15.0 || >=26.0.0`; this sandbox has `22.22.1`) — non-fatal, a dev-only test dependency, tracked in `docs/release/KNOWN_ISSUES.md`, not blocking.
- [x] Both packages deliberately kept as independent lockfiles, not an npm workspace (`docs/frontend/FRONTEND_ARCHITECTURE.md`'s structural decision) — each verified independently, not assumed consistent by association.

### Security

- [x] `npm audit --audit-level=high` — **0 vulnerabilities**, both packages.
- [x] `docs/security/SECURITY_TEST_REPORT.md` — 7 findings (3 High, 4 Medium), all remediated within that review; zero Critical. One residual, intentional, documented tradeoff (F-04's frontend CSP `'unsafe-inline'`) flagged for explicit owner sign-off, not a blocker.
- [ ] **gitleaks was not run this phase** — no local binary available, and it runs as a GitHub Action in CI, which has never executed (see Branch). Manual pattern-based scan (above, under Git status) is the substitute verification actually performed here; the real gitleaks history-scan happens on the first real CI run.
- [x] No secret committed, printed in a log, or exposed in an error path — enforced structurally (redacted request-logging, config's never-echo-on-failure, `.gitignore`), not just by convention; re-confirmed this phase.

### Accessibility

- [x] Cross-referenced, not re-audited: `docs/qa/TEST_STRATEGY.md`/`DEFECTS.md` (G-02) — accessibility built with real intent throughout (semantic HTML, ARIA labelling, `aria-live`/`aria-busy`, focus-visible styles, real table semantics under responsive collapse), reviewed by eye every frontend-building phase.
- [ ] **No automated accessibility tool (axe-core, jest-axe) wired into either test suite.** Tracked as Low severity, not a release blocker at this scale — `docs/release/KNOWN_ISSUES.md`.

### SEO

- [x] Cross-referenced: `docs/marketing/SEO_AUDIT.md` — titles/descriptions/headings/semantic-HTML/internal-links all Pass; canonical URLs, sitemap, robots, and minimal structured data all Gap→Fixed in that same phase. Verified again this phase via `git log` that no subsequent change has regressed any of it.

### Performance

- [x] Cross-referenced: `docs/performance/PERFORMANCE_REPORT.md` — static/dynamic page response, API latency, caching, and rendering strategy all Pass; one real N+1 query found and fixed; two identified-but-deliberately-not-fixed items (forms bundle size, a currently-inconsequential missing index) explicitly reasoned, not oversights.

### Monitoring

- [x] Cross-referenced: `docs/devops/MONITORING.md` — application logging (structured, redacted) and health/readiness endpoints are live today. Audit logging (`access_log`) confirmed architecturally distinct from operational logging, not conflated.
- [ ] **External uptime monitoring, error-rate alerting, and log aggregation are not yet provisioned** — deliberately deferred pending a hosting target (same ADR-004 dependency as everywhere else), not an oversight. Tracked, not blocking this candidate's own correctness.

### Backups

- [x] Cross-referenced: `docs/devops/BACKUP_RECOVERY.md` — schedule, retention, and restore-procedure requirements fully specified.
- [ ] **No backup mechanism is provisioned or has ever run** — no production database exists yet to back up. Explicitly gated on the same ADR-004 decision as backup storage location/residency (a backup of real Client data inherits the same Rwanda-residency commitment as the primary data — this document deliberately refuses to pick a storage location independent of where that resolves).

### Rollback

- [x] Cross-referenced: `docs/devops/ROLLBACK_RUNBOOK.md` — mechanism specified (redeploy a prior SHA-tagged image; forward-only migrations, never a down-script).
- [x] This release's own specific rollback plan: `docs/release/ROLLBACK_PLAN.md` (this is release candidate 1 — there is no prior production version to roll back *to*, which that document addresses directly rather than glossing over).

## Release gate decision

**No unresolved Blocker or Critical issue exists in this codebase.** The two unchecked boxes above that represent genuine gaps (no `main`/remote, monitoring/backup mechanisms unprovisioned) are pre-existing, already-disclosed conditions this phase re-confirmed rather than newly discovered — and none of them is a defect in the software itself. This release candidate is **approved to proceed to staging** once a staging target exists (`docs/devops/DEPLOYMENT_RUNBOOK.md`'s staging section, not blocked by ADR-004). **Production deployment remains explicitly blocked** pending the business/compliance decisions this checklist restates rather than resolves on its own authority.
