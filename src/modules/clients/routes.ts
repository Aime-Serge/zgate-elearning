/**
 * clients module routes. See docs/backend/API_CONVENTIONS.md's
 * `GET /api/clients/me` contract.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { AppError } from "../../lib/errors.js";
import { logAccess } from "../../lib/audit.js";
import { requireRole } from "../../lib/authz.js";
import { assertClientDataAccess } from "../../lib/engagementAccess.js";
import { getOwnClient, listClients, getClientDetail } from "./service.js";

export function registerClientsRoutes(app: FastifyInstance): void {
  app.get("/api/clients/me", async (request, reply) => {
    const user = requireRole("client")(request);
    const db = getDb();

    // clientId is always set for a client-role session (database check
    // constraint on users.client_id) - session.ts's SessionUser type
    // still models it as nullable since the field is shared across
    // every role, so this is a defensive narrow, not a real branch.
    if (!user.clientId) {
      throw new Error("client-role session is missing clientId");
    }

    const client = await getOwnClient(db, user.clientId);
    await logAccess(db, {
      userId: user.userId,
      action: "view_own_client_record",
      resourceType: "client",
      resourceId: client.id,
    });

    await reply.send(client);
  });

  app.get("/api/clients", async (request, reply) => {
    // staff_advisory's RBAC-documented scope is "their assigned
    // clients", but no assignment column exists anywhere in the schema
    // (see lib/engagementAccess.ts's comment - the same accepted MVP
    // limitation applies here).
    const user = requireRole("staff_advisory", "admin")(request);
    const db = getDb();

    const clients = await listClients(db);
    // One row per client, not one row for "the list" - access_log has
    // no concept of a resource-less/list-level event, and logging per
    // record is the semantically correct granularity anyway (matches
    // every other logged action in this codebase).
    for (const client of clients) {
      await logAccess(db, {
        userId: user.userId,
        action: "view_client_list",
        resourceType: "client",
        resourceId: client.id,
      });
    }

    await reply.send({ clients });
  });

  app.get<{ Params: { id: string } }>("/api/clients/:id", async (request, reply) => {
    const user = requireRole("staff_advisory", "admin")(request);
    const clientId = request.params.id;
    if (!clientId) {
      throw new AppError("VALIDATION_ERROR", "A client id is required.");
    }

    // Written once here so the day an assignment concept replaces the
    // current "any staff_advisory" scope, this call site doesn't need
    // to change - see lib/engagementAccess.ts.
    assertClientDataAccess(user, clientId);

    const db = getDb();
    const client = await getClientDetail(db, clientId);
    await logAccess(db, {
      userId: user.userId,
      action: "view_client_detail",
      resourceType: "client",
      resourceId: client.id,
    });

    await reply.send(client);
  });
}
