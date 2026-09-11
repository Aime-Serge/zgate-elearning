# Z-GATE Digital Platform — Test Strategy

## Purpose and philosophy

This strategy governs how the implemented platform is verified, at a scale appropriate to what the platform actually is: a small, four-division company's internal operational tooling, built by one engineer across a single continuous engagement, with a team of a handful of people once fully staffed. Every prior phase of this engagement — architecture, security, and every feature build — has applied one consistent discipline: **build and verify only what's approved and real, never what's aspirational or what a larger organization's QA function would default to.** This document extends that discipline to testing itself. A test suite sized for a venture-scale SaaS company would be its own form of premature complexity for this platform, exactly as an over-built data pipeline or a speculative admin platform would be.

Concretely, that means:

- Test levels are chosen per feature based on where a real defect is most likely and most costly to reach a real user — not applied uniformly because a checklist names eight levels.
- No test exists for a feature that isn't approved and built. `TEST_PLAN.md` states explicitly, feature by feature, what's in scope and what's declared out of scope because it doesn't exist yet (self-service registration, "Projects"/SOW as platform concepts, Tech Operations, background-job-driven notifications, most of Admin Platform) — the same evaluation discipline every implementation phase in this engagement already applied before writing code.
- Test infrastructure additions (a new CI job, a new test file, a new tool) are added when a real gap is found, not spun up preemptively "to be thorough."

## Test levels used, and why

| Level | Tool | Where applied |
|---|---|---|
| **Unit** | Vitest | Pure functions with no I/O: `lib/fileSignature.ts`, `lib/config.ts`'s parsing, business-logic helpers with no database dependency. |
| **Integration / API** | Vitest + Fastify's `app.inject()` | The bulk of the backend suite — every route, exercised through the real Fastify app (real routing, real middleware, real Zod validation, real authorization checks) against a real PostgreSQL instance. This is the platform's primary line of defense: `docs/backend/BACKEND_TESTING.md`'s own design intent, and where every IDOR/BOLA and privilege-escalation test in this codebase lives. |
| **Component** | Vitest + React Testing Library | Individual frontend components with meaningful client-side logic (`ContactForm`, `Header`). Not applied to every component — most of this frontend is server-rendered or thin data-display wrappers around already-tested API responses, where a component test would mostly re-assert what the API-level test already proved. |
| **End-to-end (browser)** | *Not implemented* | See **Gaps**, below. This is a real, acknowledged gap, not a silent omission. |
| **Accessibility (automated)** | *Not implemented* | See **Gaps**. Accessibility intent is built into every page (semantic HTML, ARIA labelling, `aria-live`/`aria-busy` loading states, real `<table>` semantics even where visually collapsed — verified by code review throughout every frontend-building phase of this engagement) but is not machine-checked. |
| **Security** | Manual + automated (`npm audit`, `gitleaks`) + live testing | Covered by `docs/security/SECURITY_TEST_REPORT.md`, a dedicated review — cross-referenced here rather than duplicated. This document's own scope does not re-run that review; `DEFECTS.md` references its findings where relevant to overall release readiness. |
| **Performance / load** | *Not implemented* | See **Gaps**. Reasoned out of scope at this stage: no production traffic exists yet to have a real performance target against, and building load-testing infrastructure for a not-yet-launched, single-digit-concurrent-user platform would itself be the premature complexity this strategy exists to avoid. Revisit once real usage data exists (the same "wait for the real signal" discipline `docs/architecture/DOMAIN_ARCHITECTURE.md` already applies to Data's BI layer and Tech Operations). |

## Environments

- **Local development:** Docker Compose (Postgres + API + web, all live-reload) per `docs/devops/DEVELOPMENT_ENVIRONMENT.md`. This QA pass could not use it — see **Sandbox limitation**, below.
- **CI:** GitHub Actions, an ephemeral PostgreSQL service container per run, real migrations applied before tests run. As of this QA phase, this is the **only** environment that has ever executed the database-dependent portion of the test suite for real (see `docs/security/SECURITY_TEST_REPORT.md` F-06 and `TEST_RESULTS.md` for the full history of that gap and its fix).
- **Production:** does not exist yet. `docs/architecture/ADR/ADR-004-data-residency-hosting-region.md`'s hosting decision remains open. Nothing in this strategy assumes a production environment to test against.

## Sandbox limitation (affects every QA phase to date, not just this one)

Every implementation and review phase across this entire engagement has run in a sandboxed environment where `docker.sock` returns `permission denied` — a structural constraint of the environment, not a project configuration issue. No local PostgreSQL has ever been reachable in any of these sessions. This means:

- Every "tests pass" claim made anywhere in this engagement's history, for any phase, was true of what actually executed — never a fabricated result — but the database-dependent majority of the suite could only be confirmed by static reading of the test code plus (as of the security review) reproducing the CI failure/fix locally against an unreachable database (proving the *code path* now executes, not that it *passes*).
- This QA phase does not change that constraint. What it adds is a precise, honest accounting of exactly what has and hasn't been executed for real, and a fully corrected CI pipeline (as of the security review) that will execute all of it on the next push — see `TEST_RESULTS.md`.

## Roles and responsibilities

This engagement has one engineer performing every role in sequence (architecture, implementation, security review, now QA) — matching the real organizational reality `docs/security/RBAC_SECURITY_MODEL.md`'s "Separation of duties" section already documents ("at MVP scale... there's one Advisory Associate and one MD"). Where this strategy says "QA reviews X," read it as "this phase's dedicated review pass," not a separate department. This is an accepted, documented limitation of the current team size, not an oversight — the same framing that document already applies to its own domain.

## Entry and exit criteria

**Entry** (before a feature is considered ready for this test pass): the feature has a corresponding approved backlog item or architecture-document verdict; its backend endpoints exist and are registered; its frontend pages build cleanly.

**Exit** (before a feature is considered release-ready): lint, typecheck, and build are clean for both packages; the feature's own test file exists and is structurally sound (even if this sandbox can't execute its DB-dependent body); no open Blocker or Critical defect remains against it (`DEFECTS.md`); any security finding from `SECURITY_TEST_REPORT.md` touching the feature is resolved or explicitly risk-accepted.

## What this strategy explicitly does not do

It does not claim ISTQB- or any formal-methodology certification. It does not introduce a new test framework, a visual-regression tool, or a load-testing tool speculatively — any of those get added in a future phase if and when a real need for one is identified, not now. It does not re-litigate `docs/security/SECURITY_TEST_REPORT.md`'s findings; `DEFECTS.md` cross-references it rather than duplicating its content.
