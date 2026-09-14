import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { build } from "../../app.js";
import { getDb } from "../../lib/db.js";
import { hashPassword } from "../../lib/auth.js";
import type { UserRole } from "../../lib/db.js";

// DB-dependent - skips cleanly without env configured locally, runs for
// real in CI (docs/backend/BACKEND_TESTING.md).
const canRun = Boolean(
  process.env["DATABASE_URL"] && process.env["SESSION_SECRET"] && process.env["SESSION_SALT"],
);

const db = canRun ? getDb() : null;
const createdUserIds: string[] = [];
const createdLeadIds: string[] = [];
const createdClientIds: string[] = [];

async function loginAs(app: FastifyInstance, role: UserRole): Promise<string> {
  if (!db) throw new Error("db not available");
  const email = `leads-test-${role}-${randomUUID()}@example.com`;
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
  // Leads before clients - a converted lead's converted_client_id FK
  // references clients, so deleting the client first (the order this
  // used to run in) fails with a foreign-key-violation error the moment
  // any test in this file actually converts a lead.
  for (const id of createdLeadIds.splice(0)) {
    await db.deleteFrom("leads").where("id", "=", id).execute();
  }
  for (const id of createdClientIds.splice(0)) {
    await db.deleteFrom("clients").where("id", "=", id).execute();
  }
  for (const id of createdUserIds.splice(0)) {
    await db.deleteFrom("access_log").where("user_id", "=", id).execute();
    await db.deleteFrom("users").where("id", "=", id).execute();
  }
});

describe("staff-facing lead endpoints", () => {
  it("rejects every staff endpoint for an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      expect((await app.inject({ method: "GET", url: "/api/leads" })).statusCode).toBe(401);
      expect(
        (await app.inject({ method: "POST", url: "/api/leads", payload: {} })).statusCode,
      ).toBe(401);
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/api/leads/${randomUUID()}/convert`,
            payload: {},
          })
        ).statusCode,
      ).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("enforces the exact role each endpoint documents in API_CONVENTIONS.md", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      // POST /api/leads is staff_marketing-only - staff_advisory (a
      // real, valid staff role, just not the right one for this
      // action) must be rejected.
      const advisoryCookie = await loginAs(app, "staff_advisory");
      const wrongRoleCreate = await app.inject({
        method: "POST",
        url: "/api/leads",
        cookies: { session: advisoryCookie },
        payload: { name: "Jean", contact: "jean@example.com", channel: "whatsapp" },
      });
      expect(wrongRoleCreate.statusCode).toBe(403);

      // POST /api/leads/:id/convert is staff_advisory/admin - staff_marketing
      // must be rejected, even for a lead that genuinely exists.
      const marketingCookie = await loginAs(app, "staff_marketing");
      const createRes = await app.inject({
        method: "POST",
        url: "/api/leads",
        cookies: { session: marketingCookie },
        payload: { name: "Aline", contact: "aline@example.com", channel: "facebook" },
      });
      expect(createRes.statusCode).toBe(201);

      const listRes = await app.inject({
        method: "GET",
        url: "/api/leads",
        cookies: { session: marketingCookie },
      });
      const lead = listRes
        .json<{ leads: { id: string; name: string }[] }>()
        .leads.find((l) => l.name === "Aline");
      expect(lead).toBeDefined();
      if (lead) createdLeadIds.push(lead.id);

      const wrongRoleConvert = await app.inject({
        method: "POST",
        url: `/api/leads/${lead?.id}/convert`,
        cookies: { session: marketingCookie },
        payload: { legalName: "Aline's Business" },
      });
      expect(wrongRoleConvert.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("runs the full lifecycle: manual create -> list/filter -> convert -> already-converted -> not-found", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const marketingCookie = await loginAs(app, "staff_marketing");
      const advisoryCookie = await loginAs(app, "staff_advisory");

      // --- create (manual, non-web channel) ---
      const uniqueName = `Solange-${randomUUID()}`;
      const createRes = await app.inject({
        method: "POST",
        url: "/api/leads",
        cookies: { session: marketingCookie },
        payload: {
          name: uniqueName,
          contact: "solange@example.com",
          channel: "whatsapp",
          statedNeed: "EBM help",
        },
      });
      expect(createRes.statusCode).toBe(201);

      // website is reserved for the public form, not manual entry
      const rejectedChannel = await app.inject({
        method: "POST",
        url: "/api/leads",
        cookies: { session: marketingCookie },
        payload: { name: "X", contact: "x@example.com", channel: "website" },
      });
      expect(rejectedChannel.statusCode).toBe(400);

      // --- list + filter by channel finds it; filtering by a
      // different channel does not ---
      const filteredIn = await app.inject({
        method: "GET",
        url: "/api/leads?channel=whatsapp",
        cookies: { session: marketingCookie },
      });
      const found = filteredIn
        .json<{ leads: { id: string; name: string; status: string }[] }>()
        .leads.find((l) => l.name === uniqueName);
      expect(found).toBeDefined();
      expect(found?.status).toBe("new");
      if (found) createdLeadIds.push(found.id);

      const filteredOut = await app.inject({
        method: "GET",
        url: "/api/leads?channel=linkedin",
        cookies: { session: marketingCookie },
      });
      expect(
        filteredOut.json<{ leads: { name: string }[] }>().leads.some((l) => l.name === uniqueName),
      ).toBe(false);

      // --- convert (staff_advisory) ---
      const convertRes = await app.inject({
        method: "POST",
        url: `/api/leads/${found?.id}/convert`,
        cookies: { session: advisoryCookie },
        payload: { legalName: `${uniqueName}'s Shop`, tin: "123456789" },
      });
      expect(convertRes.statusCode).toBe(200);
      const { clientId } = convertRes.json<{ clientId: string; leadId: string }>();
      expect(clientId).toBeTruthy();
      createdClientIds.push(clientId);

      // --- the lead's status/converted_client_id actually updated ---
      const afterConvert = await app.inject({
        method: "GET",
        url: "/api/leads?status=converted",
        cookies: { session: marketingCookie },
      });
      const convertedLead = afterConvert
        .json<{ leads: { id: string; convertedClientId: string | null }[] }>()
        .leads.find((l) => l.id === found?.id);
      expect(convertedLead?.convertedClientId).toBe(clientId);

      // --- the conversion was actually audit-logged
      // (docs/security/RBAC_SECURITY_MODEL.md's quarterly review depends
      // on this row existing, not just the HTTP response looking right) ---
      const auditRows = db
        ? await db
            .selectFrom("access_log")
            .selectAll()
            .where("resource_id", "=", clientId)
            .where("action", "=", "lead_converted")
            .execute()
        : [];
      expect(auditRows).toHaveLength(1);

      // --- converting again is a conflict, not a silent no-op ---
      const alreadyConverted = await app.inject({
        method: "POST",
        url: `/api/leads/${found?.id}/convert`,
        cookies: { session: advisoryCookie },
        payload: { legalName: "Should not be created" },
      });
      expect(alreadyConverted.statusCode).toBe(409);

      // --- converting a lead that doesn't exist at all ---
      const notFound = await app.inject({
        method: "POST",
        url: `/api/leads/${randomUUID()}/convert`,
        cookies: { session: advisoryCookie },
        payload: { legalName: "Nobody" },
      });
      expect(notFound.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
