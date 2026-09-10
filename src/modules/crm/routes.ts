/**
 * crm module routes. See docs/backend/API_CONVENTIONS.md for the full
 * per-endpoint contract this implements.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { AppError, validationError } from "../../lib/errors.js";
import { requireRole } from "../../lib/authz.js";
import {
  contactInputSchema,
  manualLeadInputSchema,
  leadListQuerySchema,
  convertLeadInputSchema,
} from "./schema.js";
import { createLeadFromWebsite, createLeadManual, listLeads, convertLead } from "./service.js";

function zodFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fields)) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export function registerCrmRoutes(app: FastifyInstance): void {
  app.register(
    (scoped, _opts, done) => {
      // Aggressive per-IP limit - unauthenticated, public, spam/DoS-prone
      // endpoint (docs/backend/API_SECURITY.md's rate-limiting table).
      void scoped.register(import("@fastify/rate-limit"), {
        max: 5,
        timeWindow: "1 minute",
      });

      scoped.post("/api/public/contact", async (request, reply) => {
        const parsed = contactInputSchema.safeParse(request.body);
        if (!parsed.success) {
          throw validationError(zodFieldErrors(parsed.error.issues));
        }

        await createLeadFromWebsite(getDb(), parsed.data);

        // Deliberately minimal response - no lead ID or internal detail
        // returned to an unauthenticated caller (API_CONVENTIONS.md).
        await reply.code(201).send({ success: true });
      });

      done();
    },
    { prefix: "" },
  );

  // Authenticated staff routes - standard rate limit (generous; real MVP
  // user count is small, docs/backend/API_SECURITY.md).
  app.get("/api/leads", async (request, reply) => {
    requireRole("staff_marketing", "staff_advisory", "admin")(request);

    const parsed = leadListQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw validationError(zodFieldErrors(parsed.error.issues));
    }

    const leads = await listLeads(getDb(), parsed.data);
    await reply.send({ leads });
  });

  app.post("/api/leads", async (request, reply) => {
    requireRole("staff_marketing")(request);

    const parsed = manualLeadInputSchema.safeParse(request.body);
    if (!parsed.success) {
      throw validationError(zodFieldErrors(parsed.error.issues));
    }

    await createLeadManual(getDb(), parsed.data);
    await reply.code(201).send({ success: true });
  });

  app.post<{ Params: { id: string } }>("/api/leads/:id/convert", async (request, reply) => {
    const staff = requireRole("staff_advisory", "admin")(request);

    const parsed = convertLeadInputSchema.safeParse(request.body);
    if (!parsed.success) {
      throw validationError(zodFieldErrors(parsed.error.issues));
    }

    const leadId = request.params.id;
    if (!leadId) {
      throw new AppError("VALIDATION_ERROR", "A lead id is required.");
    }

    const result = await convertLead(getDb(), leadId, staff.userId, parsed.data);
    await reply.send(result);
  });
}
