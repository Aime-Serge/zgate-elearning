# ADR-010: Separate Repositories per Product

**Status:** Accepted (2026-10-19)
**Builds on:** ADR-007 (separate products), ADR-008 (self-contained products) and ADR-009 (independent workspaces). It supersedes ADR-009's "one repository" decision and its cross-product CI; ADR-009's other decisions stand.

## Context

ADR-009 gave the website and the e-learning platform independent pnpm workspaces but kept them in one repository, with a third workspace for the frozen v1 portal (`legacy/ops`), a shared root `docs/` folder and root-level CI. Splitting into two repositories had been prepared then and deferred.

A review on 2026-10-19 found what still tied the products together:

1. Each product's contract tests installed the other's contract packages through relative `file:../../../<other product>/…` paths, so neither workspace could install without the other checked out next to it.
2. CI lived at the repository root, and the "Consumer contracts" jobs checked out both products.
3. The customer-journey and synthetic-monitoring workflows lived at the root but ran the e-learning tests.
4. The website's edge proxy routed the e-learning `learn.` host, so the e-learning platform could not go live without the website's production stack.
5. The e-learning development stack mounted `../../legacy/ops`, outside its own folder.
6. About 290 references in code comments and documentation pointed into the root `docs/` folder.

Leadership decided to make the two products two repositories: the parent folder holds only `website/` and `elearning/`, each with its own git history, CI, documentation and deploy path.

## Decision

1. **Two repositories, extracted with history.** Each product's repository is the product folder at the root, extracted from the monorepo with `git filter-repo`, keeping the history of every file it contains, including the history those files had under earlier paths (`apps/…`, `shared/…`, `platform/…`, the root `docs/`). The monorepo's last state is the tag `monorepo-final`, and a full bundle of it is archived outside the product folders.
2. **`legacy/ops` belongs to e-learning.** The frozen portal is a client of the e-learning API (still the v1 API) and was already started from e-learning's Compose `legacy` profile. It is now `legacy/ops` in the e-learning repository, still its own pnpm workspace with its own build-only workflow (`legacy.yml`), and is still retired once its trainer and lead screens are rebuilt (ADR-008).
3. **Documentation follows its owner.** The root `docs/` was distributed:
   - **Website:** marketing and design.
   - **E-learning:** the v1 platform's documentation (architecture, backend, database, devops, frontend, QA, security, release, discovery, performance, and the v1 guides such as `HANDOVER.md`), because its API and portal are the v1 system.
   - **Both:** the ADRs, the platform-v2 plan, business, product and UX, the roadmap, and the few e-learning-lineage documents the website's code cites (`SECURITY_GUIDE.md`, `architecture/DATA_ARCHITECTURE.md`, `discovery/BUSINESS_ALIGNMENT.md`, `release/COMMERCIAL_READINESS.md`). From the split on, each repository maintains its own copy. A new ADR that affects both products is added to both.
   - **Each repository's own:** `DEVELOPER_GUIDE.md` and `DEVELOPMENT_LOW_MEMORY.md`, rewritten for that product.
4. **Contracts are consumed as checksummed snapshots.** Each consumer keeps a copy of the provider's contract packages in `vendor/` (website: `elearning-contracts`; e-learning: `website-contracts`, `brand-ui`), installed as `file:` dependencies. `scripts/sync-contracts.mjs --from <provider checkout>` is the only way to change a snapshot; it copies the provider's committed version and records its commit, tree id and checksum in `vendor/VENDORED.json`. CI runs `--check` and fails on any hand edit. No package registry, token or cross-repository access is needed.
5. **Each product owns its edge.** The website's Caddy serves `www.`, `cms.` and the bare domain; the e-learning platform has its own Caddy for `learn.` in its production stack (`deploy/edge/`). The two run on separate hosts or IP addresses.
6. **CI per repository.** Website: `website.yml` and `repository.yml` (secrets scan). E-learning: `elearning.yml`, `legacy.yml`, `journey.yml`, `synthetic.yml` and `repository.yml`. Image names don't depend on the repository's name: they stay `ghcr.io/<owner>/z-gate-<app>`, the names the production Compose files pin.
7. **Paths in older documents.** Documents dated before 2026-10-19 use monorepo paths. Read `website/X` as `X` in the website repository, `elearning/X` as `X` in the e-learning repository, `legacy/ops` as `legacy/ops` in the e-learning repository, and the root `docs/X` as `docs/X` in whichever repository holds it. Code comments, configuration and the living runbooks were updated to repository-root paths.

## Consequences

- Each product installs, builds, tests, deploys and is cloned without the other. Access can be granted per product.
- **The consumer-contract safeguard is no longer automatic.** Before, a pull request that changed a contract package ran the other product's contract tests in the same pull request. Now the provider's own checks still run on every change (compatibility baselines, `oasdiff breaking` on `/api/v1`), but the consumer's tests run only when the consumer syncs the new snapshot. Contract changes are additive-only, so an unsynced consumer keeps working against the older snapshot; the risk is a consumer adopting a change late, not breaking. The customer journey on staging remains the release gate for both products.
- **The release gate crosses repositories.** The journey tests live in the e-learning repository; a website release runs them there (Actions, "Customer journey") and records the run in the deploy log. Calling that workflow from the website repository would need cross-repository access and a token, which this decision avoids.
- **Two edge proxies.** Each product needs its own host or IP address for ports 80 and 443. If both must ever share one machine, a single proxy in front of both needs a new ADR.
- **Shared documents can drift.** The ADRs and the platform-v2 plan now exist twice. Decisions that affect both products are recorded in both repositories in the same week; everything else is maintained by the product it concerns.
- **GitHub setup is manual.** Creating the two GitHub repositories, pushing them, granting each repository write access to its existing GHCR packages, recreating repository variables (`ELEARNING_PUBLIC_*`, `OPS_PUBLIC_*`, `STAGING_*`, `PRODUCTION_*`) in the right repository, and archiving the monorepo on GitHub are follow-up steps for the repository owner.
