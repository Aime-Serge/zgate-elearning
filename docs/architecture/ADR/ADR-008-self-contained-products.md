# ADR-008: Self-Contained Products in One Repository

**Status:** Accepted (2026-10-15)
**Builds on:** ADR-007 (separate products, separate backends). It supersedes ADR-007's repository-layout and local-database details; ADR-007's decisions stand.

## Context

ADR-007 split the website and the e-learning platform into separate products with separate backends. Their delivery was still entangled: one `infra/` folder held both products' Compose files, one Postgres container served both databases, and the edge proxy and the website's production stack lived together. The team also develops on 8 GB Windows machines, where running both products' toolchains at once is slow or fails outright.

## Decision

1. **One repository, two independent products.** `website/` and `elearning/` each hold everything that product needs to build, run, deploy and document itself:

   ```text
   <product>/
     frontend/  backend/  (elearning also: worker/)
     database/   roles SQL, Postgres configs, backup/restore scripts, backup targets
     deploy/     compose.yml (dev), compose.prod.yml (production), env/ templates
     docs/       product-specific design and runbooks
   ```

   Neither imports the other; both may use `shared/` (code) and `platform/` (runtime). dependency-cruiser enforces the import rules in CI (`pnpm lint:boundaries`).

2. **Separate databases, separate instances.** Each product has its own Postgres container locally (website on port 5432, e-learning on 5433, separate volumes), and its own instance in production. Each database has a migration-owner role and a least-privilege app role (`<product>/database/init/`). Backup targets differ by risk: the website, nightly; the e-learning platform, point-in-time recovery with at most 15 minutes of data loss. Schemas stay with their backends (`website/backend/src/migrations`, `elearning/backend/db/migrations`).

3. **A dedicated worker for the e-learning platform.** `elearning/worker` runs background work (payment webhooks, email and SMS, certificate PDFs, video processing) so none of it runs inside an API request. It shares the database schema with the API, never its code.

4. **`platform/` is the only shared runtime:** the edge proxy (`platform/edge/Caddyfile`), observability, and repo tooling (`platform/scripts/`). For now the edge runs in the website's production stack and also routes `learn.`; the e-learning production stack joins it on a shared network before go-live.

5. **Low-memory hybrid development.** By default only a product's Postgres runs in Docker and its apps run natively (`pnpm dev:website` or `pnpm dev:elearning`, one product at a time, never both). Containers for everything sit behind a `full` profile with memory caps. Node gets a 1.5 GB heap ceiling and Vitest two workers locally; CI and production keep their normal settings (`docs/DEVELOPMENT_LOW_MEMORY.md`).

6. **`legacy/ops` is retired once its trainer and lead screens are rebuilt** in the products that own them: trainer screens in the e-learning platform, lead handling in the website CMS. Until then it stays frozen and runs on the e-learning API (`--profile legacy`).

## Consequences

- A change to one product triggers only that product's CI workflow (plus `shared.yml` for shared code); each product deploys on its own schedule.
- Two Postgres instances to operate and back up, with different targets. The e-learning point-in-time recovery must be set up before learners or payments go live.
- Some files are deliberately duplicated rather than shared (backup scripts, Postgres configs), so a product never depends on another product's folder.
- The least-privilege roles are in place for local development; adopting them in production (separate URLs for the migration job and the app) is a follow-up per product.

## Next

Leadership decided on 2026-10-15 to move both backends to **Django (Python)**. The Fastify API stays only as long as `legacy/ops` needs it. That change gets its own ADR when the work starts. It fits this layout unchanged: each product keeps its own `backend/`, `database/` and `deploy/`.
