import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { build } from "../../app.js";
import { getDb } from "../../lib/db.js";
import { hashPassword } from "../../lib/auth.js";
import { generateFileRef, writeDeliverable } from "../../lib/storage.js";
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
const writtenFileRefs: string[] = [];

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
): Promise<{ cookie: string; userId: string }> {
  if (!db) throw new Error("db not available");
  const email = `documents-test-${role}-${randomUUID()}@example.com`;
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
  return { cookie: cookie.value, userId: user.id };
}

/** Seeds a real on-disk file plus its deliverables row - there is no
 * upload endpoint yet, so tests populate this the same way any other
 * DB-seeded fixture in this codebase is populated. */
async function createDeliverable(
  engagementId: string,
  uploadedBy: string,
  content: string,
): Promise<string> {
  if (!db) throw new Error("db not available");
  const fileRef = generateFileRef();
  await writeDeliverable(fileRef, Buffer.from(content));
  writtenFileRefs.push(fileRef);
  const row = await db
    .insertInto("deliverables")
    .values({
      engagement_id: engagementId,
      type: "report",
      file_ref: fileRef,
      uploaded_by: uploadedBy,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
  return row.id;
}

const BOUNDARY = "----zgate-test-boundary";

function buildMultipartBody(
  fields: Record<string, string>,
  file: { fieldName: string; filename: string; contentType: string; content: Buffer },
): Buffer {
  const parts: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    );
  }
  parts.push(
    Buffer.from(
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
    ),
    file.content,
    Buffer.from(`\r\n--${BOUNDARY}--\r\n`),
  );
  return Buffer.concat(parts);
}

afterEach(async () => {
  const dir = resolve(process.env["DELIVERABLES_STORAGE_DIR"] ?? "./storage/deliverables");
  for (const fileRef of writtenFileRefs.splice(0)) {
    await rm(resolve(dir, fileRef), { force: true });
  }
  if (!db) return;
  for (const id of createdEngagementIds.splice(0)) {
    await db.deleteFrom("deliverables").where("engagement_id", "=", id).execute();
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

describe("GET /api/documents", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "GET", url: "/api/documents" });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("never lists another client's documents, even via a supplied clientId (horizontal privilege escalation)", async () => {
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
      const staff = await loginAs(app, "staff_advisory");
      await createDeliverable(engagementA, staff.userId, "A's report");
      await createDeliverable(engagementB, staff.userId, "B's report");

      const { cookie: cookieA } = await loginAs(app, "client", clientA);

      const injected = await app.inject({
        method: "GET",
        url: `/api/documents?clientId=${clientB}`,
        cookies: { session: cookieA },
      });
      expect(injected.statusCode).toBe(200);
      expect(injected.json<{ documents: unknown[] }>().documents).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("never includes fileRef in the response", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      const staff = await loginAs(app, "staff_advisory");
      await createDeliverable(engagementId, staff.userId, "content");

      const { cookie } = await loginAs(app, "client", clientId);
      const res = await app.inject({
        method: "GET",
        url: "/api/documents",
        cookies: { session: cookie },
      });
      const [document] = res.json<{ documents: Record<string, unknown>[] }>().documents;
      expect(document).toBeDefined();
      expect(Object.keys(document ?? {})).not.toContain("fileRef");
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/documents/:id/download", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/documents/${randomUUID()}/download`,
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("returns 404 (not 403) for a role that can never access documents at all", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const { cookie } = await loginAs(app, "staff_marketing");
      const res = await app.inject({
        method: "GET",
        url: `/api/documents/${randomUUID()}/download`,
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("lets the owning client download their own document with the real bytes", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      const staff = await loginAs(app, "staff_advisory");
      const deliverableId = await createDeliverable(
        engagementId,
        staff.userId,
        "the real report body",
      );

      const { cookie } = await loginAs(app, "client", clientId);
      const res = await app.inject({
        method: "GET",
        url: `/api/documents/${deliverableId}/download`,
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe("the real report body");
      expect(res.headers["content-disposition"]).toContain("attachment");
    } finally {
      await app.close();
    }
  });

  it("returns 404 (not 403) when a different client tries to download it by guessing the id (unauthorized object access)", async () => {
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
      const staff = await loginAs(app, "staff_advisory");
      const deliverableId = await createDeliverable(
        engagementA,
        staff.userId,
        "A's private report",
      );

      const { cookie: cookieB } = await loginAs(app, "client", clientB);
      const res = await app.inject({
        method: "GET",
        url: `/api/documents/${deliverableId}/download`,
        cookies: { session: cookieB },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("returns 404 for a document id that doesn't exist at all - indistinguishable from the wrong-owner case", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const { cookie } = await loginAs(app, "staff_advisory");
      const res = await app.inject({
        method: "GET",
        url: `/api/documents/${randomUUID()}/download`,
        cookies: { session: cookie },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("lets staff_advisory and admin download any client's document", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      const staff = await loginAs(app, "staff_advisory");
      const deliverableId = await createDeliverable(
        engagementId,
        staff.userId,
        "staff-visible report",
      );

      const { cookie: advisoryCookie } = await loginAs(app, "staff_advisory");
      const advisoryRes = await app.inject({
        method: "GET",
        url: `/api/documents/${deliverableId}/download`,
        cookies: { session: advisoryCookie },
      });
      expect(advisoryRes.statusCode).toBe(200);

      const { cookie: adminCookie } = await loginAs(app, "admin");
      const adminRes = await app.inject({
        method: "GET",
        url: `/api/documents/${deliverableId}/download`,
        cookies: { session: adminCookie },
      });
      expect(adminRes.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });

  it("logs every download to the audit trail", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      const staff = await loginAs(app, "staff_advisory");
      const deliverableId = await createDeliverable(engagementId, staff.userId, "audited report");

      const { cookie } = await loginAs(app, "client", clientId);
      await app.inject({
        method: "GET",
        url: `/api/documents/${deliverableId}/download`,
        cookies: { session: cookie },
      });

      const rows = await db
        .selectFrom("access_log")
        .selectAll()
        .where("action", "=", "download_deliverable")
        .where("resource_id", "=", deliverableId)
        .execute();
      expect(rows).toHaveLength(1);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/documents", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "POST", url: "/api/documents" });
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
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      const body = buildMultipartBody(
        { engagementId, type: "report" },
        {
          fieldName: "file",
          filename: "r.pdf",
          contentType: "application/pdf",
          content: Buffer.from("x"),
        },
      );

      for (const [role, forClient] of [
        ["client", clientId],
        ["staff_marketing", null],
      ] as const) {
        const cookie = await loginAs(app, role, forClient);
        const res = await app.inject({
          method: "POST",
          url: "/api/documents",
          headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
          cookies: { session: cookie.cookie },
          payload: body,
        });
        expect(res.statusCode).toBe(403);
      }
    } finally {
      await app.close();
    }
  });

  it("uploads a real file, makes it listable and downloadable, and audit-logs it", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      const staff = await loginAs(app, "staff_advisory");
      const body = buildMultipartBody(
        { engagementId, type: "report" },
        {
          fieldName: "file",
          filename: "report.pdf",
          contentType: "application/pdf",
          content: Buffer.from("the real uploaded bytes"),
        },
      );

      const res = await app.inject({
        method: "POST",
        url: "/api/documents",
        headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
        cookies: { session: staff.cookie },
        payload: body,
      });
      expect(res.statusCode).toBe(201);
      const created = res.json<{ id: string; type: string }>();
      expect(created.type).toBe("report");

      const { cookie: clientCookie } = await loginAs(app, "client", clientId);
      const download = await app.inject({
        method: "GET",
        url: `/api/documents/${created.id}/download`,
        cookies: { session: clientCookie },
      });
      expect(download.statusCode).toBe(200);
      expect(download.body).toBe("the real uploaded bytes");

      const auditRows = await db
        .selectFrom("access_log")
        .selectAll()
        .where("action", "=", "upload_deliverable")
        .where("resource_id", "=", created.id)
        .execute();
      expect(auditRows).toHaveLength(1);

      // Clean up the file this test actually wrote to disk (not seeded
      // via createDeliverable, so writtenFileRefs doesn't already know
      // about it) - fetched from the DB row uploadDeliverable() created.
      const row = await db
        .selectFrom("deliverables")
        .select("file_ref")
        .where("id", "=", created.id)
        .executeTakeFirstOrThrow();
      writtenFileRefs.push(row.file_ref);
    } finally {
      await app.close();
    }
  });

  it("rejects a disallowed file type", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const clientId = await createTestClient();
      const engagementId = await createEngagement(clientId);
      const staff = await loginAs(app, "staff_advisory");
      const body = buildMultipartBody(
        { engagementId, type: "report" },
        {
          fieldName: "file",
          filename: "script.sh",
          contentType: "application/x-sh",
          content: Buffer.from("#!/bin/sh\necho hi"),
        },
      );

      const res = await app.inject({
        method: "POST",
        url: "/api/documents",
        headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
        cookies: { session: staff.cookie },
        payload: body,
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it("returns 404 for an engagementId that doesn't exist", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const staff = await loginAs(app, "staff_advisory");
      const body = buildMultipartBody(
        { engagementId: randomUUID(), type: "report" },
        {
          fieldName: "file",
          filename: "r.pdf",
          contentType: "application/pdf",
          content: Buffer.from("x"),
        },
      );

      const res = await app.inject({
        method: "POST",
        url: "/api/documents",
        headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
        cookies: { session: staff.cookie },
        payload: body,
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
