# 01 — Current-State Assessment

**Scope:** the full repository at commit `3f5e965` (`main`), meaning the code in `backend/` and `frontend/`, the 16 SQL migrations, CI/CD, Docker, and the ~130 documents in `docs/`.
**Method:** I read the code directly and checked every claim in the handover documents against it. If a finding is already recorded in `docs/`, it is cited here, not re-argued. Findings that **no earlier audit recorded** are marked **NEW** and given an `N-` identifier.
**Question being answered:** does this codebase work as a foundation for **two separate products**, a marketing website and an e-learning platform? It was built as **one all-in-one business web app**, so that is a different question from "is the MVP well built?"

---

## 1. Verdict in one paragraph

This is a **well-engineered MVP for a business model that has now changed**. The engineering discipline is unusually high for a one-developer project. Examples: strict TypeScript; object-level authorization that returns 404 instead of 403; a timing-safe login; upload checks that verify real file signatures; 97 backend test cases that run against real PostgreSQL in CI; and honest documentation of every gap. However, the product it implements is a **staff-operated back office** (CRM, Advisory compliance tracking, an in-person cohort register). It is not an **e-learning product**. Of the 16 capabilities an LMS MVP needs (§5), **3 exist, 3 are partial and 10 are missing**. The data model blocks the most basic one: individual learners cannot have accounts (N-4). The right move is to **keep the backend's foundations and security patterns, rebuild the Academy domain as a real LMS, and split the single frontend into separate products**. Neither "start over" nor "extend in place" is the right answer.

## 2. What is genuinely strong (keep it)

| Strength | Evidence |
|---|---|
| Modular-monolith boundaries, one module per domain (routes, then service, then schema) | `backend/src/modules/*`, `docs/architecture/MODULE_ARCHITECTURE.md` |
| Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | `backend/tsconfig.json` |
| Two-layer authorization: role-level (`requireRole`) plus object-level checks that return 404 | `backend/src/lib/authz.ts`, `backend/src/lib/engagementAccess.ts`, `academy/routes.ts:39` |
| Timing-safe login (compares against a dummy bcrypt hash) | `backend/src/lib/auth.ts:31`, `identity/service.ts:36-43` |
| Upload safety: MIME allowlist, byte-signature check, UUID storage keys, path-escape guard | `backend/src/lib/fileSignature.ts`, `backend/src/lib/storage.ts:51-58` |
| Single error taxonomy; clients never see stack traces; correlation IDs | `backend/src/app.ts:141-182`, `backend/src/lib/errors.ts` |
| Liveness and readiness probes kept separate; DB connection timeout | `backend/src/health.ts`, `backend/src/lib/db.ts` (`connectionTimeoutMillis`) |
| Audit writes in the same transaction as the business write | `backend/src/lib/audit.ts` |
| Forward-only SQL migrations, applied by a transactional runner | `backend/scripts/migrate.mjs` |
| Non-root, multi-stage Docker images with healthchecks; GHCR images tagged by commit SHA | `backend/Dockerfile`, `frontend/Dockerfile`, `.github/workflows/ci.yml` |
| CI runs lint, typecheck, real-DB tests, `npm audit`, gitleaks and build for both packages | `.github/workflows/ci.yml` |
| Static generation for marketing pages, self-hosted fonts, accessible forms | `frontend/src/app/page.tsx`, `docs/performance/PERFORMANCE_REPORT.md` |
| Honest, sourced documentation culture (no invented metrics or social proof) | `docs/HANDOVER.md`, `docs/release/COMMERCIAL_READINESS.md` |

The last row is the most valuable asset in the repository and should carry over into v2 unchanged.

## 3. Scorecard against the requested criteria

Each criterion is scored from 1 (poor) to 5 (excellent) on two axes:
- **A, MVP fitness:** how well it serves what it was built for.
- **B, v2 foundation fitness:** how well it supports a separate website plus an e-learning platform.

| Criterion | A | B | Summary |
|---|:-:|:-:|---|
| Security | 4 | 3 | Strong primitives. Two High audit findings are still open. Sessions cannot be revoked. No MFA. Rate limiting fails behind a proxy (N-1). |
| Productivity (developer) | 3 | 2 | Good tooling. DB types are kept in sync by hand. Validation schemas are copied by hand between frontend and backend. There is no seed data, so nobody can log in locally without SQL. |
| Optimization (cost/resources) | 4 | 3 | Lean dependencies, cheap topology. Nothing is cached, and there is no CDN or media strategy (video will dominate LMS cost). |
| Performance | 4 | 2 | SSG pages and fixed N+1 queries. Never measured in a browser or under load. No video delivery or adaptive bitrate. |
| Reliability | 2 | 2 | Never deployed. No monitoring, backups, staging, job queue or retries. Files live on local disk. |
| Accessibility | 3 | 3 | Targets WCAG 2.1 AA, with semantic forms and a skip link. No automated a11y tests. English only. No media-accessibility model (captions or transcripts). |
| Scalability | 3 | 1 | Local-disk storage, in-memory rate limits and no queue all prevent horizontal scaling. Roles are a Postgres enum. Learners cannot be users (N-4). |
| Portability | 3 | 2 | Standard Postgres and Docker. The frontend image is environment-bound and cannot be promoted from staging to production (N-2). |
| Clean structure | 4 | 3 | Clear backend modules. Auth checks are called by hand inside each handler. One frontend app mixes marketing, client portal and staff console under one root layout. |
| Usability | 3 | 2 | Strong copy and forms. Clients cannot get an account (commercial blocker). There is no learner experience at all. |
| Future integration | 2 | 1 | No OpenAPI, no API versioning, no events/outbox/webhooks, no OIDC, no i18n, no payments, no notification abstraction. |
| Observability | 1 | 1 | Only pino logs. No metrics, tracing, error tracking or uptime checks. |
| Compliance (Law N° 058/2021) | 2 | 2 | Excellent policy mapping and data classification. NCSA, DPO and hosting region are still open. No consent records, privacy notice or DSAR tooling. |
| Testability | 3 | 3 | 97 backend cases, including IDOR tests on real Postgres. The frontend has 2 test files. No E2E, a11y or load tests. |

**Reading the gap between A and B:** most scores fall from A to B because the system was deliberately scoped small. That decision was correct, and the drop is not an engineering failure. It does mean the v2 plan cannot assume the current system "just needs more features".

## 4. Findings

### 4.1 Still open from earlier audits (cited, not re-argued)

| ID | Finding | Severity | Source |
|---|---|---|---|
| F-1 | CRM leads endpoints have no audit logging | High | `docs/SECURITY_GUIDE.md` |
| F-2 | Account deactivation has no reactivation path and no guard against removing yourself or the last admin | High | `docs/SECURITY_GUIDE.md` |
| F-3 | Backend CSP behaves differently from what its code comment says (Helmet merges directives) | Medium | `docs/SECURITY_GUIDE.md` |
| F-4 | `staff_advisory` has the same permissions as `admin` for all client data | Medium | `docs/SECURITY_GUIDE.md` |
| F-5 / KI-01 | Frontend CSP allows `'unsafe-inline'` | High (residual) | `docs/security/SECURITY_TEST_REPORT.md` |
| KI-08 | No per-account session revocation | Medium | `docs/release/KNOWN_ISSUES.md` |
| CR-8 | No path anywhere to provision client accounts | Blocker (commercial) | `docs/release/COMMERCIAL_READINESS.md` |
| ADR-004 | Hosting region / data residency undecided | Blocker (compliance) | `docs/architecture/ADR/ADR-004-…` |

### 4.2 NEW findings from this assessment

**N-1: Rate limiting and client-IP logging break behind any reverse proxy. Severity: High (availability/security). NEW.**
The Fastify instance is created without `trustProxy` (`backend/src/app.ts:26`). The production design puts TLS termination in front of the app (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`), so `request.ip` will be the proxy's address for every user. `@fastify/rate-limit` keys on that IP (`app.ts:125`), which causes two problems:
- **The entire platform shares one bucket.** Login is limited to 10 requests per minute and the contact form to 5 per minute, *for all users combined*. One script, or one busy cohort logging in at the start of a class, locks everyone out.
- **Logs record the proxy, not the client,** so abuse investigation is impossible.

*Fix:* set `trustProxy` to the exact proxy hop or CIDR (never `true` unconditionally), and add a test that sends `X-Forwarded-For`. This must be fixed before any deployment.

**N-2: The published production web image cannot be used in any real environment. Severity: High (deployment). NEW.**
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` fall back to `localhost` (`frontend/src/lib/api.ts:14`, `frontend/src/app/layout.tsx:30`, `frontend/src/app/sitemap.ts:4`).
- Next.js inlines `NEXT_PUBLIC_*` values into the client bundle at `next build`, and statically generated routes (the sitemap and metadata) are rendered at build time.
- The CI `publish-images` job builds `frontend/Dockerfile` with no build args.

As a result, the image on GHCR calls `http://localhost:3000` from users' browsers, and its canonical URLs, sitemap and JSON-LD point at `localhost:3001`. The CSP `connect-src` is also computed in `next.config.ts` `headers()`. Its comment says "read at request time", but Next resolves config headers when it builds the routes manifest. **Confirmed by a real build (2026-10-14) with no environment variables set, which matches CI:**
- 13 client JS chunks contain `localhost:3000`
- `routes-manifest.json` holds `connect-src 'self' http://localhost:3000`
- the sitemap, canonical link and JSON-LD all point at `http://localhost:3001`

*Interim fix applied:* `apps/ops/Dockerfile` now refuses to build without the public URLs, and CI's publish path requires them as repository variables.
*Fix (v2):* use a same-origin BFF (`/api/*` is proxied by each frontend), so the browser never needs an API URL. Read the site URL from runtime config. Build one image and promote it unchanged from staging to production.

**N-3: Password reset and deactivation leave existing sessions valid for up to 24 hours. Severity: Medium. NEW (extends KI-08).**
Role, `clientId` and `division` are frozen inside the encrypted cookie (`backend/src/lib/session.ts:33-38`). No request ever re-checks `deactivated_at`. `confirmPasswordReset` (`identity/service.ts:142`) does not touch sessions. The usual reason for a password reset is a suspected compromise, and in that case **the attacker's session survives the reset**. Role downgrades also take up to 24 hours to apply.
*Fix (v2):* server-side sessions (a table keyed by a random session ID). Re-load the user and their roles on each request, with a short cache. Revoke all sessions on password change, deactivation or role change.

**N-4: Individual learners structurally cannot have accounts. Severity: High for v2 (blocks e-learning). NEW.**
- `CHECK (role != 'client' OR client_id IS NOT NULL)` (`backend/db/migrations/001_users.sql:36`) means every non-staff user must belong to a client *company*.
- There is no learner role.
- `learners.user_id` exists, and the certificate route checks `user.role === "client"` for self-download (`academy/routes.ts:249`).

So the only way a learner could download their own certificate is to be set up as a corporate client contact. The Aline persona (an individual career-changer) cannot exist on this schema. This is the single biggest structural blocker to becoming an e-learning platform.
*Fix (v2):* separate identity from role membership (a `user_roles` table with an optional scope), and add a `learner` role that needs no organization.

**N-5: Public enrollment collects PII with no privacy notice or consent record. Severity: Medium (compliance). NEW (extends CR-6).**
The commercial review flagged that the *contact* form has no privacy link. The Academy enrollment form (`frontend/src/components/EnrollmentForm.tsx` → `POST /api/academy/enrollments`) has the same gap. That matters more for a product designed to sign up many individuals. No `consents` table exists.

**N-6: Course price and duration are free text. Severity: Medium for v2. NEW.**
`fee text`, for example `'RWF 40,000 per learner'`, and `duration text` (`backend/db/migrations/010_academy_courses.sql:14-15`). Nothing can be charged, discounted, compared or localized. The LMS needs an integer amount in minor units, a currency code, and a structured duration.

**N-7: Malformed IDs in the URL path return 500 instead of 400 or 404. Severity: Low. NEW.**
Route parameters such as `request.params.id` (`academy/routes.ts:108,135,232` and every other module) are not validated before they reach a `uuid` column. Postgres raises `22P02`, the global handler logs an "Unhandled error", and the response is `500 INTERNAL_ERROR`. That adds noise to error tracking, makes the API contract inconsistent, and lets anyone generate error-log spam cheaply.

**N-8: Outbound email has no timeout and no retry. Severity: Low. NEW.**
`backend/src/lib/email.ts:30` calls `fetch` with no `AbortSignal`, inside the password-reset request path. If the provider is slow, user requests hang. A failed send is lost after the token has already been written. In v2, email moves to a queue with retries.

**N-9: Development and production apply the schema in different ways. Severity: Low. NEW.**
`docker-compose.yml:33` mounts the migrations into `docker-entrypoint-initdb.d`, so dev databases never get a `schema_migrations` table. Running `migrate.mjs` against them later re-applies `001` and fails. The runner also takes no advisory lock, so two concurrent deploys can race. *Fix:* use one path everywhere (the runner, plus `pg_advisory_lock`).

**N-10: The audit log cannot answer basic incident questions. Severity: Low now, Medium for v2. NEW.**
`access_log.user_id` is `NOT NULL` (`backend/db/migrations/007_access_log.sql:9`), so anonymous events (a failed login against an unknown email, public enrollment) and system events cannot be recorded. There is no IP, user agent, correlation ID or outcome field, and no tamper evidence. For an LMS that handles payments, this has to become a proper `audit_events` stream.

## 5. Academy module compared with an e-learning MVP

| # | LMS MVP capability | Today | Evidence |
|---|---|---|---|
| 1 | Public course catalog with slug, description, price and status | Partial | `courses` table; prices are text, rows are seeded by a migration |
| 2 | Learner self-registration / own account | **Missing** | N-4 |
| 3 | Login and password recovery | Partial | Works for existing users; no sign-up, verification or OTP |
| 4 | Enrollment | Partial | Anonymous form; cohort-only; a new learner row is created each time (duplicates) |
| 5 | Payment (MoMo / Airtel / card) | **Missing** | ADR-006 scoped billing out |
| 6 | Course structure (modules → lessons) | **Missing** | — |
| 7 | Media delivery (adaptive video, documents) | **Missing** | — |
| 8 | Progress tracking / resume | **Missing** | — |
| 9 | Auto-graded quizzes, attempts and retakes | **Missing** | One trainer-entered pass/fail per enrollment (`015_academy_assessments.sql`, unique per enrollment) |
| 10 | Live-session attendance | Present | `attendance_records` |
| 11 | Trainer cohort management | Present | `/staff/academy`, roster API |
| 12 | Certificate issuance | Present | HTML file (`academy/service.ts`) |
| 13 | Public certificate verification | **Missing** | No verification code, no public lookup |
| 14 | Notifications (email / SMS / WhatsApp) | **Missing** | Email is used only for password reset |
| 15 | Course authoring / admin | **Missing** | Courses come from a migration seed |
| 16 | Learning analytics | **Missing** | Reporting covers Advisory and leads only |

**3 present, 3 partial, 10 missing.** What exists, the cohort register (cohorts, attendance, assessment, certificate), carries forward into the LMS as its **"live cohort" delivery mode**. The domain logic is sound. It is just one part of a larger product.

## 6. Structural observations that shape v2

1. **One frontend currently contains three products:** the public site, the client portal and the staff console. They share one root layout (`frontend/src/app/layout.tsx`), so marketing pages hydrate a TanStack Query provider they never use. They share one CSP, one release cadence and one blast radius. A marketing copy change redeploys the staff console.
2. **Auth gating is client-side only.** No `middleware.ts` or `proxy.ts` exists. `/portal/*` and `/staff/*` are `"use client"` pages that render a shell and then call the API. This is not a data leak, because the API enforces auth, but it causes a flash of protected UI and gives no server-side redirect.
3. **Validation contracts are copied by hand.** `frontend/src/lib/schema.ts` says it "mirrors the backend's … exactly" and that "if one changes, the other must too". A shared contracts package fixes this.
4. **DB types are hand-maintained** (`backend/src/lib/db.ts`, which notes it is "hand-kept in sync"). Generate them from the database (`kysely-codegen`) in CI.
5. **Marketing content is hard-coded** in `frontend/src/lib/content.ts`, so every copy change needs a developer and a deploy. A marketing website needs a CMS.
6. **Every authenticated handler calls its own role check** (`requireRole(...)(request)` inside the handler). Forgetting the call fails *open*. In v2, declare authorization as route metadata in a `preHandler` hook, and make "no auth policy declared" fail at startup.
7. **Documentation weight.** ~130 documents and very long code comments that cite documents back and forth give excellent traceability. They also cost a lot to maintain, and some are already stale (several still cite `apps/web/`, the pre-restructure path). For v2: keep ADRs, runbooks and living architecture docs; archive the phase history; keep code comments to *why*, not *where it was decided*.

## 7. What this means for the decision

- **Reuse:** backend `lib/` patterns (errors, config, audit-in-transaction, file signatures, storage abstraction, authz approach), the Fastify/Kysely/Postgres stack, CI/Docker scaffolding, the design tokens and accessible form components, the marketing copy, and the CRM lead-capture flow.
- **Rework:** identity and sessions (N-3, N-4), audit (N-10), storage (from local disk to object storage), email (to a queued notifications module), and runtime config (N-2).
- **Rebuild:** the Academy domain, as the LMS.
- **Separate:** the public website, the e-learning app and (later) the operations portal, as independently deployable apps sharing packages.

The target design is in [02-TARGET-ARCHITECTURE.md](02-TARGET-ARCHITECTURE.md).
