import { describe, expect, it } from "vitest";
import { build } from "../../app.js";

describe("POST /api/public/contact", () => {
  it("rejects a missing name with a plain-language field error", async () => {
    const app = build();
    const response = await app.inject({
      method: "POST",
      url: "/api/public/contact",
      payload: { contact: "solange@example.com" },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json<{
      error: { code: string; fields?: Record<string, string> };
    }>();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields?.["name"]).toBe("Enter your name.");
    await app.close();
  });

  it("rejects a missing contact field", async () => {
    const app = build();
    const response = await app.inject({
      method: "POST",
      url: "/api/public/contact",
      payload: { name: "Solange" },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json<{ error: { fields?: Record<string, string> } }>();
    expect(body.error.fields?.["contact"]).toBe("Enter a way to reach you.");
    await app.close();
  });

  it("rejects a statedNeed over 2000 characters", async () => {
    const app = build();
    const response = await app.inject({
      method: "POST",
      url: "/api/public/contact",
      payload: {
        name: "Solange",
        contact: "solange@example.com",
        statedNeed: "x".repeat(2001),
      },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("never returns an internal lead ID or database detail to an unauthenticated caller on success", async () => {
    // This is the one assertion in this file that requires a real
    // database (the actual insert). It's written to run for real in CI
    // (docs/backend/BACKEND_TESTING.md's ephemeral-Postgres strategy) and
    // skips cleanly here when DATABASE_URL isn't configured - a real
    // environment limitation carried over from the database phase's
    // Docker access issue, not a gap in this test's coverage intent.
    if (!process.env["DATABASE_URL"]) {
      console.warn("Skipping DB-dependent test: DATABASE_URL not set locally. Runs in CI.");
      return;
    }

    const app = build();
    const response = await app.inject({
      method: "POST",
      url: "/api/public/contact",
      payload: { name: "Solange", contact: "solange@example.com" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ success: true });
    await app.close();
  });
});
