import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getDb } from "./db.js";
import { logAccess } from "./audit.js";

describe("logAccess", () => {
  it("writes a real, queryable row to access_log", async () => {
    // DB-dependent - skips cleanly without DATABASE_URL (same pattern as
    // src/modules/crm/routes.test.ts), runs for real in CI against the
    // ephemeral Postgres service container
    // (docs/backend/BACKEND_TESTING.md). getDb() is only ever called
    // inside this `it()`, never at the describe body's top level - a
    // top-level call would run (and throw on a missing DATABASE_URL)
    // even under describe.skip, since that only skips running the
    // test body, not collecting it.
    if (!process.env["DATABASE_URL"]) {
      console.warn("Skipping DB-dependent test: DATABASE_URL not set locally. Runs in CI.");
      return;
    }

    const db = getDb();
    const testEmail = `audit-test-${randomUUID()}@example.com`;

    const user = await db
      .insertInto("users")
      .values({
        email: testEmail,
        password_hash: "not-a-real-hash-test-fixture-only",
        role: "admin",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    try {
      await logAccess(db, {
        userId: user.id,
        action: "view_client_list",
        resourceType: "client",
        resourceId: randomUUID(),
      });

      const rows = await db
        .selectFrom("access_log")
        .selectAll()
        .where("user_id", "=", user.id)
        .execute();

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        user_id: user.id,
        action: "view_client_list",
        resource_type: "client",
      });
      expect(rows[0]?.occurred_at).toBeInstanceOf(Date);
    } finally {
      await db.deleteFrom("access_log").where("user_id", "=", user.id).execute();
      await db.deleteFrom("users").where("id", "=", user.id).execute();
    }
  });
});
