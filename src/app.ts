/**
 * Fastify instance builder. Exported as build() (not listening on a port)
 * so tests can exercise the app via .inject() without a real network
 * socket - see docs/backend/BACKEND_TESTING.md.
 */
import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import cors from "@fastify/cors";
import secureSession from "@fastify/secure-session";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { getHealthStatus } from "./health.js";
import { AppError } from "./lib/errors.js";
import { config, getSessionSecret, getSessionSalt } from "./lib/config.js";
import { registerCrmRoutes } from "./modules/crm/routes.js";
import { registerIdentityRoutes } from "./modules/identity/routes.js";
import { registerClientsRoutes } from "./modules/clients/routes.js";
import { registerAdvisoryRoutes } from "./modules/advisory/routes.js";
import { registerDocumentsRoutes } from "./modules/documents/routes.js";
import { registerReportingRoutes } from "./modules/reporting/routes.js";
import { registerAcademyRoutes } from "./modules/academy/routes.js";
import { MAX_UPLOAD_SIZE_BYTES } from "./modules/documents/schema.js";

export async function build(): Promise<FastifyInstance> {
  const app = Fastify({
    // Quiet during the test run so real assertions aren't buried under
    // request logs - still fully logged in dev/production.
    logger: process.env["VITEST"]
      ? false
      : {
          // Defense in depth: Fastify's default request log does NOT
          // include the request body (so today's lead-capture payload -
          // name/contact/statedNeed - is never logged), but headers ARE
          // logged by default. Redact anything that could ever carry a
          // credential now, before an auth module adds
          // Authorization/Cookie headers to worry about - never log
          // secrets unnecessarily (docs/backend/API_SECURITY.md).
          redact: {
            paths: ["req.headers.authorization", "req.headers.cookie", 'req.headers["x-api-key"]'],
            censor: "[redacted]",
          },
        },
  });

  // Frontend is a separate deployable (docs/architecture/API_ARCHITECTURE.md
  // - "who consumes the API"), so it's a different origin even in dev -
  // CORS is required, not optional. No wildcard: a specific, configured
  // origin only (docs/backend/API_SECURITY.md's "no wildcard" discipline
  // extends here).
  void app.register(cors, {
    origin: config.WEB_ORIGIN,
    // The session cookie must be allowed to cross the frontend/backend
    // origin boundary, or every authenticated request would be rejected
    // by the browser itself before it even reaches our own auth checks.
    credentials: true,
  });

  // Self-hosted, stateless encrypted-cookie sessions - no separate
  // session-store table (docs/architecture/ADR/ADR-005-self-hosted-auth.md).
  void app.register(secureSession, {
    secret: getSessionSecret(),
    salt: getSessionSalt(),
    // Sessions expire after a bounded period, never indefinitely
    // (docs/security/SECURITY_REQUIREMENTS.md V3) - verified server-side
    // on every request, since it's baked into the encrypted payload
    // itself, not just an advisory cookie maxAge. 24h balances that
    // requirement against the mobile, quick-check usage pattern
    // (docs/ux/USER_JOURNEY_MAP.md Journey 7) so a staff member logging
    // in each morning isn't logged out mid-day. Stated explicitly here
    // rather than left to the library's own default, even though it
    // happens to match.
    expiry: 60 * 60 * 24,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      // Secure cookies require HTTPS - only enforced once NODE_ENV is
      // production (ADR-004's hosting decision, still open, will
      // terminate TLS); local dev over plain HTTP would otherwise
      // silently never set the cookie at all.
      secure: config.NODE_ENV === "production",
    },
  });

  // Registered once, globally, at the app root - docs/security/
  // SECURITY_REQUIREMENTS.md V2/V11's rate-limiting requirement applies
  // to every endpoint (API_CONVENTIONS.md's catalog gives every single
  // one a "standard" or "aggressive" tier, never "none"). This must be
  // awaited before any route is defined: registering it inside a nested,
  // unawaited child scope (the pattern this module used originally)
  // silently never attaches its request hook at all - confirmed by
  // direct testing, not assumed - so every previously "rate-limited"
  // endpoint was actually unlimited. 100/min/IP is the generous
  // "standard" default (real MVP user count is small); specific
  // abuse-prone endpoints (login, public contact, password reset)
  // override it with a stricter per-route `config.rateLimit`.
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
  });

  // FEAT-06.3's upload endpoint - fields and the file both land on
  // request.body (docs/security/SECURITY_REQUIREMENTS.md V12: type
  // allowlist and size limit are still enforced explicitly in the route
  // handler, this global limit is a hard backstop against an
  // oversized/abusive request before it's ever buffered further).
  void app.register(multipart, {
    attachFieldsToBody: true,
    limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 1 },
  });

  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    const correlationId = request.id;

    if (error instanceof AppError) {
      // Client-facing detail is exactly what AppError already carries -
      // plain language, no internal detail. Full error still goes to the
      // structured log (docs/backend/ERROR_HANDLING.md's logging/client
      // separation).
      request.log.warn({ err: error, correlationId }, error.message);
      void reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
          correlationId,
        },
      });
      return;
    }

    if (error.statusCode === 429) {
      void reply.code(429).send({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please wait a moment and try again.",
          correlationId,
        },
      });
      return;
    }

    // Unexpected failure - full detail logged, generic message to the
    // client (never a stack trace or DB error string).
    request.log.error({ err: error, correlationId }, "Unhandled error");
    void reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
        correlationId,
      },
    });
  });

  app.get("/api/health", () => getHealthStatus());

  registerIdentityRoutes(app);
  registerCrmRoutes(app);
  registerClientsRoutes(app);
  registerAdvisoryRoutes(app);
  registerDocumentsRoutes(app);
  registerReportingRoutes(app);
  registerAcademyRoutes(app);

  return app;
}
