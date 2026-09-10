/**
 * Role-level authorization - layer 1 of the two-layer pattern in
 * docs/backend/AUTHORIZATION_MODEL.md. This checks "does this role
 * permit this class of action at all"; object-level checks ("is this
 * specific record theirs") are a separate, explicit call inside each
 * route handler where they apply - this hook alone is never sufficient
 * for a route that takes a resource ID belonging to a specific client.
 */
import type { FastifyRequest } from "fastify";
import type { UserRole } from "./db.js";
import { AppError } from "./errors.js";
import { getSessionUser, type SessionUser } from "./session.js";

export function requireRole(...allowed: UserRole[]) {
  return (request: FastifyRequest): SessionUser => {
    const user = getSessionUser(request); // throws UNAUTHENTICATED if no session
    if (!allowed.includes(user.role)) {
      throw new AppError("FORBIDDEN", "You don't have permission to do that.");
    }
    return user;
  };
}
