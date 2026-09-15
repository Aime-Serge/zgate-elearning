# ADR-003: TypeScript Across Frontend and Backend

**Status:** Accepted

## Context

No prior phase had chosen a programming language — `docs/discovery/TECHNOLOGY_STACK.md` explicitly found "no technology decisions" existed as of Phase 0. This phase needs a concrete direction to build the rest of the architecture against.

## Decision

TypeScript, for both frontend and backend.

## Why (sourced, not arbitrary)

- The Junior Developer job description — the platform's actual, named first engineering hire — explicitly lists "Working proficiency in a modern web stack (e.g., JavaScript/TypeScript, a common backend framework)" as the expected qualification (`docs/business/BUSINESS_RULES.md` §7 references this role; full text in HR Policy Manual, Part 2). This is a real signal from the business's own hiring plan, not an architect's personal preference.
- Kigali's documented developer talent pool (kLab, Andela, referenced in `docs/business/BUSINESS_ALIGNMENT.md`'s market context) is realistically stronger in JavaScript/TypeScript than in less common alternatives, which matters for hiring the Month-3 role and any future replacement/expansion of the team.
- A single language across frontend and backend reduces context-switching cost for a one-person (or very small) engineering team — directly serves the "maintainable" architectural requirement.
- Compile-time type checking gives a small, junior-skewed team a meaningful safety net against a category of bugs that would otherwise only surface in production — proportionately more valuable for this team than for a large, senior engineering org with heavier review processes.

## Alternatives considered

- **Python** (also available locally per `docs/discovery/TECHNOLOGY_STACK.md`'s tooling inventory): rejected as the primary application language — no business signal (job descriptions, existing skill) points to it, though it remains a reasonable choice for any future Data/BI-heavy tooling (V2 `data-service` module) if that module's needs diverge enough to justify a different language for that specific piece — not decided now, noted as a possibility.
- **A different typed language** (Go, Java, etc.): rejected — no signal from the business's hiring plan or local talent market supports the switch, and would increase hiring difficulty for the Month-3 role and beyond.

## Consequences

- Positive: aligns with the actual hiring plan, reduces onboarding friction for the named first hire, one language to secure/review/maintain.
- Negative: none significant at this scale — TypeScript/JavaScript's ecosystem is mature enough that this isn't a meaningful constraint on capability.
