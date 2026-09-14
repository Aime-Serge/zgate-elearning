import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
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
const createdLearnerIds: string[] = [];
const createdCohortIds: string[] = [];
const createdClientIds: string[] = [];
const writtenFileRefs: string[] = [];

/** A `client`-role login needs a real clients row - the database's own
 * check constraint (users_client_role_requires_client_id) rejects
 * `client_id IS NULL` for that role. */
async function loginAsClient(app: FastifyInstance): Promise<{ cookie: string; userId: string }> {
  if (!db) throw new Error("db not available");
  const { id: clientId } = await createClient(db, { legalName: `Test Co ${randomUUID()}` });
  createdClientIds.push(clientId);
  return loginAs(app, "client", clientId);
}

async function loginAs(
  app: FastifyInstance,
  role: UserRole,
  clientId: string | null = null,
): Promise<{ cookie: string; userId: string }> {
  if (!db) throw new Error("db not available");
  const email = `academy-test-${role}-${randomUUID()}@example.com`;
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

async function getFirstCourseId(): Promise<string> {
  if (!db) throw new Error("db not available");
  const course = await db.selectFrom("courses").select("id").executeTakeFirstOrThrow();
  return course.id;
}

async function createCohort(
  courseId: string,
  trainerId: string,
  status: "upcoming" | "active" | "completed" = "upcoming",
): Promise<string> {
  if (!db) throw new Error("db not available");
  const cohort = await db
    .insertInto("cohorts")
    .values({
      course_id: courseId,
      trainer_id: trainerId,
      label: `Test cohort ${randomUUID()}`,
      starts_at: new Date("2026-06-01"),
      status,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
  createdCohortIds.push(cohort.id);
  return cohort.id;
}

async function createEnrollmentDirect(
  cohortId: string,
  learnerName = "Test Learner",
): Promise<string> {
  if (!db) throw new Error("db not available");
  const learner = await db
    .insertInto("learners")
    .values({ name: learnerName, contact: `${randomUUID()}@example.com` })
    .returning("id")
    .executeTakeFirstOrThrow();
  createdLearnerIds.push(learner.id);

  const enrollment = await db
    .insertInto("enrollments")
    .values({ learner_id: learner.id, cohort_id: cohortId })
    .returning("id")
    .executeTakeFirstOrThrow();
  return enrollment.id;
}

afterEach(async () => {
  const dir = resolve(process.env["DELIVERABLES_STORAGE_DIR"] ?? "./storage/deliverables");
  for (const fileRef of writtenFileRefs.splice(0)) {
    await rm(resolve(dir, fileRef), { force: true });
  }
  if (!db) return;
  for (const cohortId of createdCohortIds.splice(0)) {
    const enrollments = await db
      .selectFrom("enrollments")
      .select("id")
      .where("cohort_id", "=", cohortId)
      .execute();
    for (const e of enrollments) {
      await db.deleteFrom("certificates").where("enrollment_id", "=", e.id).execute();
      await db.deleteFrom("assessments").where("enrollment_id", "=", e.id).execute();
      await db.deleteFrom("attendance_records").where("enrollment_id", "=", e.id).execute();
    }
    await db.deleteFrom("enrollments").where("cohort_id", "=", cohortId).execute();
    await db.deleteFrom("cohorts").where("id", "=", cohortId).execute();
  }
  for (const id of createdLearnerIds.splice(0)) {
    await db.deleteFrom("learners").where("id", "=", id).execute();
  }
  for (const id of createdUserIds.splice(0)) {
    await db.deleteFrom("access_log").where("user_id", "=", id).execute();
    await db.deleteFrom("users").where("id", "=", id).execute();
  }
  for (const id of createdClientIds.splice(0)) {
    await db.deleteFrom("clients").where("id", "=", id).execute();
  }
});

describe("GET /api/academy/courses", () => {
  it("is public and returns the seeded catalog", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({ method: "GET", url: "/api/academy/courses" });
      expect(res.statusCode).toBe(200);
      expect(res.json<{ courses: unknown[] }>().courses.length).toBeGreaterThanOrEqual(2);
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/academy/cohorts", () => {
  it("public mode never returns completed cohorts; staff mode scopes to the caller's own cohorts", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainerA = await loginAs(app, "staff_academy");
      const trainerB = await loginAs(app, "staff_academy");
      const openCohort = await createCohort(courseId, trainerA.userId, "upcoming");
      const completedCohort = await createCohort(courseId, trainerA.userId, "completed");
      const otherTrainerCohort = await createCohort(courseId, trainerB.userId, "upcoming");

      const publicRes = await app.inject({ method: "GET", url: "/api/academy/cohorts" });
      const publicIds = publicRes.json<{ cohorts: { id: string }[] }>().cohorts.map((c) => c.id);
      expect(publicIds).toContain(openCohort);
      expect(publicIds).not.toContain(completedCohort);

      const trainerRes = await app.inject({
        method: "GET",
        url: "/api/academy/cohorts",
        cookies: { session: trainerA.cookie },
      });
      const trainerIds = trainerRes.json<{ cohorts: { id: string }[] }>().cohorts.map((c) => c.id);
      expect(trainerIds).toContain(openCohort);
      expect(trainerIds).toContain(completedCohort);
      // Horizontal scoping: Trainer A never sees Trainer B's cohort,
      // even though both are staff_academy.
      expect(trainerIds).not.toContain(otherTrainerCohort);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/academy/enrollments", () => {
  it("is public and creates a pending enrollment", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId);

      const res = await app.inject({
        method: "POST",
        url: "/api/academy/enrollments",
        payload: { name: "Aline Learner", contact: "aline@example.com", cohortId },
      });
      expect(res.statusCode).toBe(201);

      const roster = await app.inject({
        method: "GET",
        url: `/api/academy/cohorts/${cohortId}/roster`,
        cookies: { session: trainer.cookie },
      });
      const entry = roster
        .json<{ roster: { learnerName: string; status: string }[] }>()
        .roster.find((r) => r.learnerName === "Aline Learner");
      expect(entry?.status).toBe("pending");
    } finally {
      await app.close();
    }
  });

  it("rejects enrollment into a completed cohort", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId, "completed");

      const res = await app.inject({
        method: "POST",
        url: "/api/academy/enrollments",
        payload: { name: "Test", contact: "test@example.com", cohortId },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/academy/cohorts/:id/roster - trainer scoping and learner privacy", () => {
  it("rejects an unauthenticated caller", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const res = await app.inject({
        method: "GET",
        url: `/api/academy/cohorts/${randomUUID()}/roster`,
      });
      expect(res.statusCode).toBe(401);
    } finally {
      await app.close();
    }
  });

  it("rejects roles with no Academy access (vertical privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId);

      for (const role of ["staff_marketing", "staff_advisory", "client"] as const) {
        // "client" needs a real clients row behind it (the database's own
        // check constraint, users_client_role_requires_client_id) - every
        // other role here can log in with no client_id at all.
        const caller = role === "client" ? await loginAsClient(app) : await loginAs(app, role);
        const res = await app.inject({
          method: "GET",
          url: `/api/academy/cohorts/${cohortId}/roster`,
          cookies: { session: caller.cookie },
        });
        expect(res.statusCode).toBe(403);
      }
    } finally {
      await app.close();
    }
  });

  it("returns 404 (not 403) when a different Trainer requests a cohort they're not assigned to (horizontal privilege escalation)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainerA = await loginAs(app, "staff_academy");
      const trainerB = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainerA.userId);
      await createEnrollmentDirect(cohortId, "Private Learner");

      const res = await app.inject({
        method: "GET",
        url: `/api/academy/cohorts/${cohortId}/roster`,
        cookies: { session: trainerB.cookie },
      });
      expect(res.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("lets the assigned Trainer and admin see the full roster, including learner contact", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId);
      await createEnrollmentDirect(cohortId, "Visible Learner");

      const trainerRes = await app.inject({
        method: "GET",
        url: `/api/academy/cohorts/${cohortId}/roster`,
        cookies: { session: trainer.cookie },
      });
      expect(trainerRes.statusCode).toBe(200);
      expect(
        trainerRes
          .json<{ roster: { learnerName: string }[] }>()
          .roster.some((r) => r.learnerName === "Visible Learner"),
      ).toBe(true);

      const admin = await loginAs(app, "admin");
      const adminRes = await app.inject({
        method: "GET",
        url: `/api/academy/cohorts/${cohortId}/roster`,
        cookies: { session: admin.cookie },
      });
      expect(adminRes.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/academy/enrollments/:id/confirm", () => {
  it("confirms once, conflicts on a second attempt, and is trainer-scoped", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainerA = await loginAs(app, "staff_academy");
      const trainerB = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainerA.userId);
      const enrollmentId = await createEnrollmentDirect(cohortId);

      const wrongTrainer = await app.inject({
        method: "POST",
        url: `/api/academy/enrollments/${enrollmentId}/confirm`,
        cookies: { session: trainerB.cookie },
      });
      expect(wrongTrainer.statusCode).toBe(404);

      const confirm = await app.inject({
        method: "POST",
        url: `/api/academy/enrollments/${enrollmentId}/confirm`,
        cookies: { session: trainerA.cookie },
      });
      expect(confirm.statusCode).toBe(200);

      const again = await app.inject({
        method: "POST",
        url: `/api/academy/enrollments/${enrollmentId}/confirm`,
        cookies: { session: trainerA.cookie },
      });
      expect(again.statusCode).toBe(409);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/academy/attendance", () => {
  it("records and updates (upserts) attendance, trainer-scoped", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId);
      const enrollmentId = await createEnrollmentDirect(cohortId);

      const mark = await app.inject({
        method: "POST",
        url: "/api/academy/attendance",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId, sessionNumber: 1, present: true },
      });
      expect(mark.statusCode).toBe(200);

      const update = await app.inject({
        method: "POST",
        url: "/api/academy/attendance",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId, sessionNumber: 1, present: false },
      });
      expect(update.statusCode).toBe(200);

      const rows = await db
        .selectFrom("attendance_records")
        .selectAll()
        .where("enrollment_id", "=", enrollmentId)
        .execute();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.present).toBe(false);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/academy/assessments and certificates", () => {
  it("blocks a certificate until a passing assessment exists, then issues one exactly once", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId);
      const enrollmentId = await createEnrollmentDirect(cohortId);

      const tooEarly = await app.inject({
        method: "POST",
        url: "/api/academy/certificates",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId },
      });
      expect(tooEarly.statusCode).toBe(400);

      const assess = await app.inject({
        method: "POST",
        url: "/api/academy/assessments",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId, passed: true, score: 85 },
      });
      expect(assess.statusCode).toBe(201);

      const retake = await app.inject({
        method: "POST",
        url: "/api/academy/assessments",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId, passed: true, score: 90 },
      });
      expect(retake.statusCode).toBe(409);

      const issue = await app.inject({
        method: "POST",
        url: "/api/academy/certificates",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId },
      });
      expect(issue.statusCode).toBe(201);
      const certificateId = issue.json<{ id: string }>().id;

      const row = await db
        .selectFrom("certificates")
        .select("file_ref")
        .where("id", "=", certificateId)
        .executeTakeFirstOrThrow();
      writtenFileRefs.push(row.file_ref);

      const reissue = await app.inject({
        method: "POST",
        url: "/api/academy/certificates",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId },
      });
      expect(reissue.statusCode).toBe(409);
    } finally {
      await app.close();
    }
  });
});

describe("GET /api/academy/certificates/:id/download - learner privacy", () => {
  it("rejects roles with no Academy access at all (403, not 404)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    const app = await build();
    try {
      const marketer = await loginAs(app, "staff_marketing");
      const res = await app.inject({
        method: "GET",
        url: `/api/academy/certificates/${randomUUID()}/download`,
        cookies: { session: marketer.cookie },
      });
      expect(res.statusCode).toBe(403);
    } finally {
      await app.close();
    }
  });

  it("never lets one client/learner download another learner's certificate (horizontal privilege escalation, private information)", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId);
      const enrollmentId = await createEnrollmentDirect(cohortId);

      await app.inject({
        method: "POST",
        url: "/api/academy/assessments",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId, passed: true, score: 95 },
      });
      const issue = await app.inject({
        method: "POST",
        url: "/api/academy/certificates",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId },
      });
      const certificateId = issue.json<{ id: string }>().id;
      const certRow = await db
        .selectFrom("certificates")
        .select("file_ref")
        .where("id", "=", certificateId)
        .executeTakeFirstOrThrow();
      writtenFileRefs.push(certRow.file_ref);

      // An unrelated client account (not linked to this learner) must
      // never be able to fetch this certificate by guessing its id.
      const unrelatedClient = await loginAsClient(app);
      const res = await app.inject({
        method: "GET",
        url: `/api/academy/certificates/${certificateId}/download`,
        cookies: { session: unrelatedClient.cookie },
      });
      expect(res.statusCode).toBe(404);

      // The assigned Trainer and admin can, though.
      const trainerDownload = await app.inject({
        method: "GET",
        url: `/api/academy/certificates/${certificateId}/download`,
        cookies: { session: trainer.cookie },
      });
      expect(trainerDownload.statusCode).toBe(200);
      expect(trainerDownload.body).toContain("Certificate of Completion");
    } finally {
      await app.close();
    }
  });

  it("lets a learner linked to their own platform account download their own certificate", async () => {
    if (!canRun) {
      console.warn("Skipping DB-dependent test: env not configured locally. Runs in CI.");
      return;
    }
    if (!db) throw new Error("db not available");
    const app = await build();
    try {
      const courseId = await getFirstCourseId();
      const trainer = await loginAs(app, "staff_academy");
      const cohortId = await createCohort(courseId, trainer.userId);

      // A learner who IS also a platform client account, linked via
      // learners.user_id.
      const learnerAccount = await loginAsClient(app);
      const learner = await db
        .insertInto("learners")
        .values({
          name: "Linked Learner",
          contact: "linked@example.com",
          user_id: learnerAccount.userId,
        })
        .returning("id")
        .executeTakeFirstOrThrow();
      createdLearnerIds.push(learner.id);
      const enrollment = await db
        .insertInto("enrollments")
        .values({ learner_id: learner.id, cohort_id: cohortId })
        .returning("id")
        .executeTakeFirstOrThrow();

      await app.inject({
        method: "POST",
        url: "/api/academy/assessments",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId: enrollment.id, passed: true, score: 100 },
      });
      const issue = await app.inject({
        method: "POST",
        url: "/api/academy/certificates",
        cookies: { session: trainer.cookie },
        payload: { enrollmentId: enrollment.id },
      });
      const certificateId = issue.json<{ id: string }>().id;
      const certRow = await db
        .selectFrom("certificates")
        .select("file_ref")
        .where("id", "=", certificateId)
        .executeTakeFirstOrThrow();
      writtenFileRefs.push(certRow.file_ref);

      const res = await app.inject({
        method: "GET",
        url: `/api/academy/certificates/${certificateId}/download`,
        cookies: { session: learnerAccount.cookie },
      });
      expect(res.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});
