# Z-GATE Digital Platform — Backend Testing

## Tooling: Vitest — no new test runner

Same reasoning as `docs/frontend/FRONTEND_TESTING.md`: Vitest is already established and verified working (`docs/devops/DEVELOPMENT_ENVIRONMENT.md`) — the backend package uses it directly, no separate runner introduced.

## Test database strategy

- **A real PostgreSQL instance, not a mocked database.** Given how much of this platform's actual risk lives in SQL-level correctness (foreign keys, check constraints, the `ON DELETE RESTRICT` behavior `docs/database/ENTITY_RELATIONSHIPS.md` deliberately chose) and in the authorization queries themselves, mocking the database would test far less than running real queries against real migrations does.
- **Ephemeral per test run:** the seven migration files (`db/migrations/`) are applied fresh to a disposable database (a container, in CI) before the suite runs, and torn down after — exactly the validation approach `docs/database/MIGRATION_STRATEGY.md` intended but couldn't complete manually in this development environment's sandboxed session (a Docker permission issue specific to that interactive session, not a limitation of CI, which runs with its own clean environment and full Docker access). **This is the first thing the backend implementation phase should confirm actually works**, closing the gap that document flagged.
- **Synthetic seed data only** — never real Client data, in any test run, in any environment (`docs/security/DATA_PROTECTION_REQUIREMENTS.md`'s anonymization rule applies to test data exactly as it applies to staging).

## What gets tested, per endpoint (directly answers this phase's "for every endpoint" instruction, from the testing side)

Every endpoint in `docs/backend/API_CONVENTIONS.md` gets, at minimum:
1. **Unauthenticated request → `401`** (for every endpoint requiring auth).
2. **Wrong role → `403`** (e.g., a `client`-role session hitting a staff-only route).
3. **Object-level check failure → `404`/`403` as specified** — e.g., a `staff_advisory` account not assigned to a given client gets `404` on that client's compliance items, not a leak of whether the record exists. **This is the single most important category of test in this entire suite** — it's the direct regression test for `docs/security/THREAT_MODEL.md`'s Critical-rated risk, and it must exist for every endpoint that takes an object-level parameter, not just a representative sample.
4. **Validation failure → `400` with the right field-level message** for at least one realistic invalid input per field.
5. **The success path** — correct output shape, correct status code, and (where applicable) the correct database state afterward (e.g., `POST /api/advisory/compliance-items/:id/complete` actually sets `completed_at` and writes the matching `access_log` row in the same transaction).
6. **Audit-logging assertion**, wherever the endpoint's catalog entry says it should log — a test that only checks the HTTP response and never verifies the `access_log` row exists would miss a regression in the one control `docs/security/RBAC_SECURITY_MODEL.md`'s quarterly review depends on entirely.

## Module-level unit tests

Pure business logic that doesn't need a database round-trip — the "is this compliance item overdue" computation, Zod schema edge cases, the authorization assertion helpers (`docs/backend/AUTHORIZATION_MODEL.md`) tested directly with a range of role/ownership combinations, not only indirectly through endpoint tests.

## What's explicitly not built at MVP

- **No load/performance testing suite** — real traffic is small; premature at this scale, consistent with `docs/frontend/FRONTEND_TESTING.md`'s parallel decision to defer E2E testing.
- **No contract-testing tooling** (e.g., Pact) between frontend and backend — one team, one repository, changes to both sides happen together; the coordination problem contract testing solves doesn't exist yet at this scale.
- **No separate security-testing tool beyond what `docs/security/SECURITY_TESTING_STRATEGY.md` already specifies** (SAST/SCA/secrets-scan in CI, DAST against staging) — this document's endpoint-level authorization tests are the backend-specific complement to that broader strategy, not a replacement for it.

## Coverage expectation

Same philosophy as the frontend: no blanket numeric target. Every endpoint's five test categories above (auth, authz-role, authz-object, validation, success) are the actual bar — a backend with 100% line coverage but missing the object-level-authorization test on one endpoint has a real gap this document's own priorities call the most important thing to test; a backend with slightly lower raw coverage but complete authorization test coverage is in better shape.

## What this document does not do

It does not write the actual test files or choose a specific test-database-provisioning tool for CI (a Docker service container in the CI workflow is the natural fit, extending `.github/workflows/ci.yml`) — implementation-phase work. It does not test V1/V2 endpoints, which don't exist yet.
