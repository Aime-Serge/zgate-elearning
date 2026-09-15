# Z-GATE Digital Platform — Authorization Model (Implementation)

Implements `docs/security/RBAC_SECURITY_MODEL.md`'s permission matrix in Fastify terms. That document defines *what's allowed*; this one defines *how the code enforces it*, consistently, so the Critical-rated risks in `docs/security/THREAT_MODEL.md` aren't left to each route handler to get right independently.

## Two layers, always both, never just one

1. **Role check** — does the caller's role permit this *class* of action at all (e.g., only `staff_advisory`/`admin` can call `POST /api/advisory/compliance-items/:id/complete`).
2. **Object-level check** — does the caller have a right to *this specific record* (e.g., is this Advisory Associate actually assigned to the engagement this compliance item belongs to).

**A route that only implements layer 1 is incomplete and insecure**, regardless of how correct its role check is — this is precisely `docs/security/THREAT_MODEL.md`'s Critical-rated Broken Object Level Authorization finding, and it's the single failure mode this entire document exists to make structurally hard to introduce.

## Implementation pattern

- **Role check:** a shared Fastify `preHandler` hook, declared per-route (or per-plugin where every route in a module shares the same role requirement), reading the role from the verified session (never from a request body/query/header the client controls).
- **Object-level check:** a shared helper function per resource type (e.g., `assertStaffAssignedToClient(userId, clientId)`, `assertOwnEngagement(clientId, engagementId)`) — called explicitly inside the route handler, not hidden in a generic middleware that might silently not apply to a new route. **Every route handler that touches a specific record calls the matching assertion helper before doing anything else with that record** — this is a code-review checklist item, not just a convention (`docs/backend/BACKEND_TESTING.md` tests this explicitly per endpoint).
- **The client-role "no ID parameter" pattern** (`API_CONVENTIONS.md`) removes the object-level check's failure mode entirely for those endpoints — there's no ID to check against the wrong value because there's no ID accepted at all. Preferred wherever the resource genuinely is "the caller's own," which is most of the `client` role's real surface area.

## Worked example: `GET /api/advisory/compliance-items` (the dual-mode pattern)

```
if role == 'client':
    engagementIds = getEngagementsForClient(session.clientId)   # derived, not requested
    return complianceItems.where(engagementId in engagementIds)

if role in ('staff_advisory', 'admin'):
    clientId = request.query.clientId
    if not clientId: return 400
    if role == 'staff_advisory':
        assertStaffAssignedToClient(session.userId, clientId)   # object-level check - throws 403 if not assigned
    engagementIds = getEngagementsForClient(clientId)
    return complianceItems.where(engagementId in engagementIds)

return 403   # any other role
```

Every branch either derives the scope from the session (no attacker-controlled input involved at all) or explicitly checks the attacker-controlled input (`clientId`) against the caller's actual assignment before using it. There is no path where a `clientId` value is trusted without a check.

## Role source of truth

The role used in every check above comes from the **server-side session record**, resolved fresh on every request from the session token — never from a JWT claim the client could have stale or tampered data in without re-verification, never from a request body field named `role`. `docs/database/DATA_MODEL.md`'s `users.role` is the only place a role value is stored; every request reads it via the session lookup, not by trusting anything the client asserts about itself. This is the concrete backend half of `docs/frontend/FRONTEND_SECURITY.md`'s "client-side authorization is never a security control" rule — the frontend may *display* a role for UX purposes, but the backend never accepts that display value as input.

## Admin role — the widest scope, the most reviewed code path

`admin` bypasses object-level assignment checks by design (matching the MD's documented cross-divisional oversight — `docs/business/ROLE_MATRIX.md` §1), but **every admin action is still audit-logged** (`docs/backend/BACKEND_ARCHITECTURE.md`'s audit rule applies to `admin` exactly as it does to every other role) — the difference between `admin` and other roles is scope, not accountability.

## What this document does not do

It does not implement the actual `preHandler` hooks or assertion-helper functions in code — that's implementation-phase work built to this pattern. It does not define V1/V2 roles' (`staff_academy`, `staff_tech`, `staff_data`) object-level check helpers — those follow the exact same pattern (`assertStaffAssignedToCohort`, etc.) when their modules are actually built, not designed speculatively now.
