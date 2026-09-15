# Z-GATE Digital Platform — Test Plan

Scope for this QA phase, mapped against what is actually approved and built — not the full list requested by this phase's own prompt, which named several capabilities no prior phase ever approved or built. Each is marked explicitly rather than silently skipped, per this engagement's established practice of surfacing scope mismatches instead of quietly building or testing around them.

## Functional scope

| Area | Status | In scope this phase? | Test level(s) / evidence |
|---|---|---|---|
| User registration | **Not built** — no self-service registration exists anywhere in the platform. Accounts are created directly in the database (identity `docs/database/DATA_MODEL.md`'s own design: "role is server-authoritative, assigned at account creation/administration [admin-only action]"); a staff-facing "add a user" UI is FEAT-09.2, V1, not built. | No — nothing to test | N/A |
| Login | Built (`src/modules/identity`) | Yes | API: `identity/routes.test.ts`. Live: auth-gate sweep (`TEST_RESULTS.md`). |
| Authorization | Built — role-level (`requireRole`) and object-level (`lib/engagementAccess.ts`, Academy's trainer-scoping) checks across every module | Yes | API: every module's route test file exercises both role- and object-level checks. Security-specific coverage: `docs/security/SECURITY_TEST_REPORT.md`. |
| Lead creation | Built (public form + staff manual entry, `src/modules/crm`) | Yes | API: `crm/routes.test.ts`, `crm/leads.test.ts`. |
| Lead conversion | Built (`POST /api/leads/:id/convert`) | Yes | API: `crm/leads.test.ts` (full lifecycle: create → list/filter → convert → already-converted conflict → not-found). |
| Client onboarding | Not a separate flow — "onboarding" *is* lead conversion (creates the `clients` row). No distinct onboarding wizard/checklist exists or is backlogged. | Covered under lead conversion | See above |
| Portal (client) | Built (`/portal`, `/portal/deliverables`) | Yes | API: `advisory/routes.test.ts`, `documents/routes.test.ts`, `clients/routes.test.ts`. Live: page-render sweep. |
| Documents | Built (upload, list, download — `src/modules/documents`) | Yes | API: `documents/routes.test.ts` (16 cases, incl. upload content-type verification per `SECURITY_TEST_REPORT.md` F-02). |
| Projects | **Not approved as a platform concept.** `docs/architecture/DOMAIN_ARCHITECTURE.md` §8: *"No approved business document defines a generic, cross-division 'Projects' concept... do not build a Projects domain."* | No | N/A |
| SOW | **Not a platform feature.** A Statement of Work is a legal/contract artifact handled outside the system, the same way Client SLA signing is (`docs/product/PRD.md` non-goals). No approved document describes SOW as something this platform tracks. | No | N/A |
| SLA | Not a distinct trackable entity, but SLA *targets* are embedded in what's built: Advisory's `onTimeRate` (compliance items completed by their due date, Schedule A), Academy's enrollment-confirmation/attendance/certificate-issuance timestamps (Schedule B targets). | Covered under Advisory/Academy/Data below | See those rows |
| Advisory | Built (compliance items, mark-complete, client list/detail) | Yes | API: `advisory/routes.test.ts`, `clients/routes.test.ts`. |
| Academy | Built (courses, cohorts, enrollment, attendance, assessment, certificates) | Yes | API: `academy/routes.test.ts` (14 cases — the most extensive suite in the codebase, covering learner-privacy and trainer-scoping specifically). |
| Tech | **Not built, deliberately.** A dedicated evaluation this engagement performed concluded building it now would be "building for a client that doesn't exist yet" (`docs/architecture/DOMAIN_ARCHITECTURE.md` §6) — V2, gated on a real external Tech client, which doesn't exist. | No | N/A |
| Data | Internal BI layer built (advisory-summary, lead-pipeline, data-dictionary, data-quality). External Data-as-a-service is V2, not built. | Yes, for what's built | API: `reporting/routes.test.ts` (13 cases). |
| Notifications | **Not built, deliberately.** `docs/backend/BACKGROUND_JOBS.md`: "zero background jobs, by design" at MVP. | No | N/A |
| Administrative operations | Mostly not built — Admin Platform (user/role management) is V1/FEAT-09.x, not built. What exists: the `admin` role's already-elevated access across every module (covered under Authorization), plus the admin-only data-dictionary/data-quality endpoints. | Partial | API: `reporting/routes.test.ts`. |

## Non-functional scope

| Area | Approach this phase | Evidence |
|---|---|---|
| Responsiveness | Code review against `docs/design/RESPONSIVE_RULES.md` (mobile-first, `sm`/`md` breakpoints, table-to-card collapse pattern used consistently across every data table) — no automated visual-regression tool exists. | `TEST_RESULTS.md` |
| Accessibility | Code review only (semantic HTML, ARIA labelling, `aria-live`/`aria-busy`, real `<table>` semantics preserved under responsive collapse, focus-visible styles) — no automated tool (axe-core, jest-axe) is wired into the suite. **Gap**, tracked in `DEFECTS.md`. | `TEST_RESULTS.md`, `DEFECTS.md` |
| Performance | Not tested — no production traffic exists yet to have a real target against. Reasoned out of scope in `TEST_STRATEGY.md`. | `TEST_STRATEGY.md` |
| Reliability | Every page's explicit loading/empty/error+retry states reviewed; server-side error handling verified live (generic messages, no stack-trace/DB-detail leakage). | `TEST_RESULTS.md` |
| Error handling | Verified at the API level across every module's test suite (400/401/403/404/409 paths) and live (malformed/missing-field requests). | `TEST_RESULTS.md` |
| Security | Full dedicated review: `docs/security/SECURITY_TEST_REPORT.md`. Cross-referenced, not re-run here. | `docs/security/SECURITY_TEST_REPORT.md` |
| Browser compatibility | Not tested — no cross-browser matrix or tooling (Playwright/BrowserStack) exists. **Gap**, tracked in `DEFECTS.md`. | `DEFECTS.md` |
| API behavior | Extensively tested at the integration/API level — this is the suite's primary coverage layer (71 of 90 backend tests exercise real routes against a real database when run where a database is reachable). | `TEST_RESULTS.md` |

## Test data approach

DB-seeded fixtures created and torn down per test (the established pattern across every test file this engagement wrote: `createTestClient`, `createEngagement`, `loginAs`, etc.), never against a shared or persistent dataset, and never real Client data (`docs/security/DATA_PROTECTION_REQUIREMENTS.md`'s anonymization requirement — moot here since all fixtures are synthetic from the start). Academy's two seeded courses are the real, already-approved curriculum content (`db/migrations/010_academy_courses.sql`), not synthetic — everything created *from* them in tests (cohorts, learners, enrollments) is synthetic and torn down.

## What this plan does not cover

It does not re-derive or re-run `docs/security/SECURITY_TEST_REPORT.md`'s own test matrix. It does not add test cases for any "Not built" row above — those get planned when their own phase starts, not spun up speculatively now.
