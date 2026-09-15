# ADR-002: One Shared Client Record Across Divisions (Default Pending Business Confirmation)

**Status:** Accepted as a default, pending business confirmation — see the open item this ADR responds to

## Context

`docs/business/OPEN_BUSINESS_QUESTIONS.md` #4 leaves genuinely open whether a Client engaged by more than one division should have one shared record all divisions see, or separate per-division records linked only by the Master SLA. No approved business document resolves this either way.

## Decision

Build toward **one Client record, referenced by any number of division-specific Engagements** (`docs/architecture/DOMAIN_ARCHITECTURE.md` §2, `docs/architecture/DATA_ARCHITECTURE.md`'s `clients`/`engagements` schema).

## Why this default, not the alternative

- It's the cheaper, more consistent design to build toward now.
- It's trivially compatible with a "siloed" business answer later: if the business decides divisions should *not* see each other's engagement data for the same client, that's an authorization rule each division module already enforces independently (`MODULE_ARCHITECTURE.md`) — no schema change needed, just a stricter access check.
- The reverse is not true: if this architecture had built fully siloed per-division Client records and the business later confirmed they should be unified, that would require a real data migration and record-matching exercise — a materially more expensive correction.

## Consequences

- The schema and module boundaries do not block either business answer, but they're optimized for the lower-cost correction path.
- **This is explicitly not a final business decision** — it's an engineering default chosen to minimize cost if the business answers either way. When `docs/business/OPEN_BUSINESS_QUESTIONS.md` #4 is actually resolved by the Managing Director, this ADR's status should be updated to reflect the confirmed answer, not left as an assumption indefinitely.
