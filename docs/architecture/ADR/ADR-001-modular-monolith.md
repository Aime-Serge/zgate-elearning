# ADR-001: Modular Monolith over Microservices

**Status:** Accepted

## Context

The operating brief for this architecture phase explicitly instructs: "Default to a modular monolith unless there is a demonstrated reason for microservices." Independent of that instruction, the platform's actual scale (per `docs/discovery/` and `docs/business/`) is: one company, one live client-facing division (Advisory), a single-digit real client count as of Day 22 of the 90-day plan, and a contract/intern-level Junior Developer as the only dedicated engineering hire (`docs/business/ROLE_MATRIX.md`).

## Decision

Build one deployable application, internally organized into bounded modules (`docs/architecture/MODULE_ARCHITECTURE.md`) mapping to real business domains. Modules communicate via in-process calls, never network calls, and never reach into each other's data directly.

## Alternatives considered

- **Microservices from day one:** rejected. No demonstrated need exists (single small team, low traffic, no independent-scaling requirement for any domain). Would introduce service discovery, distributed transaction handling, and multi-deployment CI/CD complexity the team and budget (`docs/business/BUSINESS_RULES.md` §8) cannot support.
- **A single unstructured application (no internal module boundaries):** rejected — would make the codebase harder to reason about as it grows past MVP, and would make any future extraction (if ever genuinely needed) far more expensive than if boundaries exist from the start.

## Consequences

- Positive: cheap to host, simple to deploy, easy for a small/junior team to reason about, testable as one coherent system.
- Negative: if any single domain ever needs independent scaling or a different technology, extracting it later requires real work — mitigated by keeping module boundaries clean from the start (`MODULE_ARCHITECTURE.md`'s "extraction points" section).
- This decision should be revisited only if a specific, demonstrated need arises (e.g., a domain with genuinely different scaling characteristics from the rest of the system) — not on a schedule, and not speculatively.
