/**
 * Fastify instance builder. Exported as build() (not listening on a port)
 * so tests can exercise the app via .inject() without a real network
 * socket - see docs/backend/BACKEND_TESTING.md.
 */
import Fastify, { type FastifyInstance, type FastifyError } from "fastify";
import { getHealthStatus } from "./health.js";
import { AppError } from "./lib/errors.js";
import { registerCrmRoutes } from "./modules/crm/routes.js";

export function build(): FastifyInstance {
  // Quiet during the test run so real assertions aren't buried under
  // request logs - still fully logged in dev/production.
  const app = Fastify({ logger: !process.env["VITEST"] });

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

  registerCrmRoutes(app);

  return app;
}
