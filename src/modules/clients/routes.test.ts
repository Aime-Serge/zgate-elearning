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
const createdEngagementIds: string[] = [];

async function createTestClient(): Promise<string> {
  if (!db) throw new Error("db not available");
  const { id } = await createClient(db, { legalName: `Test Co ${randomUUID()}` });
  createdClientIds.push(id);
  return id;
}

async function createEngagement(clientId: string): Promise<string> {
  if (!db) throw new Error("db not available");
  const row = await db
    .insertInto("engagements")
    .values({ client_id: clientId, division: "advisory", service_schedule: "A" })
    .returning("id")
    .executeTakeFirstOrThrow();
  createdEngagementIds.push(row.id);
  return row.id;
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
  for (const id of createdEngagementIds.splice(0)) {
    await db.deleteFrom("compliance_items").where("engagement_id", "=", id).execute();
    await db.deleteFrom("engagements").where("id", "=", id).execute();
  }
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

describe("GET /api/clients", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "GET", url: "/api/clients" });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("rejects client and staff_marketing (vertical privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const clientId = await createTestClient();
      for (const [role, forClient] of [
        ["client", clientId],
        ["staff_marketing", null],
      ] as const) {
        const cookie = await loginAs(app, role, forClient);
        const res = await app.inject({
          method: "GET",
          url: "/api/clients",
          cookies: { session: cookie },
        });
        expect(res.statusCode).toBe(403);
      }
    } finally {
      await app.close();
    }
  });

  it("never includes tin, registeredAddress, or contact details in the list view", async () => {
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
        .set({ tin: "sensitive-tin", registered_address: "sensitive-address" })
        .where("id", "=", clientId)
        .execute();

      const cookie = await loginAs(app, "staff_advisory");
      const res = await app.inject({
        method: "GET",
        url: "/api/clients",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(200);
      const clients = res.json<{ clients: Record<string, unknown>[] }>().clients;
      const match = clients.find((c) => c["id"] === clientId);
      expect(match).toBeDefined();
      expect(Object.keys(match ?? {})).not.toContain("tin");
      expect(Object.keys(match ?? {})).not.toContain("registeredAddress");
      expect(Object.keys(match ?? {})).not.toContain("primaryContactName");
    } finally {
      await app.close();
    }
  });

  it("sorts nearest-due-first and computes status, and logs the access", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const soonClient = await createTestClient();
      const laterClient = await createTestClient();
      const soonEngagement = await createEngagement(soonClient);
      const laterEngagement = await createEngagement(laterClient);

      await db
        .insertInto("compliance_items")
        .values([
          {
            engagement_id: soonEngagement,
            type: "vat_ebm_filing",
            due_date: new Date("2020-01-01"),
          },
          {
            engagement_id: laterEngagement,
            type: "annual_return",
            due_date: new Date("2099-01-01"),
          },
        ])
        .execute();

      const cookie = await loginAs(app, "admin");
      const res = await app.inject({
        method: "GET",
        url: "/api/clients",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(200);
      const clients = res.json<{
        clients: { id: string; status: string; nextDueDate: string | null }[];
      }>().clients;

      const soonIndex = clients.findIndex((c) => c.id === soonClient);
      const laterIndex = clients.findIndex((c) => c.id === laterClient);
      expect(soonIndex).toBeGreaterThanOrEqual(0);
      expect(laterIndex).toBeGreaterThan(soonIndex);
      expect(clients[soonIndex]?.status).toBe("attention_needed");
      expect(clients[laterIndex]?.status).toBe("on_track");

      const auditRows = await db
        .selectFrom("access_log")
        .selectAll()
        .where("action", "=", "view_client_list")
        .where("resource_id", "=", soonClient)
        .execute();
      expect(auditRows.length).toBeGreaterThan(0);
    } finally {
      await app.close();
    }
  });
});
