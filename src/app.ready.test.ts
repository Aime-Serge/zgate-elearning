import Fastify from "fastify";
import { describe, expect, it } from "vitest";

/**
 * Regression test for a real bug found while manually verifying
 * /api/ready against an unreachable database
 * (docs/devops/PRODUCTION_ARCHITECTURE.md): `await reply.code(503)`,
 * with nothing chained after it, deadlocks. Fastify's Reply is
 * thenable and only resolves once the response is actually sent - which
 * can't happen until the handler returns, which never happens while
 * still awaiting it. `src/app.ts`'s real /api/ready route hit this
 * exactly (`getReadinessStatus()` itself resolved in milliseconds; the
 * HTTP response still never arrived).
 *
 * Deliberately not testing this through the real app.ts route: that
 * route's not_ready path only runs against a genuinely unreachable
 * database, and simulating one means either mutating the process-global
 * DATABASE_URL (confirmed unsafe here - an earlier version of this file
 * did exactly that and broke two unrelated tests in other files that
 * happened to run concurrently in the same Vitest worker and read the
 * poisoned value mid-test) or relying on network timing in whatever
 * environment this runs in. This isolates the actual hazard - the
 * Fastify reply-lifecycle pattern itself - in a throwaway app with no
 * shared state, so it's fast, deterministic, and safe to run anywhere,
 * alongside anything.
 */
describe("a Fastify route that sets reply.code() on a non-2xx path, then returns a value", () => {
  it("responds without hanging when reply.code() is not awaited (the fixed pattern)", async () => {
    const app = Fastify();
    app.get("/test-ready", async (_request, reply) => {
      const readiness = { status: "not_ready" as const };
      if ((readiness.status as string) !== "ready") {
        reply.code(503); // not awaited - see this file's own header comment
      }
      return readiness;
    });

    try {
      const start = Date.now();
      const response = await app.inject({ method: "GET", url: "/test-ready" });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ status: "not_ready" });
      expect(Date.now() - start).toBeLessThan(1000);
    } finally {
      await app.close();
    }
  }, 3000);
});
