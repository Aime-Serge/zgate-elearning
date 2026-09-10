# ADR-006: No EBM/Billing System Integration

**Status:** Accepted

## Context

The operating brief's core domain checklist includes "Billing." Z-GATE's own approved documents describe a specific, existing operational relationship: invoicing happens through a certified third-party EBM (Electronic Billing Machine) system, per RRA requirements (`docs/business/BUSINESS_RULES.md` §1, SLA Clause 4), and Z-GATE's own Risk Register explicitly plans to "maintain relationships with 2+ certified EBM software providers" (`docs/discovery/RISKS.md`) rather than build its own.

## Decision

The platform does not build a billing/invoicing system, and does not integrate with any specific EBM provider's API. This is an explicit non-goal (`docs/product/PRD.md` §2).

## Why

- Building EBM-compliant billing software is a specialized, regulated undertaking (RRA certification requirements) entirely outside this platform's actual scope — Z-GATE's own business strategy is to use an existing certified provider, not become one.
- No approved document describes any current pain point with the existing EBM relationship that a custom integration would solve.
- Attempting this would be the clearest possible violation of "avoid premature complexity" this architecture phase is bound by.

## Consequences

- Positive: avoids a large, regulated, unnecessary scope expansion.
- Negative: no in-platform visibility into invoice/payment status at MVP — a client checking their Client Portal cannot see "has this been paid" there. This is an accepted gap, not an oversight: if it becomes a real pain point later, the smallest fix is a lightweight invoice-status *record* (was this client invoiced, is it marked paid) populated manually or via a future EBM-provider API if one becomes available — not a full billing system. Not scoped now; noted for V2+ consideration only if a real need is demonstrated.
