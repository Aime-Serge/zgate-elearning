/**
 * academy module routes. FEAT-08.1 (public course/cohort listing),
 * FEAT-08.2 (enrollment + confirmation), FEAT-08.3 (attendance),
 * FEAT-08.4 (assessment + certificate).
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../../lib/db.js";
import { validationError, AppError } from "../../lib/errors.js";
import { getSessionUser } from "../../lib/session.js";
import { requireRole } from "../../lib/authz.js";
import { logAccess } from "../../lib/audit.js";
import { readStoredFile } from "../../lib/storage.js";
import {
  enrollmentInputSchema,
  cohortsQuerySchema,
  attendanceInputSchema,
  assessmentInputSchema,
  certificateInputSchema,
} from "./schema.js";
import {
  listCourses,
  listCohorts,
  createEnrollment,
  getCohortTrainerId,
  getEnrollmentTrainerId,
  getCohortRoster,
  confirmEnrollment,
  recordAttendance,
  recordAssessment,
  issueCertificate,
  getCertificateForDownload,
} from "./service.js";

/** A Trainer only ever manages their own assigned cohorts; `admin` sees
 * every cohort. Unlike Advisory's engagements, Academy's own role
 * definition names cohort assignment directly, and cohorts.trainer_id
 * actually tracks it - so this is a real check, not the "everyone with
 * the role" stand-in documented in lib/engagementAccess.ts. */
function assertTrainerAccess(user: { role: string; userId: string }, trainerId: string): void {
  if (user.role === "admin") return;
  if (user.role === "staff_academy" && user.userId === trainerId) return;
  throw new AppError("NOT_FOUND", "Not found.");
}

export function registerAcademyRoutes(app: FastifyInstance): void {
  app.get("/api/academy/courses", async (_request, reply) => {
    const courses = await listCourses(getDb());
    await reply.send({ courses });
  });

  app.get("/api/academy/cohorts", async (request, reply) => {
    const parsed = cohortsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw validationError({ courseId: parsed.error.issues[0]?.message ?? "Invalid courseId." });
    }

    // Optional session: an unauthenticated visitor sees the public,
    // open-for-enrollment view; a Trainer/admin sees their own
    // assignment scope instead. Reading the session here (rather than
    // requireRole) is deliberate - this endpoint has a real
    // unauthenticated mode, unlike every role-gated one in this module.
    let trainerId: string | undefined;
    let publicOnly = true;
    try {
      const user = getSessionUser(request);
      if (user.role === "staff_academy") {
        trainerId = user.userId;
        publicOnly = false;
      } else if (user.role === "admin") {
        publicOnly = false;
      }
    } catch {
      // No session - stays in public mode.
    }

    const cohorts = await listCohorts(getDb(), {
      courseId: parsed.data.courseId,
      trainerId,
      publicOnly,
    });
    await reply.send({ cohorts });
  });

  app.post(
    "/api/academy/enrollments",
    // Aggressive-ish per-IP limit - unauthenticated, public, the same
    // spam/abuse class as the CRM contact form
    // (docs/backend/API_SECURITY.md's rate-limiting table).
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = enrollmentInputSchema.safeParse(request.body);
      if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string" && !(key in fields)) fields[key] = issue.message;
        }
        throw validationError(fields);
      }

      const enrollment = await createEnrollment(getDb(), parsed.data);
      await reply.code(201).send({ id: enrollment.id });
    },
  );

  app.get<{ Params: { id: string } }>("/api/academy/cohorts/:id/roster", async (request, reply) => {
    const user = requireRole("staff_academy", "admin")(request);
    const cohortId = request.params.id;
    if (!cohortId) {
      throw new AppError("VALIDATION_ERROR", "A cohort id is required.");
    }

    const db = getDb();
    const trainerId = await getCohortTrainerId(db, cohortId);
    if (trainerId === null) {
      throw new AppError("NOT_FOUND", "Not found.");
    }
    assertTrainerAccess(user, trainerId);

    const roster = await getCohortRoster(db, cohortId);
    await logAccess(db, {
      userId: user.userId,
      action: "view_cohort_roster",
      resourceType: "cohort",
      resourceId: cohortId,
    });

    await reply.send({ roster });
  });

  app.post<{ Params: { id: string } }>(
    "/api/academy/enrollments/:id/confirm",
    async (request, reply) => {
      const user = requireRole("staff_academy", "admin")(request);
      const enrollmentId = request.params.id;
      if (!enrollmentId) {
        throw new AppError("VALIDATION_ERROR", "An enrollment id is required.");
      }

      const db = getDb();
      const trainerId = await getEnrollmentTrainerId(db, enrollmentId);
      if (trainerId === null) {
        throw new AppError("NOT_FOUND", "Not found.");
      }
      assertTrainerAccess(user, trainerId);

      const result = await confirmEnrollment(db, enrollmentId, user.userId);
      await reply.send(result);
    },
  );

  app.post("/api/academy/attendance", async (request, reply) => {
    const user = requireRole("staff_academy", "admin")(request);
    const parsed = attendanceInputSchema.safeParse(request.body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fields)) fields[key] = issue.message;
      }
      throw validationError(fields);
    }

    const db = getDb();
    const trainerId = await getEnrollmentTrainerId(db, parsed.data.enrollmentId);
    if (trainerId === null) {
      throw new AppError("NOT_FOUND", "Not found.");
    }
    assertTrainerAccess(user, trainerId);

    await recordAttendance(db, parsed.data, user.userId);
    await reply.send({ success: true });
  });

  app.post("/api/academy/assessments", async (request, reply) => {
    const user = requireRole("staff_academy", "admin")(request);
    const parsed = assessmentInputSchema.safeParse(request.body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fields)) fields[key] = issue.message;
      }
      throw validationError(fields);
    }

    const db = getDb();
    const trainerId = await getEnrollmentTrainerId(db, parsed.data.enrollmentId);
    if (trainerId === null) {
      throw new AppError("NOT_FOUND", "Not found.");
    }
    assertTrainerAccess(user, trainerId);

    await recordAssessment(db, parsed.data, user.userId);
    await reply.code(201).send({ success: true });
  });

  app.post("/api/academy/certificates", async (request, reply) => {
    const user = requireRole("staff_academy", "admin")(request);
    const parsed = certificateInputSchema.safeParse(request.body);
    if (!parsed.success) {
      throw validationError({
        enrollmentId: parsed.error.issues[0]?.message ?? "Invalid enrollmentId.",
      });
    }

    const db = getDb();
    const trainerId = await getEnrollmentTrainerId(db, parsed.data.enrollmentId);
    if (trainerId === null) {
      throw new AppError("NOT_FOUND", "Not found.");
    }
    assertTrainerAccess(user, trainerId);

    const certificate = await issueCertificate(db, parsed.data.enrollmentId, user.userId);
    await reply.code(201).send(certificate);
  });

  app.get<{ Params: { id: string } }>(
    "/api/academy/certificates/:id/download",
    async (request, reply) => {
      const user = getSessionUser(request);
      // Role-level check first: staff_advisory/staff_marketing have no
      // Academy access at all per RBAC_SECURITY_MODEL.md's permission
      // matrix ("No access" / "aggregate only, never individual") - a
      // clean 403 here, not the object-level 404 below, which exists to
      // avoid leaking existence to a caller who *could* plausibly own
      // this class of resource (another trainer, another learner).
      if (user.role !== "client" && user.role !== "staff_academy" && user.role !== "admin") {
        throw new AppError("FORBIDDEN", "You don't have permission to do that.");
      }

      const certificateId = request.params.id;
      if (!certificateId) {
        throw new AppError("VALIDATION_ERROR", "A certificate id is required.");
      }

      const db = getDb();
      const certificate = await getCertificateForDownload(db, certificateId);

      // Three ways in: the assigned Trainer, admin, or the learner
      // themselves (only when their platform account is actually linked
      // to that learner record - docs/security/RBAC_SECURITY_MODEL.md's
      // "Read own enrollment, if a learner"). Everyone else - a wrong
      // trainer, a different learner - gets the same 404 an
      // unauthorized object access would.
      const isAssignedTrainer =
        user.role === "staff_academy" && user.userId === certificate.trainerId;
      const isAdmin = user.role === "admin";
      const isOwningLearner = user.role === "client" && user.userId === certificate.learnerUserId;
      if (!isAssignedTrainer && !isAdmin && !isOwningLearner) {
        throw new AppError("NOT_FOUND", "Not found.");
      }

      await logAccess(db, {
        userId: user.userId,
        action: "download_certificate",
        resourceType: "certificate",
        resourceId: certificate.id,
      });

      const stream = readStoredFile(certificate.fileRef);
      await reply
        .header("Content-Disposition", `inline; filename="certificate-${certificate.id}.html"`)
        .header("Content-Type", "text/html; charset=utf-8")
        .send(stream);
    },
  );
}
