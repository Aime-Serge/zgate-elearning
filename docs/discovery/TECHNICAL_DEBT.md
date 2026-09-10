# Technical Debt

## Code-level technical debt

**FACT:** None. Zero lines of application code exist, so there is no accumulated shortcut, duplication, missing validation, or architectural compromise to inventory.

**RECOMMENDATION:** Treat this literally as an asset, not a null result — Z-GATE gets to make its first-ever technology decisions (stack, data model, auth, hosting region) against a fully-formed set of business/compliance requirements instead of retrofitting them onto existing code. The discipline in `TECHNOLOGY_STACK.md`'s "constraints" section (data residency, EBM billing, encryption/MFA baselines) should be treated as non-negotiable inputs to the very first architecture decision, not a later hardening pass — retrofitting Rwanda data-residency and EBM-compliant billing into an already-built system would itself become technical debt.

## Process / documentation debt (FACT — this is real and current)

Several approved-in-principle documents are still in draft/unsigned status, which is not "code debt" but is debt in the sense that future systems (and this audit) are being built on documents that could still change:

- Data Privacy & Security Policy — Draft, pending Managing Director approval and NCSA registration.
- HR Policy Manual — Draft, pending Managing Director approval.
- Client SLA Template — template with unfilled brackets (`[12]` months, `[15]` days payment terms, `[30]` days notice, etc.) not yet finalized per engagement, and explicitly marked as requiring licensed Rwandan legal review before any client signs it.
- RDB activity-code amendment — recommended, not filed; Managing Director approval checkbox blank.

**RECOMMENDATION:** Before any of these documents' terms are hard-coded into a future system (e.g., a client portal that displays "15-day payment terms" or an SLA-tracking module that enforces specific turnaround numbers), confirm the document has moved from draft to signed/approved status, since the bracketed placeholders indicate these figures are not yet finalized even at the business level.

## Registry/legal debt with public visibility

See `BUSINESS_ALIGNMENT.md` and `RISKS.md` — 5 of 21 registered RDB activity codes are recommended for removal but the removal has not been filed. This is unrelated to code but is a real, currently-live piece of "debt" between the public record and the brand the company presents.
