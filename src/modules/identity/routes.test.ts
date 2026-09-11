import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { build } from "../../app.js";
import { getDb } from "../../lib/db.js";
import { hashPassword } from "../../lib/auth.js";

// DB-dependent - skips cleanly without DATABASE_URL/SESSION_SECRET/
// SESSION_SALT locally, runs for real in CI (docs/backend/BACKEND_TESTING.md).
const canRun = Boolean(
  process.env["DATABASE_URL"] && process.env["SESSION_SECRET"] && process.env["SESSION_SALT"],
);

interface ErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

describe("identity routes", () => {
  it("login, session, and logout work end-to-end for a real account", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }

    const db = getDb();
    const email = `identity-test-${randomUUID()}@example.com`;
    const password = "a-real-test-password";

    const user = await db
      .insertInto("users")
      .values({
        email,
        password_hash: await hashPassword(password),
        role: "staff_marketing",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    const app = await build();
    try {
      // --- wrong password: same generic message as a wrong email would get ---
      const wrongPassword = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email, password: "not-the-real-password" },
      });
      expect(wrongPassword.statusCode).toBe(401);
      const wrongPasswordBody = wrongPassword.json<ErrorBody>();
      expect(wrongPasswordBody.error.code).toBe("UNAUTHENTICATED");

      // --- nonexistent email: identical response shape, no account leak ---
      const noSuchAccount = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: `no-such-account-${randomUUID()}@example.com`, password: "anything" },
      });
      expect(noSuchAccount.statusCode).toBe(401);
      const noSuchAccountBody = noSuchAccount.json<ErrorBody>();
      // The actual security property: a wrong password against a real
      // account and a login attempt against no account at all must be
      // indistinguishable to the caller (docs/security/SECURITY_REQUIREMENTS.md V2).
      // correlationId legitimately differs per request (request.id) -
      // excluded from the comparison on purpose, not an oversight.
      expect(noSuchAccountBody.error.code).toBe(wrongPasswordBody.error.code);
      expect(noSuchAccountBody.error.message).toBe(wrongPasswordBody.error.message);
      expect(noSuchAccountBody.error.fields).toBe(wrongPasswordBody.error.fields);

      // --- real login ---
      const login = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email, password },
      });
      expect(login.statusCode).toBe(200);
      expect(login.json()).toEqual({ role: "staff_marketing", division: null, clientId: null });
      const cookie = login.cookies.find((c) => c.name === "session");
      expect(cookie).toBeDefined();

      // --- session reflects who's logged in ---
      const session = await app.inject({
        method: "GET",
        url: "/api/auth/session",
        cookies: { session: cookie?.value ?? "" },
      });
      expect(session.statusCode).toBe(200);
      expect(session.json()).toEqual({ role: "staff_marketing", division: null, clientId: null });

      // --- no session at all -> 401 ---
      const noSession = await app.inject({ method: "GET", url: "/api/auth/session" });
      expect(noSession.statusCode).toBe(401);

      // --- logout clears it ---
      const logout = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        cookies: { session: cookie?.value ?? "" },
      });
      expect(logout.statusCode).toBe(200);
      expect(logout.json()).toEqual({ success: true });
    } finally {
      await db.deleteFrom("access_log").where("user_id", "=", user.id).execute();
      await db.deleteFrom("users").where("id", "=", user.id).execute();
      await app.close();
    }
  });
});
