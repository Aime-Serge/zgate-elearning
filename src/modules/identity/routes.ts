/**
 * identity module routes. See docs/backend/API_CONVENTIONS.md's
 * /api/auth/* group for the full per-endpoint contract.
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { AppError, validationError } from "../../lib/errors.js";
import { logAccess } from "../../lib/audit.js";
import { sendEmail } from "../../lib/email.js";
import { config } from "../../lib/config.js";
import { requireRole } from "../../lib/authz.js";
import { getSessionUser, setSessionUser, clearSession } from "../../lib/session.js";
import {
  loginInputSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} from "./schema.js";
import {
  verifyCredentials,
  requestPasswordReset,
  confirmPasswordReset,
  deactivateUser,
} from "./service.js";

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

export function registerIdentityRoutes(app: FastifyInstance): void {
  app.post(
    "/api/auth/login",
    // Credential-stuffing target - the platform's highest-blast-radius
    // single control (docs/architecture/THREAT_MODEL.md §3). Stricter
    // than the app-wide standard default registered in app.ts.
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = loginInputSchema.safeParse(request.body);
      if (!parsed.success) {
        throw validationError(zodFieldErrors(parsed.error.issues));
      }

      const db = getDb();
      const result = await verifyCredentials(db, parsed.data.email, parsed.data.password);

      if (!result.ok) {
        // Never reveals whether the email or the password was wrong
        // (docs/backend/SECURITY_REQUIREMENTS.md V2) - the HTTP
        // response is identical either way. Audit-logged to access_log
        // only when a real account was matched (wrong password), since
        // that table's user_id FK requires a real row to point at; an
        // attempt against an email that doesn't exist at all has no
        // valid FK target, so it's recorded in the structured request
        // log instead.
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
    },
  );

  // Standard rate limit, applied by the app-wide default registered in
  // app.ts (docs/backend/API_SECURITY.md).
  app.post("/api/auth/logout", async (request, reply) => {
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

  app.get("/api/auth/session", (request, reply) => {
    // Not audit-logged - reading your own session is not an access to
    // Confidential data (docs/database/DATA_SECURITY.md's "not logged"
    // exception).
    const user = getSessionUser(request);
    return reply.send({ role: user.role, division: user.division, clientId: user.clientId });
  });

  const passwordResetRateLimit = {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  };

  app.post(
    "/api/auth/password-reset/request",
    // Aggressive per-IP limit, matching the public-contact-form class of
    // protection: unauthenticated, triggers an external side effect (an
    // email send), and a plausible target for enumeration/abuse attempts
    // (docs/security/THREAT_MODEL.md §3).
    passwordResetRateLimit,
    async (request, reply) => {
      const parsed = passwordResetRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw validationError(zodFieldErrors(parsed.error.issues));
      }

      const db = getDb();
      const result = await requestPasswordReset(db, parsed.data.email);

      if (result.matched) {
        const resetLink = `${config.WEB_ORIGIN}/reset-password?token=${result.token}`;
        await sendEmail(
          parsed.data.email,
          "Reset your Z-GATE password",
          `Use this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour and can only be used once. If you didn't request this, you can safely ignore this email.`,
        );
        await logAccess(db, {
          userId: result.userId,
          action: "password_reset_requested",
          resourceType: "user",
          resourceId: result.userId,
        });
      }

      // Identical response whether or not the email matched an account
      // (docs/security/SECURITY_REQUIREMENTS.md V2 - same non-
      // enumeration rule as login's error response).
      await reply.send({ success: true });
    },
  );

  app.post("/api/auth/password-reset/confirm", passwordResetRateLimit, async (request, reply) => {
    const parsed = passwordResetConfirmSchema.safeParse(request.body);
    if (!parsed.success) {
      throw validationError(zodFieldErrors(parsed.error.issues));
    }

    const db = getDb();
    const result = await confirmPasswordReset(db, parsed.data.token, parsed.data.newPassword);
    await logAccess(db, {
      userId: result.userId,
      action: "password_reset_completed",
      resourceType: "user",
      resourceId: result.userId,
    });

    await reply.send({ success: true });
  });

  // Incident containment action (docs/security/
  // INCIDENT_RESPONSE_REQUIREMENTS.md, docs/devops/INCIDENT_RUNBOOK.md) -
  // admin-only, audit-logged like every other access to a users row.
  app.post<{ Params: { id: string } }>("/api/admin/users/:id/deactivate", async (request, reply) => {
    const admin = requireRole("admin")(request);
    const targetUserId = request.params.id;
    if (!targetUserId) {
      throw new AppError("VALIDATION_ERROR", "A user id is required.");
    }

    const db = getDb();
    const result = await deactivateUser(db, targetUserId);
    await logAccess(db, {
      userId: admin.userId,
      action: "deactivate_user",
      resourceType: "user",
      resourceId: result.userId,
    });

    await reply.send({ success: true });
  });
}
