# Z-GATE Digital Platform — Backend Architecture

**Source order:** `docs/architecture/` → `docs/security/` → `docs/database/` → `docs/frontend/`. Documentation only, per this phase's OUTPUT scope — no scaffolding here; real code lands in the implementation phases that follow.

## Framework decision: Fastify + Zod + Kysely

`docs/architecture/ARCHITECTURE.md` settled TypeScript, PostgreSQL, and a modular monolith; the specific backend framework was deferred to this phase.

| Layer | Choice | Why |
|---|---|---|
| HTTP framework | **Fastify** | Plugin-based encapsulation is a first-class Fastify concept — each backend module (`identity`, `clients`, `crm`, `advisory`, `documents`, `reporting`, `audit`, per `docs/architecture/MODULE_ARCHITECTURE.md`) becomes one Fastify plugin with its own scope, enforcing the "a module never reaches into another module's tables" rule at the framework level, not just by convention. Lower ceremony than NestJS's decorator/DI system — a better fit for a contract/junior-developer-sized team (`docs/business/ROLE_MATRIX.md`) than a heavier, more opinionated framework. Strong TypeScript support and built-in structured logging (pino) directly serve the Observability requirement below. |
| Validation | **Zod**, shared with the frontend | `docs/frontend/STATE_MANAGEMENT.md` already flagged the intent to mirror validation logic between client and server rather than duplicate it — Zod schemas defined once (in a shared package or duplicated deliberately with a noted sync obligation, an implementation-phase packaging decision) validate both the React Hook Form on the frontend and every Fastify route here, directly reducing the "duplicated validation logic" risk noted in that document. |
| Database access | **Kysely** (type-safe SQL query builder), not a full ORM | `docs/database/MIGRATION_STRATEGY.md` deliberately chose plain, framework-agnostic SQL migrations as the schema's source of truth — an ORM that wants to own schema definition and migrations (Prisma, TypeORM) would fight that decision. Kysely generates TypeScript types from the actual database schema (via introspection) without imposing its own migration DSL, keeps generated SQL close to the surface (important for a small team that needs to understand exactly what a query does, especially for compliance-critical data), and avoids classic ORM pitfalls (silent N+1 queries, magic relation-loading) that are easy for a less-experienced team to trip over. |

**Rejected: NestJS.** A real, valid option, but its DI-container/decorator-heavy style adds a learning-curve cost this specific team (per the HR Policy's actual, named Junior Developer hire) doesn't need to pay for benefits (elaborate dependency injection, guards/interceptors) this platform's real complexity doesn't yet require — the same "avoid premature complexity" reasoning `docs/architecture/ADR/ADR-001-modular-monolith.md` already applied to the microservices-vs-monolith decision.

## Module boundaries (implements `docs/architecture/MODULE_ARCHITECTURE.md` as Fastify plugins)

```
src/
  modules/
    identity/     — accounts, sessions, login/logout
    clients/       — Client records
    crm/            — Leads
    advisory/       — Compliance items, Advisory Engagements
    documents/       — Deliverables (file metadata + storage reference)
    reporting/        — read-only queries over crm/advisory (no owned tables)
    audit/             — access_log writes; the one module every other module calls into
  lib/
    db.ts              — Kysely instance, typed against db/migrations/'s actual schema
    auth.ts             — session verification, password hashing
    errors.ts            — shared error types (ERROR_HANDLING.md)
```

Each module plugin registers its own routes, and only its own routes touch its own tables (via `lib/db.ts`, scoped by convention to that module's table set — `docs/database/DATA_MODEL.md`). A module needing data another module owns calls that module's exported function, never queries its tables directly — the in-process equivalent of a service boundary, at zero network cost (`docs/architecture/MODULE_ARCHITECTURE.md`'s "in-process function/method calls only" rule).

## Transactions

Any request that writes to more than one table in one logical action wraps both writes in a single database transaction — most importantly, **every write to a Confidential-classified record and its corresponding `audit.access_log` entry happen in the same transaction** (`docs/database/DATA_SECURITY.md`): marking a compliance item complete and logging that access are one atomic unit, not two separate steps that could diverge if the second one silently failed. A partial failure (the business write succeeds, the audit write doesn't) is treated as a full failure and rolled back — an un-audited compliance-critical action is not an acceptable outcome, ever, on this platform.

## Background jobs

**None exist at MVP.** Full reasoning in `BACKGROUND_JOBS.md` — every MVP operation is synchronous and request-scoped; no job queue infrastructure is introduced speculatively.

## Notifications

**None built at MVP** — the Client Portal is pull-based (`docs/architecture/DOMAIN_ARCHITECTURE.md` §14). When V1 proactive Advisory-deadline reminders are built, the likely channel is WhatsApp Business API or SMS (`docs/architecture/INTEGRATION_ARCHITECTURE.md`'s V1 direction), triggered by whatever V1's background-job mechanism turns out to be (`BACKGROUND_JOBS.md`) — not designed further here, ahead of that phase.

## Document processing

An uploaded Deliverable (FEAT-06.3) is validated (file type, size limit — `docs/security/SECURITY_REQUIREMENTS.md` V12) and stored as-is; **no transformation, OCR, or content processing happens at MVP** — no approved product requirement calls for it. The `documents` module's job is storage-reference bookkeeping and access-mediated retrieval, not document intelligence.

## Audit logging

Every module that touches a Confidential-classified table calls a single shared `audit.log(...)` function (the `audit` module's one real export) inside the same transaction as the action being logged — this is the concrete implementation of `docs/database/DATA_LIFECYCLES.md`'s "append-only, written once" design and `docs/security/RBAC_SECURITY_MODEL.md`'s quarterly-review data source. No module writes to `access_log` directly with hand-rolled SQL — one function, one call signature, used everywhere, so the log's shape can never drift between modules.

## Observability

- **Structured logging** (Fastify's built-in pino integration): every request logged with a correlation ID, method, path, status, and duration — proportionate to `docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s "lightweight, not enterprise observability stack" requirement.
- **Health-check endpoint** (`GET /api/health`, unauthenticated, minimal — reuses the `src/health.ts` toolchain-proving placeholder's shape from the devops phase, now given a real purpose) — feeds the basic uptime monitoring `docs/architecture/DEPLOYMENT_ARCHITECTURE.md` already calls for.
- **Correlation IDs** appear in error responses (`ERROR_HANDLING.md`) so a user-reported issue can be traced to its server-side log entry without exposing any internal detail to the user themselves.

## Rate limiting

Policy overview here; per-endpoint detail in `API_SECURITY.md`. Applied via a Fastify rate-limiting plugin, scoped tighter on unauthenticated/abuse-prone endpoints (login, public contact form — `docs/architecture/THREAT_MODEL.md` §1, §3) than on authenticated, low-volume internal endpoints (the realistic MVP user count doesn't justify aggressive limits on, say, the Advisory Associate's own client list).

## What this document does not do

It does not write actual Fastify plugin code, Kysely query code, or the shared Zod-schema package's structure — implementation-phase work, built against everything specified here and in the rest of `docs/backend/`.
