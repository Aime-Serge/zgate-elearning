/**
 * identity module routes. See docs/backend/API_CONVENTIONS.md's
 * /api/auth/* group for the full per-endpoint contract.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { AppError, validationError } from "../../lib/errors.js";
import { logAccess } from "../../lib/audit.js";
import { getSessionUser, setSessionUser, clearSession } from "../../lib/session.js";
import { loginInputSchema } from "./schema.js";
import { verifyCredentials } from "./service.js";

export function registerIdentityRoutes(app: FastifyInstance): void {
  app.register(
    (scoped, _opts, done) => {
      // Credential-stuffing target - the platform's highest-blast-radius
      // single control (docs/architecture/THREAT_MODEL.md §3).
      void scoped.register(import("@fastify/rate-limit"), {
        max: 10,
        timeWindow: "1 minute",
      });

      scoped.post("/api/auth/login", async (request, reply) => {
        const parsed = loginInputSchema.safeParse(request.body);
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

        const db = getDb();
        const result = await verifyCredentials(db, parsed.data.email, parsed.data.password);

        if (!result.ok) {
          // Never reveals whether the email or the password was wrong
          // (docs/backend/SECURITY_REQUIREMENTS.md V2) - the HTTP
          // response is identical either way. Audit-logged to
          // access_log only when a real account was matched (wrong
          // password), since that table's user_id FK requires a real
          // row to point at; an attempt against an email that doesn't
          // exist at all has no valid FK target, so it's recorded in
          // the structured request log instead.
          if (result.matchedUserId) {
            await logAccess(db, {
              userId: result.matchedUserId,
              action: "login_failure",
              resourceType: "user",
              resourceId: result.matchedUserId,
            });
          } else {
            request.log.warn({ email: parsed.data.email }, "login failed: no matching account");
          }
          throw new AppError("UNAUTHENTICATED", "That email or password isn't right.");
        }

        setSessionUser(request, result.user);
        await logAccess(db, {
          userId: result.user.userId,
          action: "login_success",
          resourceType: "user",
          resourceId: result.user.userId,
        });

        await reply.send({
          role: result.user.role,
          division: result.user.division,
          clientId: result.user.clientId,
        });
      });

      scoped.post("/api/auth/logout", async (request, reply) => {
        const user = getSessionUser(request);
        await logAccess(getDb(), {
          userId: user.userId,
          action: "logout",
          resourceType: "user",
          resourceId: user.userId,
        });
        clearSession(request);
        await reply.send({ success: true });
      });

      scoped.get("/api/auth/session", (request, reply) => {
        // Not audit-logged - reading your own session is not an access
        // to Confidential data (docs/database/DATA_SECURITY.md's
        // "not logged" exception).
        const user = getSessionUser(request);
        return reply.send({ role: user.role, division: user.division, clientId: user.clientId });
      });

      done();
    },
    { prefix: "" },
  );
}
