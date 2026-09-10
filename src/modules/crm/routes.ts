/**
 * crm module routes. See docs/backend/API_CONVENTIONS.md for the full
 * per-endpoint contract this implements.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { validationError } from "../../lib/errors.js";
import { contactInputSchema } from "./schema.js";
import { createLeadFromWebsite } from "./service.js";

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
          const fields: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path[0];
            if (typeof key === "string" && !(key in fields)) {
              fields[key] = issue.message;
            }
          }
          throw validationError(fields);
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
}
