# ADR-009: Independent Workspaces in One Repository

**Status:** Accepted (2026-10-16). Its "one repository" decision and cross-product CI are superseded by ADR-010 (2026-10-19).
**Builds on:** ADR-007 (separate products) and ADR-008 (self-contained products). It supersedes ADR-008's shared `shared/` and `platform/` folders and the root pnpm workspace; ADR-008's other decisions stand.

## Context

ADR-008 made each product self-contained, but one root pnpm workspace (one `package.json`, one lockfile, Turborepo) still joined them, and both depended on `shared/` (code) and `platform/` (runtime). A dependency update for one product could move the other's lockfile; an install pulled both products' toolchains; and nothing stopped a change to a shared schema from breaking one product while the other's CI stayed green.

Splitting into two GitHub repositories was considered and prepared (history-preserving extraction, packages published to GitHub Packages, cross-repository tokens). Leadership chose to keep **one repository**, with the two products as separate sub-projects.

## Decision

1. **Three independent pnpm workspaces, no root workspace.** `website/`, `elearning/` and `legacy/ops/` each have their own `package.json`, `pnpm-workspace.yaml`, lockfile, `.npmrc` and CI workflow (`.github/workflows/website.yml`, `elearning.yml`, `legacy.yml`). There is no root `package.json`, lockfile or Turborepo; every command runs inside a workspace.
2. **Shared code moved to its owner.** `shared/ui` became `website/packages/brand-ui`; the website CMS's contracts became `website/packages/website-contracts` (what other products rely on) and `website/packages/cms-contracts` (website-only); `shared/contracts` became `elearning/packages/elearning-contracts`; `shared/config` was copied into each product's `config/`; `platform/edge` became `website/deploy/edge` (the website stack runs the edge for both products); `platform/scripts` was copied into each product's `scripts/`; `platform/observability` became `elearning/deploy/observability`. All moves preserve history.
3. **The provider owns each contract.** The catalog API (`/api/v1`, `openapi/v1.yaml`) and the enroll-link format: e-learning. The lead/waitlist webhook payload and the brand tokens: website. A product uses the other's contract package **only in its `tests/contracts`** (the e-learning frontend may also use `@zgate/brand-ui`), installed as a `file:` dependency so each workspace still installs on its own. Each workspace's dependency-cruiser rules enforce this, and that nothing imports `legacy/`.
4. **Breaking changes fail before they merge.**
   - Each contract package has a compatibility test against an agreed baseline (`compat/published.json`) that fails when a schema removes or renames a field or narrows a type. `oasdiff breaking` compares `openapi/v1.yaml` with `main` on every e-learning pull request; `/api/v1` accepts additive changes only.
   - A pull request that changes a contract package also runs the other product's `tests/contracts` against it ("Consumer contracts" jobs).
   - The customer journey across both products (`elearning/e2e/journeys`, `journey.yml`) must pass against staging before any production deploy; its read-only steps run against production every 10 minutes (`synthetic.yml`) once the production URLs are configured. Unbuilt steps are `test.fixme`, never faked.
5. **No package registry.** Nothing is published to GitHub Packages, so no cross-repository token, registry credentials or Renovate are needed. If a product moves to its own repository later, its contract packages can be published as they are (the extraction was rehearsed on 2026-10-16).

## Consequences

- Each product installs, builds, tests and deploys without the other; an 8 GB machine loads one product's toolchain at a time.
- `config/` and `scripts/` exist twice. Changes to one copy are deliberate and reviewed per product; they are presets and helpers, not product code.
- A contract change is atomic in one pull request, and both sides' tests run on it, so there is no version skew between producer and consumer.
- The edge proxy lives with the website. Before the e-learning platform goes live, its services must be reachable from the website's production stack (shared Docker network), and the API must trust exactly one proxy hop (finding N-1).
