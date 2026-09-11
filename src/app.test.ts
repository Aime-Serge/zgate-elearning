import { describe, expect, it } from "vitest";
import { build } from "./app.js";

describe("GET /api/health", () => {
  it("responds ok", async () => {
    const app = await build();
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });
    await app.close();
  });
});

describe("rate limiting", () => {
  it("actually returns 429 once an endpoint's per-route limit is exceeded", async () => {
    // Regression test for a real bug found by live testing: registering
    // @fastify/rate-limit inside a nested, unawaited child scope (this
    // module's original pattern for every rate-limited endpoint) never
    // attaches its request hook at all - every "rate-limited" endpoint
    // was silently unlimited. The fix moved registration to a single,
    // awaited, app-root call in build() (docs/security/
    // SECURITY_REQUIREMENTS.md V2/V11) with per-route overrides
    // (login's config.rateLimit here is 10/min). This test doesn't need
    // a database: the rate-limit hook runs before the route handler, so
    // the 11th request never reaches the DB-touching login logic at all.
    const app = await build();
    try {
      const responses: number[] = [];
      for (let i = 0; i < 11; i += 1) {
        const res = await app.inject({
          method: "POST",
          url: "/api/auth/login",
          payload: { email: "rate-limit-probe@example.com", password: "whatever" },
        });
        responses.push(res.statusCode);
      }
      expect(responses.slice(0, 10)).not.toContain(429);
      expect(responses[10]).toBe(429);
    } finally {
      await app.close();
    }
  });
});
