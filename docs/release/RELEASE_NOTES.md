# Z-GATE Digital Platform — Release Notes

**Release candidate:** v0.1.0-rc1
**Commit:** `8332efc` (branch `develop`)
**Date:** 2026-09-11
**Status:** Code-ready. **Not yet deployed to production** — see `docs/release/DEPLOYMENT_PLAN.md` for what's still gating an actual production cutover (this is a pre-existing, already-tracked business/compliance gate, not a defect found in this release).

This is the platform's **first release candidate** — there is no prior production version this release changes relative to. Every item below is new.

## What's in this release

### Public website (`apps/web`)
- Home, About, Advisory, Academy, Tech, Data, Contact pages — real, approved copy only (`docs/marketing/`), no fabricated claims, testimonials, or metrics anywhere.
- Academy course enrollment flow (`/academy/enroll`).
- Technical SEO: per-page canonical URLs, a corrected `robots.txt` (auth-gated routes excluded from crawling), a complete `sitemap.xml`, and minimal fact-only `Organization` structured data.
- Accessibility built in throughout (semantic HTML, ARIA labelling, `aria-live`/`aria-busy` states, focus-visible styles, real `<table>` semantics under responsive collapse) — not yet machine-verified; see Known Issues.

### Identity & access
- Self-hosted authentication (email/password, encrypted stateless sessions).
- Password recovery (request + confirm flow, single-use time-limited tokens).
- Role-based access control across `client`, `staff_advisory`, `staff_marketing`, `staff_academy`, and `admin` roles.
- **New this release:** admin-facing account deactivation (`POST /api/admin/users/:id/deactivate`) — incident-containment capability that previously didn't exist at the API level.

### CRM
- Public lead-capture form (`/contact`) and staff-facing lead management (list, detail, convert-to-client).

### Client-facing portal
- `/portal` (engagement/compliance status) and `/portal/deliverables` (document access), scoped to each Client's own records only.

### Staff-facing platform
- Client list/detail views, compliance item tracking, deliverable upload, and reporting (leads-by-channel, data-quality signals, data dictionary).

### Academy module
- Full course/cohort/enrollment/attendance/assessment/certificate data model and workflow, staff-facing cohort management UI, and learner enrollment flow.

### Data & BI
- Reporting endpoints and a data dictionary/data-quality surface for staff, built on top of existing operational data (no separate data warehouse — proportionate to current scale).

### Platform/DevOps foundation
- CI pipeline (lint, typecheck, DB-backed tests, dependency audit, secrets scan, build) for both packages independently.
- Idempotent database migration runner (`scripts/migrate.mjs`), now the single mechanism used in CI and (once a target exists) staging/production alike.
- Docker images (dev + production targets) for both packages, with production health checks.
- `/api/health` (liveness) and `/api/ready` (readiness, real database connectivity check) endpoints.
- CI job to publish tagged, immutable production images to GHCR on release — artifact preparation only, no automated deployment.

## Explicitly not in this release

Carried forward, unchanged, from earlier phases' own scope decisions — restated here so this release isn't mistaken for having silently dropped them:

- **Tech division client-facing work** — evaluated and deliberately not built; the architecture doc's own words were that building it now would be "for a client that doesn't exist yet."
- **Admin platform** (a dedicated admin UI beyond the `admin` role's existing API-level capabilities) — explicitly out of V1 scope.
- **Case studies / Insights content pages** — not built; case studies are process-gated on a real completed client engagement plus written consent (`docs/marketing/CONTENT_STRATEGY.md`), which hasn't happened yet. Publishing either would mean fabricating content this engagement has consistently refused to do.
- **Kinyarwanda/French localization** — an open business question, not scoped.
- **Per-account session revocation** ("force logout one specific already-logged-in user without logging out everyone else") — sessions are stateless by design (ADR-005); account deactivation (this release) blocks *future* logins immediately, and platform-wide `SESSION_SECRET` rotation remains the available (blunt) tool for an already-active session. See `docs/devops/INCIDENT_RUNBOOK.md`.

## Notable fixes included in this release candidate

- A genuine deadlock bug in the new readiness endpoint (`await reply.code(503)` never returning) and a missing database-connection timeout — both found during this release cycle's own verification, both fixed, both regression-tested.
- An untracked `apps/web/public/` directory that would have broken a from-scratch production Docker build.
- One Medium-severity functional defect (nondeterministic engagement selection on the client-detail page) — found and fixed in the QA phase.
- Three High-severity security findings (login timing side-channel, spoofable upload-type validation, missing security headers on both packages) plus two CI-integrity gaps (silently-skipped DB-backed tests, zero frontend CI coverage) — all found and fixed in the security review phase.
- One real N+1 query pattern (audit-log inserts on the staff client list) — found and fixed in the performance review phase.

## Versioning note

Package versions are currently inconsistent (`package.json` backend `0.0.0`, `apps/web/package.json` frontend `0.1.0` — both untouched scaffold defaults, never deliberately set). This release candidate is tagged `v0.1.0-rc1` at the git level regardless; bumping both `package.json` files to match is recommended as a small follow-up, not done in this pass to avoid an unrequested version-numbering decision inside a verification-focused release phase.
