/**
 * Session shape + typed access to it. Session data is the ONLY source of
 * truth for who's calling and what role they hold - never a client-
 * supplied header/body field (docs/backend/AUTHORIZATION_MODEL.md:
 * "role is server-authoritative... every request reads it via the
 * session lookup, not by trusting anything the client asserts").
 */
import type { FastifyRequest } from "fastify";
import type { UserRole, Division } from "./db.js";
import { AppError } from "./errors.js";

export interface SessionUser {
  userId: string;
  role: UserRole;
  division: Division | null;
  clientId: string | null;
}

declare module "@fastify/secure-session" {
  // Declared directly (not `extends SessionUser {}`) - an empty-body
  // interface extension is equivalent to its supertype and flagged as
  // such by eslint's no-empty-object-type rule; this augmentation needs
  // an interface body regardless, so the fields are copied in rather
  // than aliased.
  interface SessionData {
    userId: string;
    role: UserRole;
    division: Division | null;
    clientId: string | null;
  }
}

export function setSessionUser(request: FastifyRequest, user: SessionUser): void {
  request.session.set("userId", user.userId);
  request.session.set("role", user.role);
  request.session.set("division", user.division);
  request.session.set("clientId", user.clientId);
}

export function clearSession(request: FastifyRequest): void {
  request.session.delete();
}

/**
 * Reads the current session, or throws UNAUTHENTICATED. This is the one
 * place "is there a valid session at all" gets checked - every
 * authenticated route calls this first, then (where relevant) the
 * role-specific checks in authz.ts.
 */
export function getSessionUser(request: FastifyRequest): SessionUser {
  const userId = request.session.get("userId");
  const role = request.session.get("role");
  if (!userId || !role) {
    throw new AppError("UNAUTHENTICATED", "Please log in to continue.");
  }
  return {
    userId,
    role,
    division: request.session.get("division") ?? null,
    clientId: request.session.get("clientId") ?? null,
  };
}
