/**
 * reporting module routes. See docs/backend/API_CONVENTIONS.md's
 * `GET /api/reporting/advisory-summary` and
 * `GET /api/reporting/lead-pipeline` contracts. Neither is audit-logged -
 * both are aggregate, system-internal reads that never return row-level
 * Confidential data (docs/database/DATA_SECURITY.md's exception).
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { requireRole } from "../../lib/authz.js";
import { getAdvisorySummary, getLeadPipeline } from "./service.js";

export function registerReportingRoutes(app: FastifyInstance): void {
  app.get("/api/reporting/advisory-summary", async (request, reply) => {
    requireRole("staff_advisory", "admin")(request);
    const summary = await getAdvisorySummary(getDb());
    await reply.send(summary);
  });

  app.get("/api/reporting/lead-pipeline", async (request, reply) => {
    requireRole("staff_marketing", "admin")(request);
    const pipeline = await getLeadPipeline(getDb());
    await reply.send(pipeline);
  });
}
