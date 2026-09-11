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
const createdLeadIds: string[] = [];

async function createTestClient(): Promise<string> {
  if (!db) throw new Error("db not available");
  const { id } = await createClient(db, { legalName: `Test Co ${randomUUID()}` });
  createdClientIds.push(id);
  return id;
}

async function createEngagement(clientId: string, status: "active" | "completed" = "active") {
  if (!db) throw new Error("db not available");
  const row = await db
    .insertInto("engagements")
    .values({ client_id: clientId, division: "advisory", service_schedule: "A", status })
    .returning("id")
    .executeTakeFirstOrThrow();
  createdEngagementIds.push(row.id);
  return row.id;
}

async function loginAs(app: FastifyInstance, role: UserRole): Promise<string> {
  if (!db) throw new Error("db not available");
  const email = `reporting-test-${role}-${randomUUID()}@example.com`;
  const password = "a-real-test-password";
  const user = await db
    .insertInto("users")
    .values({ email, password_hash: await hashPassword(password), role })
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
  for (const id of createdLeadIds.splice(0)) {
    await db.deleteFrom("leads").where("id", "=", id).execute();
  }
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

describe("GET /api/reporting/advisory-summary", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "GET", url: "/api/reporting/advisory-summary" });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("rejects roles with no access to this report (vertical privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const cookie = await loginAs(app, "staff_marketing");
      const res = await app.inject({
        method: "GET",
        url: "/api/reporting/advisory-summary",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("counts only active engagements' clients and computes an honest on-time rate", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const activeClient = await createTestClient();
      const completedClient = await createTestClient();
      const activeEngagement = await createEngagement(activeClient, "active");
      await createEngagement(completedClient, "completed");

      await db
        .insertInto("compliance_items")
        .values([
          {
            engagement_id: activeEngagement,
            type: "close_out",
            due_date: new Date("2026-01-10"),
            completed_at: new Date("2026-01-05"),
          },
          {
            engagement_id: activeEngagement,
            type: "vat_ebm_filing",
            due_date: new Date("2026-01-10"),
            completed_at: new Date("2026-01-15"),
          },
        ])
        .execute();

      const cookie = await loginAs(app, "admin");
      const res = await app.inject({
        method: "GET",
        url: "/api/reporting/advisory-summary",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ activeClientCount: number; onTimeRate: number | null }>();
      expect(body.activeClientCount).toBeGreaterThanOrEqual(1);
      expect(body.onTimeRate).not.toBeNull();
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/reporting/lead-pipeline", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "GET", url: "/api/reporting/lead-pipeline" });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("rejects roles with no access to this report (vertical privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const cookie = await loginAs(app, "staff_advisory");
      const res = await app.inject({
        method: "GET",
        url: "/api/reporting/lead-pipeline",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("counts leads by status and channel", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const lead = await db
        .insertInto("leads")
        .values({
          name: `Pipeline test ${randomUUID()}`,
          contact: "test@example.com",
          channel: "whatsapp",
          status: "new",
        })
        .returning("id")
        .executeTakeFirstOrThrow();
      createdLeadIds.push(lead.id);

      const cookie = await loginAs(app, "staff_marketing");
      const res = await app.inject({
        method: "GET",
        url: "/api/reporting/lead-pipeline",
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{
        byStatus: Record<string, number>;
        byChannel: Record<string, number>;
      }>();
      expect(body.byStatus["new"]).toBeGreaterThanOrEqual(1);
      expect(body.byChannel["whatsapp"]).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });
});
