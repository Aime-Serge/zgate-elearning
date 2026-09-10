# ADR-005: Self-Hosted Authentication Within the Monolith

**Status:** Accepted for MVP; revisit at V2 if user count/complexity grows materially

## Context

`docs/product/PRODUCT_BACKLOG.md` EPIC-04 needs two roles (staff, client) authenticated at MVP. A third-party managed identity platform (Auth0-style, or similar) is a common default for modern applications, but carries a real recurring cost.

## Decision

Implement authentication (credential storage, session/token issuance, password reset) within the `identity` module of the monolith itself (`docs/architecture/MODULE_ARCHITECTURE.md`), backed by hashed credentials in PostgreSQL — not a third-party managed identity platform.

## Why

- **Cost:** the Financial Model's shared tools/hosting budget (`docs/architecture/DEPLOYMENT_ARCHITECTURE.md`'s cost baseline) does not clearly accommodate a recurring per-user or per-tenant identity-platform fee at MVP scale, and most managed IdPs charge in a way that's poorly suited to a very small, cost-sensitive user base.
- **Scale:** MVP has two roles and a handful of real users — the complexity a managed IdP solves (SSO across many applications, enterprise federation, large-scale user management) isn't a problem this platform has yet.
- **Data residency:** keeping authentication data in the same Rwanda-resident database (pending ADR-004) as everything else avoids adding a second, potentially non-Rwanda-hosted, system holding personal data (email addresses, at minimum) to reason about under the Data Privacy Policy.

## Alternatives considered

- **Third-party managed IdP:** rejected for MVP on cost and proportionality grounds — not rejected forever. If the platform's user base and role complexity grow significantly (many staff across all four divisions, external partner logins, etc. — a V2+ consideration at the earliest), revisit this decision against the cost/benefit at that scale.

## Consequences

- Positive: no new recurring vendor cost, one less external data processor to account for in the Data Privacy Policy's sub-processor assessment (§8).
- Negative: the `identity` module must be built and maintained to a genuinely secure standard (proper password hashing, session handling, no home-grown cryptography) — this is a real engineering responsibility, not a shortcut. Standard, well-reviewed libraries/patterns must be used, not custom-built cryptographic primitives, regardless of the "self-hosted" framing.
