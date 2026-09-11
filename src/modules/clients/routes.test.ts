import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { build } from "../../app.js";
import { getDb } from "../../lib/db.js";
import { hashPassword } from "../../lib/auth.js";
import { createClient } from "./service.js";
import type { UserRole } from "../../lib/db.js";

// DB-dependent - skips cleanly without env configured locally, runs for
// real in CI (docs/backend/BACKEND_TESTING.md).
const canRun = Boolean(
  process.env["DATABASE_URL"] && process.env["SESSION_SECRET"] && process.env["SESSION_SALT"],
);

const db = canRun ? getDb() : null;
const createdUserIds: string[] = [];
const createdClientIds: string[] = [];

async function createTestClient(): Promise<string> {
  if (!db) throw new Error("db not available");
  const { id } = await createClient(db, { legalName: `Test Co ${randomUUID()}` });
  createdClientIds.push(id);
  return id;
}

async function loginAs(
  app: FastifyInstance,
  role: UserRole,
  clientId: string | null = null,
): Promise<string> {
  if (!db) throw new Error("db not available");
  const email = `clients-test-${role}-${randomUUID()}@example.com`;
  const password = "a-real-test-password";
  const user = await db
    .insertInto("users")
    .values({ email, password_hash: await hashPassword(password), role, client_id: clientId })
    .returning("id")
    .executeTakeFirstOrThrow();
  createdUserIds.push(user.id);

  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });
  const cookie = login.cookies.find((c) => c.name === "session");
  if (!cookie) throw new Error("login did not set a session cookie");
  return cookie.value;
}

afterEach(async () => {
  if (!db) return;
  for (const id of createdUserIds.splice(0)) {
    await db.deleteFrom("access_log").where("user_id", "=", id).execute();
    await db.deleteFrom("users").where("id", "=", id).execute();
  }
  for (const id of createdClientIds.splice(0)) {
    await db.deleteFrom("clients").where("id", "=", id).execute();
  }
});

describe("GET /api/clients/me", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "GET", url: "/api/clients/me" });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("rejects every non-client role (vertical privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      for (const role of ["staff_marketing", "staff_advisory", "admin"] as const) {
        const cookie = await loginAs(app, role);
        const res = await app.inject({
          method: "GET",
          url: "/api/clients/me",
          cookies: { session: cookie },
        });
        expect(res.statusCode).toBe(403);
      }
    } finally {
      await app.close();
    }
  });

  it("returns exactly the caller's own client record, never tin", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      await db
        .updateTable("clients")
        .set({ tin: "should-never-be-returned" })
        .where("id", "=", clientId)
        .execute();
      const cookie = await loginAs(app, "client", clientId);

      const res = await app.inject({
        method: "GET",
        url: "/api/clients/me",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ id: string; legalName: string; primaryContactName: string | null }>();
      expect(body.id).toBe(clientId);
      expect(Object.keys(body)).not.toContain("tin");
    } finally {
      await app.close();
    }
  });
});
