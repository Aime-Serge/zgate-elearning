import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { build } from "../../app.js";
import { getDb } from "../../lib/db.js";
import { hashPassword } from "../../lib/auth.js";
import { hashToken } from "../../lib/token.js";

// DB-dependent - skips cleanly without env configured locally, runs for
// real in CI (docs/backend/BACKEND_TESTING.md).
const canRun = Boolean(
  process.env["DATABASE_URL"] && process.env["SESSION_SECRET"] && process.env["SESSION_SALT"],
);

const db = canRun ? getDb() : null;
const createdUserIds: string[] = [];

interface ErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

async function createUser(deactivated = false): Promise<{ id: string; email: string }> {
  if (!db) throw new Error("db not available");
  const email = `reset-test-${randomUUID()}@example.com`;
  const user = await db
    .insertInto("users")
    .values({
      email,
      password_hash: await hashPassword("the-original-password"),
      role: "staff_marketing",
      deactivated_at: deactivated ? new Date() : null,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
  createdUserIds.push(user.id);
  return { id: user.id, email };
}

async function latestTokenFor(userId: string): Promise<string> {
  if (!db) throw new Error("db not available");
  const row = await db
    .selectFrom("password_reset_tokens")
    .selectAll()
    .where("user_id", "=", userId)
    .orderBy("created_at", "desc")
    .executeTakeFirstOrThrow();
  // The plaintext token never touches the database - request it back
  // through the same path the service layer used, by re-deriving it is
  // impossible (that's the point); tests instead capture the plaintext
  // token straight from requestPasswordReset's own return value where
  // needed. This helper is only used to assert a row exists / its shape.
  return row.token_hash;
}

afterEach(async () => {
  if (!db) return;
  for (const id of createdUserIds.splice(0)) {
    await db.deleteFrom("password_reset_tokens").where("user_id", "=", id).execute();
    await db.deleteFrom("access_log").where("user_id", "=", id).execute();
    await db.deleteFrom("users").where("id", "=", id).execute();
  }
});

describe("password reset", () => {
  it("gives an identical response for a real account, a nonexistent email, and a deactivated account", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const real = await createUser();
      const deactivated = await createUser(true);

      const responses = await Promise.all(
        [real.email, deactivated.email, `no-such-account-${randomUUID()}@example.com`].map(
          (email) =>
            app.inject({
              method: "POST",
              url: "/api/auth/password-reset/request",
              payload: { email },
            }),
        ),
      );

      for (const res of responses) {
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ success: true });
      }

      // Only the real, active account actually got a token row - the
      // identical HTTP response above must not mean identical internal
      // behavior, just identical *observable* behavior.
      const realTokens = db
        ? await db
            .selectFrom("password_reset_tokens")
            .selectAll()
            .where("user_id", "=", real.id)
            .execute()
        : [];
      expect(realTokens).toHaveLength(1);

      const deactivatedTokens = db
        ? await db
            .selectFrom("password_reset_tokens")
            .selectAll()
            .where("user_id", "=", deactivated.id)
            .execute()
        : [];
      expect(deactivatedTokens).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it("runs the full lifecycle: request -> confirm -> old password rejected, new password works", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const user = await createUser();

      await app.inject({
        method: "POST",
        url: "/api/auth/password-reset/request",
        payload: { email: user.email },
      });

      // The plaintext token was only ever sent by email (logged, since
      // no EMAIL_PROVIDER_API_KEY is configured in this test
      // environment) - recover it here the only other way it exists:
      // by brute-forcing it is infeasible by design, so instead this
      // test calls the service function directly to get a fresh,
      // known plaintext token for a deterministic confirm step.
      const { requestPasswordReset } = await import("./service.js");
      const result = await requestPasswordReset(db, user.email);
      if (!result.matched) throw new Error("expected a matched account");

      const confirm = await app.inject({
        method: "POST",
        url: "/api/auth/password-reset/confirm",
        payload: { token: result.token, newPassword: "a-brand-new-password" },
      });
      expect(confirm.statusCode).toBe(200);
      expect(confirm.json()).toEqual({ success: true });

      const oldLogin = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: user.email, password: "the-original-password" },
      });
      expect(oldLogin.statusCode).toBe(401);

      const newLogin = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: user.email, password: "a-brand-new-password" },
      });
      expect(newLogin.statusCode).toBe(200);

      // --- reusing the same token a second time must fail: single-use ---
      const reuse = await app.inject({
        method: "POST",
        url: "/api/auth/password-reset/confirm",
        payload: { token: result.token, newPassword: "yet-another-password" },
      });
      expect(reuse.statusCode).toBe(400);
      expect(reuse.json<ErrorBody>().error.code).toBe("VALIDATION_ERROR");

      // --- completion was audit-logged ---
      const auditRows = await db
        .selectFrom("access_log")
        .selectAll()
        .where("user_id", "=", user.id)
        .where("action", "=", "password_reset_completed")
        .execute();
      expect(auditRows).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("rejects an expired token and a garbage token, both without leaking which is which", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const user = await createUser();
      const expiredPlaintext = "expired-token-for-test-only";
      await db
        .insertInto("password_reset_tokens")
        .values({
          user_id: user.id,
          token_hash: hashToken(expiredPlaintext),
          expires_at: new Date(Date.now() - 1000),
        })
        .execute();

      const expired = await app.inject({
        method: "POST",
        url: "/api/auth/password-reset/confirm",
        payload: { token: expiredPlaintext, newPassword: "does-not-matter-here" },
      });
      expect(expired.statusCode).toBe(400);

      const garbage = await app.inject({
        method: "POST",
        url: "/api/auth/password-reset/confirm",
        payload: { token: "this-token-was-never-issued", newPassword: "does-not-matter-here" },
      });
      expect(garbage.statusCode).toBe(400);

      // Same error code/message for both - an expired-but-real token and
      // a wholly invented one are indistinguishable to the caller.
      expect(garbage.json<ErrorBody>().error.code).toBe(expired.json<ErrorBody>().error.code);
      expect(garbage.json<ErrorBody>().error.message).toBe(expired.json<ErrorBody>().error.message);
    } finally {
      await app.close();
    }
  });

  it("ignores a client-supplied role/userId in the confirm payload - role stays server-authoritative", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      // Password reset is deliberately reachable without a session (it's
      // how access is regained) - but confirming a reset must never
      // accept or honor a client-supplied role, division, or user id.
      // The confirm endpoint's schema has no such fields at all, so this
      // asserts the extra fields are silently ignored, not applied.
      const user = await createUser();
      const { requestPasswordReset } = await import("./service.js");
      const result = await requestPasswordReset(db, user.email);
      if (!result.matched) throw new Error("expected a matched account");

      const confirm = await app.inject({
        method: "POST",
        url: "/api/auth/password-reset/confirm",
        payload: {
          token: result.token,
          newPassword: "a-brand-new-password",
          role: "admin",
          userId: randomUUID(),
        },
      });
      expect(confirm.statusCode).toBe(200);

      const row = await db
        .selectFrom("users")
        .select(["role"])
        .where("id", "=", user.id)
        .executeTakeFirstOrThrow();
      expect(row.role).toBe("staff_marketing");
    } finally {
      await app.close();
    }
  });

  it("keeps the raw token hashed at rest, never storing it in plaintext", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const user = await createUser();
    const { requestPasswordReset } = await import("./service.js");
    const result = await requestPasswordReset(db, user.email);
    if (!result.matched) throw new Error("expected a matched account");

    const storedHash = await latestTokenFor(user.id);
    expect(storedHash).not.toBe(result.token);
    expect(storedHash).toBe(hashToken(result.token));
  });
});
