/**
 * The one shared object-level check for every engagement-scoped
 * resource (compliance items, documents) - docs/backend/
 * API_CONVENTIONS.md is explicit that this must be "the exact same
 * authorization check ... not a separate, independently-written check
 * that could drift out of sync" across those endpoints.
 *
 * A failed check throws NOT_FOUND, never FORBIDDEN - a 403 would
 * confirm the resource exists but belongs to someone else, which is
 * itself an information leak (docs/security/THREAT_MODEL.md §2's
 * Broken Object Level Authorization finding). FORBIDDEN stays reserved
 * for a role that can never perform this class of action at all
 * (requireRole in authz.ts), not for "this specific record isn't
 * yours."
 *
 * `staff_advisory`'s RBAC-documented scope is "assigned engagements",
 * but no assignment column exists anywhere in the schema (there is
 * exactly one Advisory Associate today) - RBAC_SECURITY_MODEL.md's own
 * "Separation of duties" section already treats this as an accepted,
 * documented MVP limitation, not an oversight. Until an assignment
 * concept is actually modeled, `staff_advisory` and `admin` are
 * equivalent for this check.
 */
import { AppError } from "./errors.js";
import type { SessionUser } from "./session.js";

export function assertClientDataAccess(user: SessionUser, ownerClientId: string): void {
  if (user.role === "admin" || user.role === "staff_advisory") {
    return;
  }
  if (user.role === "client" && user.clientId === ownerClientId) {
    return;
  }
  throw new AppError("NOT_FOUND", "Not found.");
}
