# Z-GATE Digital Platform — API Architecture

## Style: REST over JSON

Chosen over GraphQL for this phase's scale: REST is simpler to implement, test, and secure with a small/junior team (`docs/business/ROLE_MATRIX.md` — the Junior Developer is a Month-3, contract/internship hire), has no additional query-complexity or N+1-cost surface to reason about, and the platform's data-fetching needs (a handful of screens per `docs/design/PAGE_SPECIFICATIONS.md`, each with a well-known, fixed shape) don't exhibit the flexible-query problem GraphQL exists to solve. Revisit only if a real, demonstrated need for flexible client-driven queries emerges — not before.

## Who consumes the API

- **Client Portal, Staff Portal, Admin (V1) frontends** — the primary, and at MVP the *only*, consumers.
- **No public API** exists or is planned — no third party integrates with Z-GATE's platform at any current phase (`SYSTEM_CONTEXT.md` confirms no external system integration is scoped).
- **The public website** is largely static content (`docs/design/PAGE_SPECIFICATIONS.md`) and only calls the API for the Contact/lead-capture form submission (FEAT-02.1) — everything else on that surface can be rendered without hitting the authenticated API at all.

## Authentication & authorization on every request

- Every authenticated endpoint requires a valid session/token issued by the `identity` module (`MODULE_ARCHITECTURE.md`).
- Every endpoint enforces authorization **at the module boundary that owns the data** — e.g., a request for a Client's compliance status is checked by the `advisory` module against the caller's role and Client-ownership, not by a shared central gatekeeper (`MODULE_ARCHITECTURE.md`'s internal communication rules).
- A Client-role caller can only ever act on their own Client record — enforced server-side on every request, never assumed from a client-supplied ID alone (a basic but critical rule, given this platform handles tax/financial data).
- A Staff-role caller's access is scoped to their division per `docs/business/ROLE_MATRIX.md` §4's access matrix.

## Versioning

- A single, unversioned API (`/api/...`) at MVP — introducing `/v1/`, `/v2/` prefixes ahead of any actual breaking-change need is premature process for a system with exactly one consumer (its own frontend, deployed together with the backend). Revisit if/when a second, independently-versioned consumer ever exists (none is planned).

## Error handling conventions

- Structured JSON error responses (`{ error: { code, message } }`), with `message` written in the same plain-language voice `docs/marketing/MESSAGING_FRAMEWORK.md` and `docs/design/COMPONENT_SPECIFICATION.md`'s Error States require — no raw stack traces or technical error strings reach the frontend, consistent with the brand voice rule already binding on every other surface.
- HTTP status codes used conventionally (400 validation, 401 unauthenticated, 403 unauthorized, 404 not found, 429 rate-limited, 500 unexpected) — nothing exotic, so a junior developer can reason about failures without a custom convention to learn first.

## Rate limiting

- Basic rate limiting on unauthenticated endpoints (the lead-capture form, login attempts) to prevent abuse — proportionate to actual risk at this scale, not an enterprise API-gateway-grade system. A simple in-process or reverse-proxy-level limiter is sufficient; no dedicated rate-limiting service is justified yet.

## Representative MVP endpoint groups (illustrative — not a full API spec, which is an implementation-phase artifact)

| Group | Backed by module | Example |
|---|---|---|
| `/api/auth/*` | `identity` | login, logout, session check |
| `/api/leads/*` | `crm` | list, create (manual), convert-to-client |
| `/api/public/contact` | `crm` | unauthenticated lead-capture form submission |
| `/api/clients/*` | `clients` | list (staff), get own (client role) |
| `/api/advisory/*` | `advisory` | client compliance list, mark-complete, deliverables |
| `/api/reporting/*` | `reporting` | Advisory summary, lead pipeline summary |

## What this document does not do

It does not provide a complete OpenAPI/Swagger specification, exact request/response payload shapes, or a specific web framework's routing implementation — those belong to the backend architecture phase and actual implementation, built against the module boundaries and rules this document sets.
