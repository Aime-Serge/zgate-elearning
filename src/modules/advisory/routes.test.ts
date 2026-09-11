import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { build } from "../../app.js";
import { getDb } from "../../lib/db.js";
import { hashPassword } from "../../lib/auth.js";
import { createClient } from "../clients/service.js";
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
  const email = `advisory-test-${role}-${randomUUID()}@example.com`;
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

describe("GET /api/advisory/compliance-items", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "GET", url: "/api/advisory/compliance-items" });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("rejects a role with no documented access to this module (vertical privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const cookie = await loginAs(app, "staff_marketing");
      const res = await app.inject({
        method: "GET",
        url: "/api/advisory/compliance-items",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("never lets one client see another client's compliance items, even via a supplied clientId (horizontal privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientA = await createTestClient();
      const clientB = await createTestClient();
      const engagementA = await createEngagement(clientA);
      const engagementB = await createEngagement(clientB);

      await db
        .insertInto("compliance_items")
        .values({
          engagement_id: engagementA,
          type: "vat_ebm_filing",
          due_date: new Date("2026-01-15"),
        })
        .execute();
      await db
        .insertInto("compliance_items")
        .values({
          engagement_id: engagementB,
          type: "annual_return",
          due_date: new Date("2026-02-01"),
        })
        .execute();

      const cookieA = await loginAs(app, "client", clientA);

      // Plain request - only A's item.
      const plain = await app.inject({
        method: "GET",
        url: "/api/advisory/compliance-items",
        cookies: { session: cookieA },
      });
      expect(plain.statusCode).toBe(200);
      const plainItems = plain.json<{ items: { type: string }[] }>().items;
      expect(plainItems).toHaveLength(1);
      expect(plainItems[0]?.type).toBe("vat_ebm_filing");

      // Attempting to inject clientB's id as a query param must be
      // silently ignored, not honored - the session-derived clientId is
      // the only value ever used for the client role.
      const injected = await app.inject({
        method: "GET",
        url: `/api/advisory/compliance-items?clientId=${clientB}`,
        cookies: { session: cookieA },
      });
      expect(injected.statusCode).toBe(200);
      const injectedItems = injected.json<{ items: { type: string }[] }>().items;
      expect(injectedItems).toHaveLength(1);
      expect(injectedItems[0]?.type).toBe("vat_ebm_filing");
    } finally {
      await app.close();
    }
  });

  it("requires clientId for staff and honors it once supplied", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      await db
        .insertInto("compliance_items")
        .values({
          engagement_id: engagementId,
          type: "close_out",
          due_date: new Date("2026-01-15"),
        })
        .execute();

      const staffCookie = await loginAs(app, "staff_advisory");

      const missingClientId = await app.inject({
        method: "GET",
        url: "/api/advisory/compliance-items",
        cookies: { session: staffCookie },
      });
      expect(missingClientId.statusCode).toBe(400);

      const withClientId = await app.inject({
        method: "GET",
        url: `/api/advisory/compliance-items?clientId=${clientId}`,
        cookies: { session: staffCookie },
      });
      expect(withClientId.statusCode).toBe(200);
      expect(withClientId.json<{ items: unknown[] }>().items).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("computes isOverdue correctly and sorts pending items soonest-due-first, ahead of completed ones", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);

      // A far-future pending item, a past-due pending item, and a
      // completed item that's also technically past its due date (must
      // NOT read as overdue - it's done).
      await db
        .insertInto("compliance_items")
        .values([
          { engagement_id: engagementId, type: "annual_return", due_date: new Date("2099-01-01") },
          { engagement_id: engagementId, type: "urgent_issue", due_date: new Date("2020-01-01") },
          {
            engagement_id: engagementId,
            type: "close_out",
            due_date: new Date("2020-06-01"),
            completed_at: new Date("2020-06-01"),
          },
        ])
        .execute();

      const cookie = await loginAs(app, "client", clientId);
      const res = await app.inject({
        method: "GET",
        url: "/api/advisory/compliance-items",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(200);
      const items = res.json<{
        items: { type: string; dueDate: string; completedAt: string | null; isOverdue: boolean }[];
      }>().items;

      expect(items).toHaveLength(3);
      // Pending items first, soonest-due first; completed item last.
      expect(items[0]?.type).toBe("urgent_issue");
      expect(items[0]?.isOverdue).toBe(true);
      expect(items[1]?.type).toBe("annual_return");
      expect(items[1]?.isOverdue).toBe(false);
      expect(items[2]?.type).toBe("close_out");
      expect(items[2]?.isOverdue).toBe(false);
      expect(items[2]?.completedAt).not.toBeNull();
    } finally {
      await app.close();
    }
  });
});
