/**
 * clients module routes. See docs/backend/API_CONVENTIONS.md's
 * `GET /api/clients/me` contract.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { logAccess } from "../../lib/audit.js";
import { requireRole } from "../../lib/authz.js";
import { getOwnClient } from "./service.js";

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
}
