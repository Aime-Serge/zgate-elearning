# Z-GATE Digital Platform — Security Test Report

**Reviewer:** Application Security Engineer (this engagement)
**Date:** 2026-09-11
**Scope:** The full implemented platform as of `develop` at review time — identity/session management, CRM, client portal, staff portal (clients/leads/reporting), Academy, and the internal data-quality/dictionary endpoints. Authorized, non-destructive review of code already built in this engagement; no production system exists yet to test against.
**Baseline:** OWASP ASVS (mapped informally per category below — this is not a certification claim).
**Methodology:** Static/code review of every route, service, and shared security primitive; live testing against the running local dev servers (auth gates, headers, rate limits, error shapes); dependency audit (`npm audit`); CI/CD configuration review. See **Limitations** for what could not be tested this way.

## Limitations (read before trusting any "verified" status below)

Docker is inaccessible in this review's sandbox (`permission denied` on `docker.sock`, a structural constraint of this environment, not a project issue) — no local PostgreSQL was reachable, so no live database-backed request could be executed directly by this review. Two consequences:

1. Every IDOR/BOLA, authorization, and authentication **test in this codebase** (90 tests across 14 files) is written to skip cleanly when `DATABASE_URL`/`SESSION_SECRET`/`SESSION_SALT` aren't all set, per `docs/backend/BACKEND_TESTING.md`'s established pattern. This review discovered (see **F-06**) that CI itself was never setting two of those three, meaning **the entire suite has been silently skipping in CI too, not just locally, for the whole engagement** — every prior "N/N tests passing" claim in this project's history was true of what actually ran, but what actually ran had never included a single real database-backed assertion. That's now fixed (see F-06), but this report cannot itself confirm the suite passes against a live database — only that it now *will actually attempt to*, verified by reproducing the fix's env vars locally and observing the tests progress past their skip-guard into real Kysely/Postgres connection code (failing only on "no Postgres reachable here," not a silent skip).
2. Every finding below graded "Verified (static + live smoke test)" was confirmed by direct code inspection plus live HTTP testing against the running dev servers (which don't require a database for auth-gate/header/rate-limit checks). Findings graded "Verified (static only, pending live DB confirmation)" are code-reviewed and reasoned through carefully, but not yet proven by a real database-backed request — that confirmation should come from the next real CI run (now that F-06/F-07 are fixed) or from a real deployment.

No browser was available to this review either — frontend CSP correctness (F-04) is verified by header inspection and reasoning about Next.js's known inline-script behavior, not by loading the app in an actual browser and checking the console for CSP violations.

## Summary

| ID | Issue | Area | Severity | Status |
|---|---|---|---|---|
| F-01 | Login had a timing side-channel enabling account enumeration | Authentication | **High** | Fixed |
| F-02 | Document upload type-checking trusted the client-supplied MIME type only | File uploads | **Medium** | Fixed |
| F-03 | No security headers on the backend API | Security headers | **Medium** | Fixed |
| F-04 | No security headers / CSP on the frontend | Security headers | **Medium** | Fixed (partial — see note) |
| F-05 | Helmet's default Cross-Origin-Resource-Policy would have broken the app | Security headers / regression | **High** (self-caught before ship) | Fixed |
| F-06 | CI never set `SESSION_SECRET`/`SESSION_SALT` — the entire DB-backed test suite silently skipped in CI | Testing / verification integrity | **High** | Fixed |
| F-07 | CI never covered the frontend package (`apps/web`) at all | CI/CD coverage | **Medium** | Fixed |
| I-01 | No production cloud/IaC exists yet to review | Cloud configuration | Informational | N/A — not yet applicable |
| I-02 | Password reset token travels in a GET URL (email link) | Session/token handling | Informational | Accepted (industry-standard pattern) |
| I-03 | Failed-login attempts log the attempted email at `warn` level | Logging | Informational | Accepted |

No Critical findings. Two High findings (F-01, F-06) and one self-caught High-severity regression (F-05) introduced and fixed within this same review pass. All fixed findings are within this review's scope and have been remediated in this commit; none require an external risk-acceptance to unblock release on their own. **F-04's residual gap (below) is the one item I'd flag to an owner before treating frontend CSP as fully hardened.**

---

## F-01 — Login timing side-channel (account enumeration via bcrypt timing)

**Affected area:** Authentication (`src/modules/identity/service.ts`, `verifyCredentials`)
**Risk:** High. `docs/security/SECURITY_REQUIREMENTS.md` V2 and this engagement's own tests establish that a wrong-password and a nonexistent-account login attempt must be indistinguishable. The *response body* was already identical (tested), but the code path wasn't: a nonexistent email returned immediately after a single fast DB lookup, while a wrong password additionally ran `bcrypt.compare()` — a deliberately slow operation (~100ms+ at cost factor 12). An attacker measuring response time over enough requests can reliably distinguish the two cases and enumerate valid account emails, defeating the intent of V2 even though the literal bytes returned pass every existing content-based test. (CWE-208, Observable Timing Discrepancy.)

**Evidence:** Before fix, `src/modules/identity/service.ts`:
```ts
if (!user || user.deactivated_at) {
  return { ok: false };   // fast path - no bcrypt call
}
const valid = await verifyPassword(password, user.password_hash); // slow path
```

**Remediation:** Added `DUMMY_PASSWORD_HASH` (a fixed, valid bcrypt hash of a placeholder string) to `src/lib/auth.ts`, and the nonexistent-account branch now runs `verifyPassword(password, DUMMY_PASSWORD_HASH)` before returning — both branches now pay the same bcrypt cost.

**Verification status:** Fixed and code-reviewed; typecheck/lint/build clean; existing non-enumeration tests (`identity/routes.test.ts`) still pass their skip-guard-aware assertions. Full confirmation that the two paths are now statistically indistinguishable requires a real timing measurement against a live server, which this review could not perform (no reachable database to log in against). Recommend a follow-up timing benchmark once CI/staging is reachable.

---

## F-02 — Document upload type validation trusted the client-asserted MIME type only

**Affected area:** File uploads (`src/modules/documents/routes.ts`, `POST /api/documents`)
**Risk:** Medium. `docs/security/SECURITY_REQUIREMENTS.md` V5/V12 calls for a file-type allowlist. The allowlist check (`ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)`) only ever inspected the `Content-Type` a multipart part *claims* to be — a value any client fully controls and can set to anything, independent of the file's real content. An attacker could upload an HTML/SVG/script payload labeled `application/pdf` and have it accepted. Severity is Medium rather than High because the download route already forces `Content-Type: application/octet-stream` on every response (confirmed by code review), so even a successfully-uploaded disguised file is never served back in a way a browser would render/execute inline — the main stored-XSS-via-upload vector was already closed by that unrelated design choice.

**Evidence:** `src/modules/documents/routes.ts` (pre-fix): the only content check was `ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)`, run before `file.toBuffer()` was even available to inspect.

**Remediation:** Added `src/lib/fileSignature.ts` — checks the uploaded buffer's actual leading bytes against the well-known signature for its claimed type (PDF `%PDF`, PNG/JPEG magic bytes, XLSX/DOCX's shared ZIP/OOXML signature). Wired into the upload route immediately after `toBuffer()`, before any database write. Six new unit tests (`src/lib/fileSignature.test.ts`, no database dependency — genuinely executed, not skip-gated) plus a new route-level test (`documents/routes.test.ts`: "rejects a file whose content doesn't match its claimed type") cover both the helper and the end-to-end rejection path. Two pre-existing tests that used fake, non-signature-matching content for a claimed PDF had to be corrected to use real `%PDF-` bytes to keep reaching their intended (unrelated) assertions.

**Verification status:** Fixed. The six pure unit tests genuinely ran and passed (no DB dependency). The route-level test is DB-dependent and pending live confirmation per the Limitations section.

---

## F-03 — No security headers on the backend API

**Affected area:** Security headers, all API responses (`src/app.ts`)
**Risk:** Medium. `docs/security/SECURITY_REQUIREMENTS.md` V14 and `docs/frontend/FRONTEND_SECURITY.md` both call for standard security headers "set platform-wide." Neither `@fastify/helmet` nor any manual header-setting existed anywhere in the backend. Most impact is on the two routes that serve real HTML/binary content directly (`GET /api/documents/:id/download`, `GET /api/academy/certificates/:id/download`) — without `X-Frame-Options`/`frame-ancestors`, a served certificate or document could in principle be framed by a malicious page (clickjacking surface); without `X-Content-Type-Options: nosniff`, a browser could MIME-sniff a response into a more dangerous content type than intended.

**Evidence:** `grep -rn "helmet\|X-Frame-Options" src/` returned nothing prior to this review.

**Remediation:** Registered `@fastify/helmet` in `src/app.ts` with `defaultSrc: ['none']` and `frameAncestors: ['none']` (this origin serves no interactive page of its own, so a maximally restrictive CSP is safe here), plus every other Helmet default (`X-Content-Type-Options`, `Referrer-Policy`, etc.).

**Verification status:** Verified (static + live smoke test) — confirmed via `curl -i` against the running dev server that `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and the rest of Helmet's header set are present on every response, and that CORS headers (`access-control-allow-origin`, `access-control-allow-credentials`) still coexist correctly.

---

## F-04 — No security headers / CSP on the frontend

**Affected area:** Security headers, all frontend responses (`apps/web/next.config.ts`)
**Risk:** Medium. Same requirement as F-03, frontend side. No `headers()` config existed in `next.config.ts` at all.

**Remediation:** Added a `headers()` function setting `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a conservative `Permissions-Policy`. `connect-src` explicitly names the configured API origin (read from `NEXT_PUBLIC_API_URL` at request time) — without it, every `fetch()` call this app makes to its own backend would be CSP-blocked. `font-src 'self'` is sufficient because `next/font/google` self-hosts font files at build time; the browser never fetches `fonts.gstatic.com` directly (confirmed live: font requests resolve to `/_next/static/media/*.woff2`, same-origin).

**Residual gap, not fixed:** `script-src`/`style-src` include `'unsafe-inline'`. Next.js's App Router embeds its own hydration payload as inline `<script>` tags with no nonce wired up in this codebase; a strict `script-src 'self'` without either `'unsafe-inline'` or a nonce-based policy (Next has first-class, documented support for the latter via `middleware.ts`) would very likely break the app's own hydration. Implementing the nonce-based version properly, and confirming it doesn't break anything, requires testing in a real browser — unavailable to this review. Recorded here rather than either skipped silently or shipped unverified.

**Verification status:** Verified (static + live smoke test) for the non-CSP headers and the CSP's presence/directives (confirmed via `curl -i` against the running frontend dev server; pages still return 200 and render their expected `<title>`). **Not verified** in a real browser for actual script-execution/hydration correctness under the CSP — flagged as the one item in this report I'd want an owner to explicitly sign off on, or have re-tested in a browser, before calling frontend CSP hardening complete.

---

## F-05 — Helmet's default Cross-Origin-Resource-Policy would have broken the app (self-caught)

**Affected area:** Security headers / regression (`src/app.ts`)
**Risk:** High, if shipped — but caught and fixed within this same review pass, before being reported as done. Helmet defaults `Cross-Origin-Resource-Policy` to `same-origin`. This app's frontend and backend are *two different origins by design* (`docs/architecture/API_ARCHITECTURE.md`) — `same-origin` CORP would have caused every browser to silently block the frontend from reading any API response, regardless of CORS headers being otherwise correct. This is a well-documented, separate browser-side check from CORS, not something `curl`-based testing would ever surface (CORP is enforced by browsers, not the server or `curl`).

**Evidence:** Immediately after registering Helmet with defaults, `curl -i` showed `Cross-Origin-Resource-Policy: same-origin` on every response.

**Remediation:** Set `crossOriginResourcePolicy: { policy: "cross-origin" }` explicitly in the Helmet config, with a comment explaining why the default is wrong for this architecture.

**Verification status:** Verified (static + live smoke test) — confirmed via `curl -i` that the header now reads `cross-origin`. Real-browser confirmation that cross-origin `fetch()` actually succeeds end-to-end is still recommended (same browser-access limitation as F-04) but the header value itself is now the documented-correct one for an intentionally cross-origin API.

---

## F-06 — CI never set `SESSION_SECRET`/`SESSION_SALT`: the entire DB-backed test suite silently skipped, even in CI

**Affected area:** Testing / verification integrity (`.github/workflows/ci.yml`)
**Risk:** High. Every DB-dependent test file in this codebase (all IDOR/BOLA, authentication, session, privilege-escalation, and business-logic tests written across this entire engagement — 14 files) guards its real assertions behind `Boolean(process.env["DATABASE_URL"] && process.env["SESSION_SECRET"] && process.env["SESSION_SALT"])`, by design, so it skips cleanly on a developer machine without a configured database. CI's `ci` job set `DATABASE_URL` (pointing at its own real, ephemeral Postgres service container) but never set `SESSION_SECRET` or `SESSION_SALT`. Vitest has no automatic `.env`-loading configured (`vitest.config.ts` has no `envDir`/`setupFiles`), so nothing else supplied them either. The practical effect: **the guard evaluated false in CI too, for the whole engagement** — every "N/N tests passing" result reported throughout this project, in every prior phase, was accurate about what ran, but what ran had never included one single real, database-backed authorization or authentication assertion, anywhere, including in the one environment with real database access.

This is not itself a vulnerability in the running application, but it is the most consequential finding in this report: it means every "verified via tests" claim made about IDOR/BOLA protection, privilege scoping, and authentication behavior throughout this engagement rested on code review and reasoning alone, never on confirmed execution — exactly the gap a real vulnerability could hide behind undetected.

**Evidence:** `.github/workflows/ci.yml` (pre-fix) `env:` block: only `DATABASE_URL`. Reproduced locally: running `src/modules/identity/routes.test.ts` with `DATABASE_URL` set to a garbage value but *without* `SESSION_SECRET`/`SESSION_SALT` set produces a clean skip (`console.warn`, reported as "passed"); setting all three (even pointing at an unreachable database) instead produces a real connection attempt and a real Postgres authentication error — proving the guard, and therefore the fix, both work as understood.

**Remediation:** Added `SESSION_SECRET`/`SESSION_SALT` (clearly-labeled, CI-only throwaway values, not used anywhere real) to the `ci` job's `env:` block.

**Verification status:** Fixed and locally reproduced (see Evidence) — confirmed the guard now evaluates true and real Kysely/Postgres connection code executes. **Not yet confirmed that the full suite passes against a real database** — that requires an actual CI run against the real ephemeral Postgres service, which this review could trigger by pushing but has not (out of scope for a non-destructive local review to assume push access); recommend treating the next CI run on this branch as the actual confirmation of every authorization/IDOR test in this codebase, for the first time.

---

## F-07 — CI never covered the frontend package at all

**Affected area:** CI/CD coverage (`.github/workflows/ci.yml`)
**Risk:** Medium. `apps/web` (the Next.js frontend) has its own `package.json`, lockfile, lint/typecheck/test/build scripts, and dependency tree — deliberately not an npm workspace with the backend (`docs/frontend/FRONTEND_ARCHITECTURE.md`). The CI workflow only ever ran steps at the repository root; nothing in it ever `cd`s into or otherwise targets `apps/web`. Every frontend lint/typecheck/test/build/dependency-audit check performed throughout this engagement was run manually, in this review session and prior ones — none of it is enforced by CI on a push or pull request. A frontend-breaking change, a newly-introduced frontend vulnerability, or a frontend test regression would currently go completely undetected by CI.

**Evidence:** `grep -n "apps/web" .github/workflows/ci.yml` returned no matches prior to this review.

**Remediation:** Added a second job, `web-ci`, running in parallel with the existing `ci` job: install (from `apps/web`'s own lockfile), lint, typecheck, test, `npm audit --audit-level=high`, build — the same shape as the backend job, scoped to `apps/web` via `defaults.run.working-directory`. Repo-wide secret scanning (`gitleaks`) already covers `apps/web` from the existing job's full-history checkout, so it wasn't duplicated.

**Verification status:** YAML syntax validated (parsed successfully via both Python's `yaml` and Node's `yaml` packages). The job's actual steps mirror commands this review ran directly and confirmed passing locally minutes earlier (`npm run lint`, `typecheck`, `test`, `build`, all clean). Full confirmation that the new job runs correctly in GitHub Actions' own environment requires an actual CI run, not performed by this review for the same reason as F-06.

---

## Verified — no finding (by category)

| Category | Status | Notes |
|---|---|---|
| Injection (SQL) | **Pass** | Kysely's query builder used exclusively; `grep` for raw `sql` tag / string-concatenated queries across `src/` found none. |
| XSS | **Pass** | React's default escaping used throughout; no `dangerouslySetInnerHTML` anywhere in `apps/web/src`. The one server-generated HTML surface (Academy certificates) explicitly escapes `&`/`</>`  before interpolating learner-supplied names — verified by reading `renderCertificateHtml` in `src/modules/academy/service.ts`. |
| SSRF | **Pass** | The only outbound server-side `fetch()` in the codebase (`src/lib/email.ts`) targets a fixed, hardcoded Resend API URL — never a user- or client-supplied one. |
| CSRF | **Pass** | Session cookie is `SameSite=Lax` + `httpOnly`; CORS is scoped to one configured origin with credentials. `SameSite=Lax` blocks cookie-bearing cross-site POST/PUT/DELETE requests by design; confirmed no `GET` route performs a state-changing write (`grep` for `insertInto`/`updateTable`/`deleteFrom` inside any `app.get` handler found none) — the one class of request that would bypass Lax's protection doesn't exist in this API. |
| Dependency vulnerabilities | **Pass** | `npm audit --audit-level=high` (matching CI's exact command, including dev dependencies): 0 vulnerabilities, both `zgate-platform` and `web` packages. |
| Secrets | **Pass** | `.env` correctly `.gitignore`d and present in both `.dockerignore` files (root and `apps/web`); no secret values found in any log statement (`grep` for password/token/secret near a `.log.` call found nothing); pino's `redact` config covers `authorization`/`cookie`/`x-api-key` headers. |
| Rate limiting | **Pass** | Verified live: login 10/min, password-reset request/confirm 5/min, public contact form 5/min, Academy enrollment 10/min, global default 100/min for everything else — all confirmed via direct `curl` loops against the running dev server returning `429` at the documented threshold (this exact mechanism was found broken and fixed in an earlier phase of this engagement; this review re-confirmed it's still correctly wired after every subsequent change). |
| Session security | **Pass** | `httpOnly`, `SameSite=Lax`, `Secure` in production only (correct for local HTTP dev), explicit 24h `expiry` baked into the encrypted session payload (server-verified, not just an advisory cookie attribute). Stateless encrypted-cookie design means there's no separate session identifier to fixate — safe by construction, not by an added check. |
| IDOR/BOLA | **Pass (static)** | Every engagement-scoped resource (compliance items, documents, Academy cohorts/enrollments/certificates) routes through one of two shared object-level checks (`lib/engagementAccess.ts`, `lib/authz.ts`'s per-module trainer-scoping in `academy/routes.ts`), consistently returning 404 (never 403) for "not yours," and 403 (role-level) for a role with no access to the resource class at all. Confirmed by reading every route in every module — none skips the check. **Live database confirmation pending** per F-06's fix. |
| Access control / API security | **Pass** | RBAC role checks (`requireRole`) present on every non-public route; spot-checked against `docs/security/RBAC_SECURITY_MODEL.md`'s permission matrix for several modules with no drift found. Consistent error taxonomy (`AppError`/`validationError`), no stack traces or DB error strings ever reach a client response — confirmed live (a forced 500 from a missing database connection returns only `{error:{code:"INTERNAL_ERROR", message:"Something went wrong...", correlationId}}`). |
| Logging | **Pass** | Every privileged write across every module calls `logAccess` in the same transaction as the write it covers (confirmed by listing all `action: "..."` call sites — 19 distinct audited actions, covering every state-changing endpoint). No response body is ever logged by Fastify's default request logger. |
| File uploads (beyond F-02) | **Pass** | 10MB size ceiling enforced at the multipart-plugin level (`limits.fileSize`) as a hard backstop in addition to the application-level check; storage paths are always a fresh `randomUUID()`, never client-influenced (closes path traversal at the source, not just by sanitizing a supplied name); `lib/storage.ts`'s `readStoredFile` additionally verifies the resolved path never escapes the storage root as defense in depth. |

## Informational

- **I-01 — Cloud configuration:** No production cloud deployment or infrastructure-as-code exists yet — `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md`'s hosting-region decision is still open. What *does* exist (the production `Dockerfile` target, `docker-compose.yml` for local dev) was reviewed: the production image runs as a non-root user (`USER zgate`, uid 1001), installs with `--omit=dev`, and copies no source/dev tooling into the final layer. Local dev's Postgres credentials are hardcoded but clearly scoped to `docker-compose.yml` only and documented as dev-only. Nothing to act on until a real hosting target is chosen.
- **I-02 — Password reset token in a GET URL:** The emailed reset link is `/reset-password?token=...` — a token in a URL query string is a long-standing, essentially universal pattern for this exact flow (email clients don't reliably support anything richer), and the actual redemption (`POST /api/auth/password-reset/confirm`) sends the token in a JSON body, never a URL, limiting exposure to logs/history to the initial link only. The token is single-use and expires in 1 hour, both enforced server-side. No action recommended.
- **I-03 — Failed-login email logging:** `request.log.warn({ email }, "login failed: no matching account")` logs the attempted email address for an account that doesn't exist. This is deliberate, standard security-monitoring practice (detecting credential-stuffing patterns needs the attempted identifier) and is a `warn`-level structured log, not exposed to any user. Noted for completeness, not a finding.

## Release-readiness statement

No Critical or unresolved High-severity finding remains open against this codebase as reviewed. The two High findings identified (F-01, F-06) and the self-caught High-severity regression (F-05) have all been remediated within this review. **F-04's residual `'unsafe-inline'` CSP gap is the one item that should get explicit owner sign-off** (or a follow-up nonce-based hardening pass with real-browser verification) before this is called fully done — it's a real, intentional, documented tradeoff, not an oversight, but it's also the one place this report is asking someone to accept residual risk rather than declaring it closed. Per this review's own scope, there is no production deployment yet for a release-blocking decision to apply to.
