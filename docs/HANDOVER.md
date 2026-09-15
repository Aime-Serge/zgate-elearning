# Z-GATE Digital Platform — Production Handover

This is the capstone document of this engagement — the one a new owner, a new engineering lead, or an auditor should read start to finish before touching anything else. Every other document in `docs/` (over a dozen phases' worth, from initial business discovery through an independent security audit and a commercial-readiness review) supports the claims made here; none of them are re-argued from scratch.

## What is being handed over

A modular-monolith digital platform for Z-GATE LTD's four business divisions (Advisory, Academy, Tech, Data): a public marketing website, a lead-capture/CRM pipeline, a staff-facing operations platform, an authenticated client portal, and a full Academy course/cohort/enrollment workflow. Fastify + Kysely + PostgreSQL backend, Next.js frontend, both independently deployable. See `docs/SYSTEM_OVERVIEW.md` and `docs/ARCHITECTURE.md` for the technical detail.

## Ownership

| Area | Owner today |
|---|---|
| Business/product decisions | Managing Director |
| DPO responsibilities | Managing Director (role unfilled — by default, not by design) |
| Engineering | One contract/intern developer, per every phase's own stated team-size assumption |
| Repository administration | Whoever holds `github.com/Aime-Serge/z-gate` — not formally assigned in any approved document reviewed this engagement |

**This is a genuinely small-team handover**, and every architectural and process decision in this codebase — self-hosted auth over a paid identity provider, no container orchestration, no dedicated security tooling, manual/lightweight incident response — was made deliberately proportionate to that reality, not as a corner cut. If team size grows, several of those decisions (see `docs/ROADMAP.md`'s V1 section and `docs/CHANGE_MANAGEMENT.md`'s review-process gap) should be revisited, not assumed to still be correct at a different scale.

## Support process

No formal support ticketing exists. The established channel, consistently used throughout this engagement for incidents, is direct contact with the Managing Director (WhatsApp/call) — proportionate to team size, not a placeholder for something more formal that was never built. See `docs/INCIDENT_RESPONSE.md`.

## Known limitations — the complete, honest list

Grouped by how serious they actually are, not in the order they were found:

### Blocks production deployment entirely (business/compliance, not engineering)

- **Hosting region / data residency undecided** (`ADR-004`) — no cloud provider or region is chosen; this single decision also blocks backups, monitoring, and staging provisioning.
- **NCSA registration** — Pending.
- **DPO** — unfilled.

### Blocks release approval (found by the independent security audit and commercial-readiness review, both run *after* the release-candidate phase — unresolved as of this handover)

- **No client account-provisioning path exists anywhere in the product.** A converted lead becomes a company record, never a login. This is the platform's single most consequential gap — it sits directly across the path from "we made a sale" to "the client can actually use what they paid for."
- **The CRM leads module has zero audit logging**, in direct, provable violation of this platform's own documented Confidential-data-handling policy.
- **The admin account-deactivation endpoint has no reactivation path and no lockout guard** — a real, irreversible-without-database-access risk on the platform's own incident-containment tool.

### Real, tracked, non-blocking

- `staff_advisory` and `admin` are authorization-equivalent for every client's data (fine today — one Advisory Associate exists; a real gap the day a second is hired).
- No per-account session revocation (force-logout one specific session without logging out everyone else) — sessions are stateless by design.
- Frontend CSP still allows `'unsafe-inline'` — flagged for explicit owner sign-off since the original security review, never resolved.
- Backend CSP's actual behavior doesn't match its own code comment's stated intent (Helmet directive-merging).
- No automated accessibility testing, no end-to-end browser test suite, no cross-browser testing, no load testing.
- No monitoring, alerting, or backup mechanism provisioned (blocked on the hosting decision above, not separately missing).
- Two cosmetic/low-impact functional defects (`docs/qa/DEFECTS.md` D-02, D-03).
- Several marketing/UX polish items: homepage headline sequencing, About page's missing CTA, no privacy-policy link anywhere on the public site, footer omits phone/WhatsApp.
- Version numbers (`package.json`) are still unset scaffold defaults in both packages.

**Zero of these are the kind of defect that was hidden or discovered by accident** — every one was found by a deliberate review pass whose entire purpose was to find exactly this, and every one is written down in the specific document that found it. That is the actual state of this platform's engineering discipline, and it's the thing worth preserving most in whatever comes next.

## Repositories

`github.com/Aime-Serge/z-gate` — public, two branches (`develop` integration, `main` release), one open pull request (`develop` → `main`, currently CI-green, not yet merged).

## Sign-off

This handover accurately represents the system's state as verified on the date of this document. It does not certify the platform as production-ready — see "Blocks release approval" above. It certifies that everything claimed elsewhere in `docs/` was checked, not assumed, before being included here.
