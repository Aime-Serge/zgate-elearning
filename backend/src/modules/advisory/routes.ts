/**
 * advisory module routes. See docs/backend/API_CONVENTIONS.md's
 * `GET /api/advisory/compliance-items` contract.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { validationError, AppError } from "../../lib/errors.js";
import { getSessionUser } from "../../lib/session.js";
import { requireRole } from "../../lib/authz.js";
import { assertClientDataAccess } from "../../lib/engagementAccess.js";
import { logAccess } from "../../lib/audit.js";
import { complianceItemsQuerySchema } from "./schema.js";
import {
  getComplianceItemsForClient,
  getComplianceItemOwnerClientId,
  completeComplianceItem,
} from "./service.js";

export function registerAdvisoryRoutes(app: FastifyInstance): void {
  app.get("/api/advisory/compliance-items", async (request, reply) => {
    const user = getSessionUser(request);

    const parsed = complianceItemsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw validationError({ clientId: parsed.error.issues[0]?.message ?? "Invalid clientId." });
    }

    let clientId: string;
    if (user.role === "client") {
      // Forbidden/ignored for the client role - the caller's own
      // clientId is the only value ever used, never one supplied in the
      // request (docs/backend/API_CONVENTIONS.md's security-by-design
      // pattern: no parameter for a manipulated request to tamper with).
      if (!user.clientId) {
        throw new Error("client-role session is missing clientId");
      }
      clientId = user.clientId;
    } else if (user.role === "staff_advisory" || user.role === "admin") {
      if (!parsed.data.clientId) {
        throw validationError({ clientId: "clientId is required." });
      }
      clientId = parsed.data.clientId;
    } else {
      throw new AppError("FORBIDDEN", "You don't have permission to do that.");
    }

    // Object-level check even though staff currently always passes it
    // (no assignment tracking exists yet - see engagementAccess.ts) -
    // written once here so the day an assignment concept is added, this
    // is the only call site that needs to change.
    assertClientDataAccess(user, clientId);

    const db = getDb();
    const items = await getComplianceItemsForClient(db, clientId);
    await logAccess(db, {
      userId: user.userId,
      action: "view_compliance_items",
      resourceType: "client",
      resourceId: clientId,
    });

    await reply.send({ items });
  });

  app.post<{ Params: { id: string } }>(
    "/api/advisory/compliance-items/:id/complete",
    async (request, reply) => {
      const user = requireRole("staff_advisory", "admin")(request);
      const itemId = request.params.id;
      if (!itemId) {
        throw new AppError("VALIDATION_ERROR", "An item id is required.");
      }

      const db = getDb();
      const ownerClientId = await getComplianceItemOwnerClientId(db, itemId);
      if (ownerClientId === null) {
        throw new AppError("NOT_FOUND", "Not found.");
      }
      // Written once here so the day an assignment concept replaces the
      // current "any staff_advisory" scope, this call site doesn't need
      // to change - see lib/engagementAccess.ts.
      assertClientDataAccess(user, ownerClientId);

      const result = await completeComplianceItem(db, itemId, user.userId);
      await reply.send(result);
    },
  );
}
