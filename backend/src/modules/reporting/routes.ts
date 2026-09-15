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
import {
  getAdvisorySummary,
  getLeadPipeline,
  getDataDictionary,
  getDataQualitySummary,
} from "./service.js";

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

  // Admin-only: schema structure and cross-division completeness/
  // timeliness counts are internal operational signals no non-admin
  // role has a documented need for - conservative by default, same
  // reasoning as every "no access" cell in RBAC_SECURITY_MODEL.md's
  // permission matrix for a role with no stated need.
  app.get("/api/reporting/data-dictionary", async (request, reply) => {
    requireRole("admin")(request);
    const tables = await getDataDictionary(getDb());
    await reply.send({ tables });
  });

  app.get("/api/reporting/data-quality", async (request, reply) => {
    requireRole("admin")(request);
    const summary = await getDataQualitySummary(getDb());
    await reply.send(summary);
  });
}
