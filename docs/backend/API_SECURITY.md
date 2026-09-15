# Z-GATE Digital Platform — API Security

Ties `docs/security/SECURITY_REQUIREMENTS.md` and `docs/security/THREAT_MODEL.md` to concrete backend implementation. This document doesn't set new policy — it's where that policy becomes code-level practice.

## Rate limiting — specifics

| Endpoint class | Limit posture | Why |
|---|---|---|
| `POST /api/auth/login` | Strict — per-IP and per-email, with progressive backoff | Credential-stuffing target (`docs/architecture/THREAT_MODEL.md` §3), the platform's highest-blast-radius single control |
| `POST /api/public/contact` | Strict per-IP | Unauthenticated, public, spam/DoS-prone (`docs/architecture/THREAT_MODEL.md` §1) |
| `POST /api/documents` (upload) | Moderate, size-aware | Prevents storage-abuse via repeated large uploads |
| Every other authenticated endpoint | Generous, standard | Real MVP user count is small (`docs/product/PRODUCT_KPIS.md`'s own targets); aggressive limits here would cost more in false-positive friction than they'd prevent in realistic abuse at this scale |

Implemented via a single Fastify rate-limiting plugin applied per-route with different configs — not a separate bespoke mechanism per endpoint.

## Input validation as the first line of defense

Every request body, query param, and path param is validated against its Zod schema (`API_CONVENTIONS.md`'s catalog) **before any handler logic runs** — Fastify's schema-validation hook rejects malformed input at the framework level, so a route handler never has to defensively re-check "is this actually a string" itself. This closes `docs/architecture/THREAT_MODEL.md` §2's injection concern at the type/shape level; parameterized queries (Kysely, by construction — it never string-concatenates SQL) close it at the query level.

## Output shaping — never expose more than the endpoint's purpose requires

Every endpoint in `API_CONVENTIONS.md` explicitly enumerates its output fields — there is no route that does `SELECT *` and serializes the whole row. This is the concrete implementation of this phase's own instruction: "sensitive information must never be unnecessarily exposed." Concretely:
- `users.password_hash` is never in any response, from any endpoint, under any role.
- `clients.tin` appears only where a specific compliance workflow needs it (never in list views, never in the client's own self-service view).
- `deliverables.file_ref` (the raw storage pointer) is never returned — download is mediated through a dedicated, access-checked endpoint (`API_CONVENTIONS.md`'s `GET /api/documents/:id/download`).
- `access_log` itself is never exposed via any MVP endpoint — the quarterly review process (`docs/security/RBAC_SECURITY_MODEL.md`) is a manual query against the database directly until FEAT-12.2 (V2) builds a proper admin UI for it, and even then it stays `admin`-only.

## Session/cookie security

- httpOnly, `Secure`, `SameSite=Lax` (or `Strict` where it doesn't break the login redirect flow) cookies — restated from `docs/frontend/FRONTEND_SECURITY.md` because the backend is the party that actually sets these attributes.
- Session tokens are cryptographically random, regenerated on login (prevents fixation, `docs/security/SECURITY_REQUIREMENTS.md` V3), and invalidated server-side on logout — a logged-out session cookie, if somehow replayed, is rejected because the server-side session record is gone, not because the client "forgot" it.

## CSRF protection

Since sessions are cookie-based, every state-changing endpoint (`POST`/nothing-idempotent) requires a CSRF token issued at login and validated on each such request — the backend half of `docs/frontend/FRONTEND_SECURITY.md`'s CSRF requirement. `GET` endpoints (read-only) don't require it, consistent with standard CSRF-protection scope.

## Secrets handling

- Database credentials, session-signing secrets, and any future third-party API key live in environment variables (`.env`, per `docs/devops/DEVELOPMENT_ENVIRONMENT.md` — never committed) — the backend process reads them at startup, never logs them, never includes them in any error response or debug output.
- The existing CI security-scan job (`npm audit` + `gitleaks`, `.github/workflows/ci.yml`) already covers this codebase's entire dependency tree and commit history — no separate backend-specific secrets-scanning pipeline is introduced.

## Password storage

Restated because it's the one rule this platform cannot afford to get wrong: Argon2id or bcrypt (final library choice at implementation time), never a reversible or fast-hash scheme (`docs/database/DATA_SECURITY.md`, `docs/security/SECURITY_REQUIREMENTS.md` V2).

## Field-level encryption for `clients.tin`

The highest-sensitivity field in the schema (`docs/database/DATA_SECURITY.md`) is encrypted at the application layer before being written, and decrypted only when a specific authorized endpoint actually needs to return it — meaning even a full database dump doesn't expose TINs in plaintext, a materially stronger guarantee than disk-level encryption alone provides.

## What this document does not do

It does not select a specific rate-limiting plugin, CSRF library, or encryption library by name/version — implementation-phase choices, installed for real and verified working before being committed, per the pattern `docs/devops/DEVELOPMENT_ENVIRONMENT.md` already established.
