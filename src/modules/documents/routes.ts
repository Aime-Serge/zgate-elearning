/**
 * documents module routes. See docs/backend/API_CONVENTIONS.md's
 * `GET /api/documents` and `GET /api/documents/:id/download` contracts.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { validationError, AppError } from "../../lib/errors.js";
import { getSessionUser } from "../../lib/session.js";
import { assertClientDataAccess } from "../../lib/engagementAccess.js";
import { logAccess } from "../../lib/audit.js";
import { readDeliverable } from "../../lib/storage.js";
import { documentsQuerySchema } from "./schema.js";
import { listDeliverablesForClient, getDeliverableForDownload } from "./service.js";

export function registerDocumentsRoutes(app: FastifyInstance): void {
  app.get("/api/documents", async (request, reply) => {
    const user = getSessionUser(request);

    const parsed = documentsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw validationError({ clientId: parsed.error.issues[0]?.message ?? "Invalid clientId." });
    }

    let clientId: string;
    if (user.role === "client") {
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

    assertClientDataAccess(user, clientId);

    const db = getDb();
    const documents = await listDeliverablesForClient(db, clientId);
    await logAccess(db, {
      userId: user.userId,
      action: "view_deliverables_list",
      resourceType: "client",
      resourceId: clientId,
    });

    await reply.send({ documents });
  });

  app.get<{ Params: { id: string } }>("/api/documents/:id/download", async (request, reply) => {
    const user = getSessionUser(request);
    // Role-level check first: a role that can never access documents at
    // all (e.g. staff_marketing, per RBAC_SECURITY_MODEL.md's permission
    // matrix) gets a clean 403 here, not the object-level 404 below -
    // that 404 exists to avoid leaking existence to a caller who *could*
    // plausibly own this class of resource (another client, another
    // staff member), which doesn't apply to a role excluded outright.
    if (user.role !== "client" && user.role !== "staff_advisory" && user.role !== "admin") {
      throw new AppError("FORBIDDEN", "You don't have permission to do that.");
    }

    const documentId = request.params.id;
    if (!documentId) {
      throw new AppError("VALIDATION_ERROR", "A document id is required.");
    }

    const db = getDb();
    // The single endpoint in this catalog where an ID parameter is
    // genuinely necessary (you have to name which document) - the
    // object-level ownership check is the whole point of this route
    // (docs/backend/API_CONVENTIONS.md, docs/security/THREAT_MODEL.md §7).
    const document = await getDeliverableForDownload(db, documentId);
    assertClientDataAccess(user, document.ownerClientId);

    await logAccess(db, {
      userId: user.userId,
      action: "download_deliverable",
      resourceType: "deliverable",
      resourceId: document.id,
    });

    const stream = readDeliverable(document.fileRef);
    await reply
      .header("Content-Disposition", `attachment; filename="deliverable-${document.id}"`)
      .header("Content-Type", "application/octet-stream")
      .send(stream);
  });
}
