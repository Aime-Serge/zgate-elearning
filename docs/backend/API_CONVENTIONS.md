# Z-GATE Digital Platform — API Conventions & Endpoint Catalog

## General conventions (extends `docs/architecture/API_ARCHITECTURE.md`, doesn't repeat it)

- Base path `/api`, single unversioned API (already decided — one consumer, this platform's own frontend).
- JSON request/response bodies; standard HTTP methods and status codes (`docs/architecture/API_ARCHITECTURE.md`'s convention).
- **No pagination at MVP.** Every list endpoint returns its full result set — real data volumes are small (single-digit-to-low-double-digit clients/leads at Day 90, per `docs/business/BUSINESS_REQUIREMENTS.md`'s own targets). Pagination is real, necessary work to add before the platform reaches a genuinely large dataset — not built speculatively now. **Revisit at V1/V2** as Academy enrollment and Data-service records grow the realistic row counts.
- **A security-by-design pattern used throughout this catalog: client-role endpoints never accept a resource ID as a parameter where the resource is "their own."** `GET /api/clients/me`, not `GET /api/clients/:id` for a client-role caller — the ID is derived server-side from the authenticated session (`users.client_id`), so there is no parameter for a manipulated or malicious request to tamper with in the first place. This directly answers `docs/security/THREAT_MODEL.md`'s Critical-rated broken-object-level-authorization finding at the API-shape level, not just via a runtime check.
- **Sensitive fields are never included in a response unless the specific endpoint's purpose requires them.** `users.password_hash` is never serialized, ever, by any endpoint. `clients.tin` appears only in staff-facing detail responses that need it for compliance work — never in list responses, never in the client's own self-service response (a client doesn't need their own TIN echoed back to them to see their compliance status).

## Endpoint catalog

Every endpoint below states: **Auth** (must the caller be authenticated) · **Authz** (which role(s), and any object-level check) · **Input** (Zod schema shape, validation rules) · **Output** (response shape, explicit sensitive-field exclusions) · **Errors** · **Audit** · **Rate limit**.

---

### `POST /api/auth/login`
- **Auth:** none required (this is how auth begins)
- **Authz:** n/a
- **Input:** `{ email: string (valid email format), password: string (min 1) }`
- **Output:** `{ role, division?, clientId? }` + sets an httpOnly session cookie (`docs/frontend/FRONTEND_SECURITY.md`) — **never returns `password_hash` or any password-related value**
- **Errors:** `401` for any failure — wrong email, wrong password, deactivated account — with an identical, non-distinguishing message (`docs/security/SECURITY_REQUIREMENTS.md` V2)
- **Audit:** logged (`action: 'login_success'` or `'login_failure'`) — this is one of the few actions logged regardless of outcome, since failed-login patterns are themselves a security signal
- **Rate limit:** aggressive — per-IP and per-email backoff (`docs/architecture/THREAT_MODEL.md` §3's credential-stuffing concern)

### `POST /api/auth/logout`
- **Auth:** required
- **Authz:** any authenticated caller, own session only
- **Input:** none
- **Output:** `{ success: true }`, clears the session cookie
- **Errors:** `401` if no valid session exists
- **Audit:** logged (`action: 'logout'`)
- **Rate limit:** standard (low value target for abuse)

### `GET /api/auth/session`
- **Auth:** required
- **Authz:** any authenticated caller, own session only
- **Input:** none
- **Output:** `{ role, division?, clientId? }` — same shape as login's success response, used by the frontend to know what to render post-refresh
- **Errors:** `401` if no valid session
- **Audit:** not logged — reading your own session is not an access to Confidential data (`docs/database/DATA_SECURITY.md`'s "not logged" exception)
- **Rate limit:** standard

---

### `POST /api/public/contact`
- **Auth:** none (public lead capture — FEAT-01.2/02.1)
- **Authz:** n/a
- **Input:** `{ name: string (1-200 chars), contact: string (1-200 chars), statedNeed?: string (max 2000 chars) }`, `channel` set server-side to `'website'`
- **Output:** `{ success: true }` — deliberately minimal, no lead ID or internal detail returned to an unauthenticated caller
- **Errors:** `400` validation failure (plain-language field errors); `429` if rate-limited
- **Audit:** not logged (no Confidential data involved yet — a lead isn't a Client)
- **Rate limit:** aggressive per-IP (`docs/architecture/THREAT_MODEL.md` §1's form-spam/DoS concern)

### `GET /api/leads`
- **Auth:** required
- **Authz:** `staff_marketing`, `staff_advisory`, `admin` (`docs/security/RBAC_SECURITY_MODEL.md`'s permission matrix)
- **Input:** optional query params `status`, `channel` (both validated against the enum values)
- **Output:** array of `{ id, name, contact, channel, statedNeed, status, createdAt, convertedClientId? }`
- **Errors:** `401`/`403`
- **Audit:** not logged (lead data is pre-Client, lower sensitivity — `docs/database/DATA_SECURITY.md`)
- **Rate limit:** standard

### `POST /api/leads`
- **Auth:** required
- **Authz:** `staff_marketing` (manual non-web lead entry, FEAT-02.2)
- **Input:** same shape as `/api/public/contact` plus a required `channel` (any value except `'website'`)
- **Output:** `{ id, ...lead fields }`
- **Errors:** `400`, `401`/`403`
- **Audit:** not logged (same reasoning as list)
- **Rate limit:** standard

### `POST /api/leads/:id/convert`
- **Auth:** required
- **Authz:** `staff_advisory`, `admin` — plus the lead must exist and not already be `'converted'` (business-rule check, not just a role check — `docs/database/ENTITY_RELATIONSHIPS.md`'s check constraint is the last line of defense, this is the first)
- **Input:** `{ legalName: string, tin?: string, registeredAddress?: string, primaryContactName?: string, primaryContactChannel?: string }` — the new Client's details
- **Output:** `{ clientId, leadId }`
- **Errors:** `400` (lead already converted, or validation failure), `401`/`403`, `404` (lead not found)
- **Audit:** logged (`action: 'lead_converted'`, `resource_type: 'client'`) — this action creates a new Confidential-classified record
- **Rate limit:** standard

---

### `GET /api/clients`
- **Auth:** required
- **Authz:** `staff_advisory` (their assigned clients), `admin` (all) — the query itself is scoped by caller identity server-side, not by a client-supplied filter
- **Input:** none
- **Output:** array of `{ id, legalName, nextDueDate?, status }` — **deliberately excludes `tin`, `registeredAddress`, contact details** from the list view; a summary list doesn't need the most sensitive fields, only the detail view does
- **Errors:** `401`/`403`
- **Audit:** logged (`action: 'view_client_list'`) — list-level access to Confidential-adjacent data is still logged, per `docs/database/DATA_SECURITY.md`
- **Rate limit:** standard

### `GET /api/clients/me`
- **Auth:** required
- **Authz:** `client` role only — no ID parameter exists (see the security-by-design pattern above)
- **Input:** none
- **Output:** `{ id, legalName, primaryContactName }` — **excludes `tin`** even for the client's own record; a client checking their own status doesn't need their TIN echoed back, and minimizing what's ever transmitted reduces exposure if a session is ever compromised (`docs/security/DATA_PROTECTION_REQUIREMENTS.md`'s minimization principle applied at the response-shaping level)
- **Errors:** `401`, `403` if called by a non-`client` role (staff use `GET /api/clients` instead)
- **Audit:** logged (`action: 'view_own_client_record'`)
- **Rate limit:** standard

---

### `GET /api/advisory/compliance-items`
- **Auth:** required
- **Authz:** dual-mode by role — `client`: returns only the caller's own engagement's items, no parameter accepted or needed; `staff_advisory`/`admin`: requires a `clientId` query param, checked against that staff member's assignment (`docs/security/RBAC_SECURITY_MODEL.md`'s object-level rule) before returning anything
- **Input:** `clientId?` (required for staff, forbidden/ignored for `client` role — enforced server-side, not just "optional")
- **Output:** array of `{ id, type, dueDate, completedAt? }` — sorted by `dueDate` ascending among pending items (`docs/product/PRODUCT_BACKLOG.md` FEAT-06.1); **"overdue" is computed once here, server-side**, and included as a boolean field (`isOverdue`) so the frontend never recomputes it independently (`docs/frontend/COMPONENT_ARCHITECTURE.md`'s single-source-of-computation rule)
- **Errors:** `400` (staff omitted required `clientId`), `401`/`403` (staff not assigned to that client)
- **Audit:** logged (`action: 'view_compliance_items'`)
- **Rate limit:** standard

### `POST /api/advisory/compliance-items/:id/complete`
- **Auth:** required
- **Authz:** `staff_advisory` (assigned to the item's engagement), `admin` — object-level check: the item's `engagement.client_id` must be in this staff member's assignment
- **Input:** none beyond the ID in the path (no client-supplied "completed" timestamp accepted — the server sets `completed_at = now()`, closing any possibility of a backdated/falsified compliance record, per `docs/security/SECURITY_REQUIREMENTS.md` V11's server-side business-logic validation)
- **Output:** `{ id, type, dueDate, completedAt }`
- **Errors:** `401`/`403`, `404` (item not found or not assigned to caller), `409` (already completed)
- **Audit:** logged (`action: 'complete_compliance_item'`) — **in the same transaction as the write itself** (`BACKEND_ARCHITECTURE.md`'s transaction rule)
- **Rate limit:** standard

---

### `GET /api/documents`
- **Auth:** required
- **Authz:** same dual-mode pattern as compliance-items — `client`: own engagement only, no parameter; `staff_advisory`/`admin`: `clientId` required, assignment-checked
- **Input:** `clientId?` (same rule as above)
- **Output:** array of `{ id, type, uploadedAt }` — **excludes `fileRef`** (the raw storage pointer is never sent to the client; downloading goes through the dedicated download endpoint below, which mediates access rather than handing out a direct storage location — `docs/security/THREAT_MODEL.md` §7)
- **Errors:** `400`, `401`/`403`
- **Audit:** logged (`action: 'view_deliverables_list'`)
- **Rate limit:** standard

### `POST /api/documents`
- **Auth:** required
- **Authz:** `staff_advisory` (assigned to the target engagement), `admin`
- **Input:** multipart form — `engagementId`, `type` (enum), file (validated: type allowlist, size limit — `docs/security/SECURITY_REQUIREMENTS.md` V12)
- **Output:** `{ id, type, uploadedAt }`
- **Errors:** `400` (invalid file type/size, missing fields), `401`/`403`
- **Audit:** logged (`action: 'upload_deliverable'`), same-transaction as the file-metadata write
- **Rate limit:** standard, plus a file-size-aware throttle to prevent storage abuse

### `GET /api/documents/:id/download`
- **Auth:** required
- **Authz:** `client` (only if the document belongs to their own engagement), `staff_advisory` (only if assigned), `admin` — **the single endpoint in this catalog where an ID parameter is genuinely necessary** (you have to name which document), so the object-level ownership check here is the one this whole platform's Critical-rated risk finding is most directly about — implemented as: look up the document, resolve its `engagement.client_id`, then apply the exact same authorization check `GET /api/clients/me` and the compliance-items endpoints already use, not a separate, independently-written check that could drift out of sync
- **Input:** none beyond the path ID
- **Output:** the file stream (or a short-lived, single-use signed URL, an implementation-phase choice — either way, never a permanent/guessable public link)
- **Errors:** `401`/`403`, `404`
- **Audit:** logged (`action: 'download_deliverable'`) — every download of Confidential content is logged, not just uploads
- **Rate limit:** standard

---

### `GET /api/reporting/advisory-summary`
- **Auth:** required
- **Authz:** `staff_advisory` (their own numbers), `admin` (full)
- **Input:** none
- **Output:** `{ activeClientCount, onTimeRate }` — aggregate numbers only, computed live from `crm`/`advisory` data (`docs/architecture/DOMAIN_ARCHITECTURE.md` §7 — no stored/duplicated analytics table)
- **Errors:** `401`/`403`
- **Audit:** **not logged individually** — this is exactly the "system-internal, aggregate read" exception `docs/database/DATA_SECURITY.md` already carves out, since it never returns row-level Confidential data
- **Rate limit:** standard

### `GET /api/reporting/lead-pipeline`
- **Auth:** required
- **Authz:** `staff_marketing`, `admin`
- **Input:** none
- **Output:** `{ byStatus: {...}, byChannel: {...} }` — counts only
- **Errors:** `401`/`403`
- **Audit:** not logged (same aggregate-read exception)
- **Rate limit:** standard

---

## What this document does not do

It does not define V1/V2 endpoints (Academy, Tech-ops, Data-service, Admin user management) — those get the same per-endpoint treatment when their phase starts. It does not specify exact Fastify route-handler code or the shared Zod-schema package's file layout — implementation-phase work.
