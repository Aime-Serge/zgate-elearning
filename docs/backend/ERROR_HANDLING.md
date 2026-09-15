# Z-GATE Digital Platform — Error Handling

Extends `docs/architecture/API_ARCHITECTURE.md`'s error-response convention into a full taxonomy, and ties it to `docs/backend/BACKEND_ARCHITECTURE.md`'s observability approach.

## Response shape (restated, binding)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Enter a valid phone number.", "correlationId": "..." } }
```

- `message` is always plain language, matching the brand voice rule already binding on every other surface (`docs/marketing/MESSAGING_FRAMEWORK.md`) — never a raw exception string, stack trace, or database error message.
- `correlationId` lets a user report "this failed" and a developer find the exact server-side log entry — without the response itself containing anything internal.
- `code` is a stable, machine-readable identifier the frontend can branch on (e.g., to highlight a specific form field) without parsing `message` text.

## Error taxonomy

| Code | HTTP status | When | Example |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema rejects the input | Missing required field, malformed email |
| `UNAUTHENTICATED` | 401 | No valid session | Expired/missing session cookie |
| `FORBIDDEN` | 403 | Valid session, wrong role or failed object-level check | A `client` calling a staff-only route; a staff member not assigned to the requested client |
| `NOT_FOUND` | 404 | Resource doesn't exist, **or exists but the caller shouldn't know that** | A compliance item ID that doesn't exist, or belongs to a client this staff member isn't assigned to (see note below) |
| `CONFLICT` | 409 | The request is well-formed but violates current state | Marking an already-completed compliance item complete again; converting an already-converted lead |
| `RATE_LIMITED` | 429 | Rate limit exceeded (`API_SECURITY.md`) | Repeated login attempts |
| `INTERNAL_ERROR` | 500 | Unexpected failure | Database connection failure |

### A deliberate choice: `NOT_FOUND`, not `FORBIDDEN`, for unauthorized-but-real object access

When a staff member requests a compliance item that exists but belongs to a client they're not assigned to, the response is `404`, not `403`. **Why:** a `403` confirms the resource exists and is just off-limits — for a small, high-blast-radius system (`docs/security/THREAT_MODEL.md`'s risk-summary observation that one account's compromise exposes the whole client base), even confirming existence of another client's records to an unauthorized caller is unnecessary information disclosure. `404` reveals nothing. This applies specifically to the object-level check failing; a role-level failure (a `client` role hitting a staff-only endpoint entirely) still returns `403`, since which endpoints exist isn't sensitive the same way which specific records exist is.

## Validation errors specifically

Zod's validation output is transformed into field-level messages before reaching the client:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please fix the highlighted fields.",
  "fields": { "email": "Enter a valid email address." }, "correlationId": "..." } }
```

Matches `docs/frontend/STATE_MANAGEMENT.md`'s form-error-handling expectation directly — the frontend doesn't need to re-derive field-level messages from a generic error string.

## Logging vs. client-facing separation

- **Every error is logged server-side** with full detail (stack trace, request context, correlation ID) — this detail never crosses into the HTTP response.
- **`INTERNAL_ERROR` responses are maximally generic** ("Something went wrong. Please try again.") — the more detail an error message contains, the more it risks revealing implementation detail useful to an attacker (`docs/security/SECURITY_REQUIREMENTS.md` V7).
- **Errors involving Confidential data trigger the same audit-adjacent logging** as a successful access would have (an attempted, failed access to a client's compliance items is itself a security-relevant event worth having in the logs, even though it's not written to `access_log` as a successful access — a distinction implementation should make deliberately, not blur).

## What this document does not do

It does not implement Fastify's actual error-handler hook or Zod-to-response transformation code — implementation-phase work built against this taxonomy. It does not define error handling for V1/V2 endpoints beyond confirming they follow the same taxonomy when built.
