# Z-GATE Digital Platform — Architecture Summary

**Full depth lives in `docs/architecture/`** (`ARCHITECTURE.md`, `SYSTEM_CONTEXT.md`, `DOMAIN_ARCHITECTURE.md`, `MODULE_ARCHITECTURE.md`, `DATA_ARCHITECTURE.md`, `API_ARCHITECTURE.md`, `INTEGRATION_ARCHITECTURE.md`, `DEPLOYMENT_ARCHITECTURE.md`, and six numbered ADRs) plus `docs/database/`, `docs/backend/`, `docs/frontend/`. This document is the map, not the territory — read it first, then go deep where you need to.

## Shape of the system

**Two independent, separately-deployable packages, not a monorepo workspace:**

| Package | Location | What it is |
|---|---|---|
| Backend | `backend/` | Fastify + Kysely + PostgreSQL modular monolith, TypeScript, compiled with `tsc` |
| Frontend | `frontend/` | Next.js 16 (App Router), React 19, its own `package.json`/lockfile |

Deliberately not an npm workspace (`docs/frontend/FRONTEND_ARCHITECTURE.md`) — a broken dependency in one package can never break the other's install or build. Deliberately a modular monolith, not microservices (`docs/architecture/ADR/ADR-001-modular-monolith.md`) — team size (one contract/intern developer at MVP) and traffic don't justify distributed-systems complexity; the module boundaries below are the seams a future extraction would cut along, not built as separate services now.

## Backend modules

`backend/src/modules/{academy,advisory,clients,crm,documents,identity,reporting}/` — each owns its own database tables, its own `routes.ts` (HTTP layer), `service.ts` (business logic, the only place that touches its tables), and `schema.ts` (Zod input validation). No module reaches into another module's tables directly; cross-module needs go through the other module's exported functions (e.g., `crm`'s lead-conversion calls `clients`' `createClient`, never writes to `clients` itself) — `docs/architecture/MODULE_ARCHITECTURE.md` is the source of truth for this rule and the module-extraction points if this ever needs to become real microservices.

Shared, cross-cutting code lives in `backend/src/lib/`: `db.ts` (Kysely connection + full schema typing), `config.ts` (validated environment configuration), `auth.ts`/`session.ts`/`authz.ts` (authentication/session/RBAC), `engagementAccess.ts` (the one shared object-level authorization check for engagement-scoped resources), `audit.ts` (the one shared audit-log writer), `storage.ts` (file storage abstraction), `errors.ts` (the one error taxonomy every route uses), `email.ts`, `token.ts`, `fileSignature.ts`.

## Data

**PostgreSQL, 16 forward-only, numbered SQL migration files** (`backend/db/migrations/`) — the schema's source of truth, applied by `backend/scripts/migrate.mjs` (an idempotent runner with its own `schema_migrations` tracking table, used identically in CI, staging, and production). Kysely provides full compile-time type safety against that schema — `backend/src/lib/db.ts`'s interfaces are hand-kept in sync with the migrations, not generated, and are the actual types every query in the codebase is checked against.

Data classification (`docs/architecture/DATA_ARCHITECTURE.md`) tags every table Confidential/Internal/Public/Sensitive-Personal and states the handling rule for each — Confidential data (clients, compliance items, deliverables, leads) requires audit logging on access. **Verified during the independent security audit that this rule is not fully honored in code today** — see `docs/SECURITY_GUIDE.md`.

## Frontend

Next.js App Router, server components by default, `export const dynamic = "error"` static generation for every public marketing page (`docs/frontend/ROUTE_MAP.md`'s deliberate rendering-strategy choice). Client-side interactivity (forms, authenticated dashboards) uses `"use client"` components with React Hook Form + Zod validation and TanStack Query for data fetching. Route groups: public marketing pages, `/login`/`/forgot-password`/`/reset-password`, `/portal/*` (client-facing), `/staff/*` (staff-facing).

## Authentication & authorization

Self-hosted, stateless, encrypted-cookie sessions (`@fastify/secure-session`, `docs/architecture/ADR/ADR-005-self-hosted-auth.md` — deliberately no session-store table, no new recurring vendor cost). Bcrypt password hashing, timing-safe login (a fixed dummy hash is compared even for a nonexistent account, closing a real timing side-channel found and fixed during the security review). Role-based access control (`client`, `staff_advisory`, `staff_marketing`, `staff_academy`, `admin`) enforced at two layers: role-level (`requireRole`, "can this role do this class of action at all") and object-level (`assertClientDataAccess`, "is this specific record theirs" — always a 404, never a 403, to avoid leaking existence). Full detail: `docs/security/RBAC_SECURITY_MODEL.md`, `docs/backend/AUTHORIZATION_MODEL.md`.

## Infrastructure (as designed — see `docs/HANDOVER.md` for what's actually provisioned)

Vertical-first: a single application instance plus a managed-or-self-hosted PostgreSQL instance, no container orchestration platform, no CDN — proportionate to current scale (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`). Docker images exist for both packages (dev + prod multi-stage targets, non-root runtime users, `HEALTHCHECK` instructions). CI/CD (`.github/workflows/ci.yml`) runs lint/typecheck/test/build/security-scan on every push, and publishes tagged production images to GHCR on push to `main` — artifact preparation only, never an automated deploy. **The actual hosting region and provider remain an open decision** (`ADR-004`), gated on data-residency/NCSA questions this repository cannot resolve on its own.

## Why the architecture looks the way it does

Every non-obvious choice in this system has a written reason, not just a description — that's the point of the ADRs (`docs/architecture/ADR/`): modular monolith over microservices, TypeScript over JavaScript, self-hosted auth over a third-party identity provider, the shared-`clients`-record model over four divisions each keeping their own client data, no EBM billing-system integration, and the still-open data-residency question. Read those before changing any of the decisions they document.
