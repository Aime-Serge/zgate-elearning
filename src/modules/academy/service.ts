/**
 * academy module business logic - the only module that touches
 * courses/cohorts/learners/enrollments/attendance_records/assessments/
 * certificates (docs/architecture/MODULE_ARCHITECTURE.md).
 *
 * No "staff creates a course/cohort" workflow is backlogged (FEAT-08.x
 * only covers enrollment, attendance, and assessment/certificate) - the
 * same gap already accepted for Advisory's engagements. Courses are
 * seeded in the migration itself (a small, curriculum-approved, fixed
 * catalog); cohorts are DB-seeded in this module's own tests, same
 * established pattern.
 */
import type { Kysely } from "kysely";
import { AppError } from "../../lib/errors.js";
import { logAccess } from "../../lib/audit.js";
import { generateFileRef, writeStoredFile } from "../../lib/storage.js";
import type { Database, CohortStatus } from "../../lib/db.js";
import type { EnrollmentInput, AttendanceInput, AssessmentInput } from "./schema.js";

export interface CourseView {
  id: string;
  name: string;
  audience: string;
  duration: string;
  fee: string;
  totalSessions: number;
}

export async function listCourses(db: Kysely<Database>): Promise<CourseView[]> {
  const rows = await db
    .selectFrom("courses")
    .select(["id", "name", "audience", "duration", "fee", "total_sessions"])
    .orderBy("created_at", "asc")
    .execute();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    audience: row.audience,
    duration: row.duration,
    fee: row.fee,
    totalSessions: row.total_sessions,
  }));
}

export interface CohortView {
  id: string;
  courseId: string;
  courseName: string;
  label: string;
  startsAt: string;
  status: CohortStatus;
}

/**
 * Public mode (no `trainerId`): only cohorts still open for enrollment.
 * Staff mode (`trainerId` given, `admin` passes none to see all): every
 * cohort actually assigned to that Trainer - the real object-level
 * scope Academy's own role definition names (unlike Advisory's
 * engagements, which have no such tracking at all).
 */
export async function listCohorts(
  db: Kysely<Database>,
  filter: { courseId?: string | undefined; trainerId?: string | undefined; publicOnly: boolean },
): Promise<CohortView[]> {
  let query = db
    .selectFrom("cohorts")
    .innerJoin("courses", "courses.id", "cohorts.course_id")
    .select([
      "cohorts.id",
      "cohorts.course_id",
      "courses.name as course_name",
      "cohorts.label",
      "cohorts.starts_at",
      "cohorts.status",
    ])
    .orderBy("cohorts.starts_at", "asc");

  if (filter.courseId) {
    query = query.where("cohorts.course_id", "=", filter.courseId);
  }
  if (filter.trainerId) {
    query = query.where("cohorts.trainer_id", "=", filter.trainerId);
  }
  if (filter.publicOnly) {
    query = query.where("cohorts.status", "!=", "completed");
  }

  const rows = await query.execute();
  return rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    courseName: row.course_name,
    label: row.label,
    startsAt: toDateOnlyString(row.starts_at),
    status: row.status,
  }));
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getCohortTrainerId(
  db: Kysely<Database>,
  cohortId: string,
): Promise<string | null> {
  const row = await db
    .selectFrom("cohorts")
    .select("trainer_id")
    .where("id", "=", cohortId)
    .executeTakeFirst();
  return row?.trainer_id ?? null;
}

export async function getEnrollmentTrainerId(
  db: Kysely<Database>,
  enrollmentId: string,
): Promise<string | null> {
  const row = await db
    .selectFrom("enrollments")
    .innerJoin("cohorts", "cohorts.id", "enrollments.cohort_id")
    .where("enrollments.id", "=", enrollmentId)
    .select("cohorts.trainer_id")
    .executeTakeFirst();
  return row?.trainer_id ?? null;
}

/**
 * FEAT-08.2. Always creates a new learner row rather than attempting to
 * match an existing one by name/contact - a wrong contact-matching
 * heuristic risks merging two different people, a worse failure than an
 * occasional duplicate learner record (an accepted, documented
 * simplification, not an oversight).
 */
export async function createEnrollment(
  db: Kysely<Database>,
  input: EnrollmentInput,
): Promise<{ id: string }> {
  const cohort = await db
    .selectFrom("cohorts")
    .select(["id", "status"])
    .where("id", "=", input.cohortId)
    .executeTakeFirst();
  if (!cohort) {
    throw new AppError("VALIDATION_ERROR", "That cohort isn't available.", {
      cohortId: "Choose a valid cohort.",
    });
  }
  if (cohort.status === "completed") {
    throw new AppError("VALIDATION_ERROR", "That cohort has already finished.", {
      cohortId: "Choose a valid cohort.",
    });
  }

  return db.transaction().execute(async (trx) => {
    const learner = await trx
      .insertInto("learners")
      .values({ name: input.name, contact: input.contact })
      .returning("id")
      .executeTakeFirstOrThrow();

    const enrollment = await trx
      .insertInto("enrollments")
      .values({ learner_id: learner.id, cohort_id: input.cohortId })
      .returning("id")
      .executeTakeFirstOrThrow();

    return { id: enrollment.id };
  });
}

export interface RosterEntry {
  enrollmentId: string;
  learnerName: string;
  learnerContact: string;
  status: string;
  enrolledAt: string;
  confirmedAt: string | null;
  attendance: { sessionNumber: number; present: boolean }[];
  assessment: { passed: boolean; score: string | null } | null;
  certificateId: string | null;
}

/**
 * The Trainer's consolidated cohort-management view (FEAT-08.2-08.4) -
 * one call for everything needed to run a cohort, rather than four
 * separate round trips.
 */
export async function getCohortRoster(
  db: Kysely<Database>,
  cohortId: string,
): Promise<RosterEntry[]> {
  const enrollments = await db
    .selectFrom("enrollments")
    .innerJoin("learners", "learners.id", "enrollments.learner_id")
    .where("enrollments.cohort_id", "=", cohortId)
    .select([
      "enrollments.id",
      "learners.name as learner_name",
      "learners.contact as learner_contact",
      "enrollments.status",
      "enrollments.enrolled_at",
      "enrollments.confirmed_at",
    ])
    .orderBy("enrollments.enrolled_at", "asc")
    .execute();

  if (enrollments.length === 0) {
    return [];
  }

  const enrollmentIds = enrollments.map((e) => e.id);

  const attendanceRows = await db
    .selectFrom("attendance_records")
    .select(["enrollment_id", "session_number", "present"])
    .where("enrollment_id", "in", enrollmentIds)
    .execute();

  const assessmentRows = await db
    .selectFrom("assessments")
    .select(["enrollment_id", "passed", "score"])
    .where("enrollment_id", "in", enrollmentIds)
    .execute();

  const certificateRows = await db
    .selectFrom("certificates")
    .select(["id", "enrollment_id"])
    .where("enrollment_id", "in", enrollmentIds)
    .execute();

  return enrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,
    learnerName: enrollment.learner_name,
    learnerContact: enrollment.learner_contact,
    status: enrollment.status,
    enrolledAt: enrollment.enrolled_at.toISOString(),
    confirmedAt: enrollment.confirmed_at ? enrollment.confirmed_at.toISOString() : null,
    attendance: attendanceRows
      .filter((row) => row.enrollment_id === enrollment.id)
      .map((row) => ({ sessionNumber: row.session_number, present: row.present }))
      .sort((a, b) => a.sessionNumber - b.sessionNumber),
    assessment:
      assessmentRows
        .filter((row) => row.enrollment_id === enrollment.id)
        .map((row) => ({ passed: row.passed, score: row.score }))[0] ?? null,
    certificateId: certificateRows.find((row) => row.enrollment_id === enrollment.id)?.id ?? null,
  }));
}

export async function confirmEnrollment(
  db: Kysely<Database>,
  enrollmentId: string,
  staffUserId: string,
): Promise<{ id: string; confirmedAt: string }> {
  return db.transaction().execute(async (trx) => {
    const enrollment = await trx
      .selectFrom("enrollments")
      .select(["id", "status"])
      .where("id", "=", enrollmentId)
      .executeTakeFirst();

    if (!enrollment) {
      throw new AppError("NOT_FOUND", "Not found.");
    }
    if (enrollment.status !== "pending") {
      throw new AppError("CONFLICT", "This enrollment has already been confirmed or withdrawn.");
    }

    const confirmedAt = new Date();
    await trx
      .updateTable("enrollments")
      .set({ status: "confirmed", confirmed_at: confirmedAt, confirmed_by: staffUserId })
      .where("id", "=", enrollmentId)
      .execute();

    await logAccess(trx, {
      userId: staffUserId,
      action: "confirm_enrollment",
      resourceType: "enrollment",
      resourceId: enrollmentId,
    });

    return { id: enrollmentId, confirmedAt: confirmedAt.toISOString() };
  });
}

export async function recordAttendance(
  db: Kysely<Database>,
  input: AttendanceInput,
  staffUserId: string,
): Promise<void> {
  return db.transaction().execute(async (trx) => {
    await trx
      .insertInto("attendance_records")
      .values({
        enrollment_id: input.enrollmentId,
        session_number: input.sessionNumber,
        present: input.present,
        recorded_by: staffUserId,
      })
      .onConflict((oc) =>
        oc
          .columns(["enrollment_id", "session_number"])
          .doUpdateSet({
            present: input.present,
            recorded_by: staffUserId,
            recorded_at: new Date(),
          }),
      )
      .execute();

    await logAccess(trx, {
      userId: staffUserId,
      action: "record_attendance",
      resourceType: "enrollment",
      resourceId: input.enrollmentId,
    });
  });
}

export async function recordAssessment(
  db: Kysely<Database>,
  input: AssessmentInput,
  staffUserId: string,
): Promise<void> {
  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("assessments")
      .select("id")
      .where("enrollment_id", "=", input.enrollmentId)
      .executeTakeFirst();
    if (existing) {
      // No retake/remediation process is documented
      // (docs/business/OPEN_BUSINESS_QUESTIONS.md #12) - a second
      // assessment attempt is a conflict, not a silent overwrite.
      throw new AppError("CONFLICT", "This learner has already been assessed.");
    }

    await trx
      .insertInto("assessments")
      .values({
        enrollment_id: input.enrollmentId,
        passed: input.passed,
        score: input.score !== undefined ? input.score.toFixed(2) : null,
        assessed_by: staffUserId,
      })
      .execute();

    await logAccess(trx, {
      userId: staffUserId,
      action: "record_assessment",
      resourceType: "enrollment",
      resourceId: input.enrollmentId,
    });
  });
}

export interface IssuedCertificate {
  id: string;
  enrollmentId: string;
}

/**
 * Generates a plain, real, printable HTML certificate document - no PDF
 * library added for one document type at MVP scale
 * ("do not create an unnecessarily complex LMS"); a browser's own
 * print-to-PDF covers this.
 */
function renderCertificateHtml(params: {
  learnerName: string;
  courseName: string;
  issuedAt: Date;
}): string {
  const issuedDate = params.issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Certificate of Completion</title>
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 80px 40px; color: #0b0f1a; }
  h1 { font-size: 20px; letter-spacing: 4px; text-transform: uppercase; color: #5b6bfa; }
  .name { font-size: 36px; margin: 32px 0 8px; }
  .course { font-size: 20px; margin-bottom: 32px; }
  .date { font-size: 14px; color: #555; }
  .brand { margin-top: 64px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
</style>
</head>
<body>
  <h1>Certificate of Completion</h1>
  <p class="name">${escape(params.learnerName)}</p>
  <p class="course">has successfully completed ${escape(params.courseName)}</p>
  <p class="date">Issued ${issuedDate}</p>
  <p class="brand">Z-GATE Academy</p>
</body>
</html>`;
}

export async function issueCertificate(
  db: Kysely<Database>,
  enrollmentId: string,
  staffUserId: string,
): Promise<IssuedCertificate> {
  const enrollment = await db
    .selectFrom("enrollments")
    .innerJoin("cohorts", "cohorts.id", "enrollments.cohort_id")
    .innerJoin("courses", "courses.id", "cohorts.course_id")
    .innerJoin("learners", "learners.id", "enrollments.learner_id")
    .where("enrollments.id", "=", enrollmentId)
    .select(["enrollments.id", "learners.name as learner_name", "courses.name as course_name"])
    .executeTakeFirst();

  if (!enrollment) {
    throw new AppError("NOT_FOUND", "Not found.");
  }

  const assessment = await db
    .selectFrom("assessments")
    .select(["passed"])
    .where("enrollment_id", "=", enrollmentId)
    .executeTakeFirst();
  if (!assessment || !assessment.passed) {
    throw new AppError(
      "VALIDATION_ERROR",
      "A certificate can only be issued after a passing assessment is recorded.",
    );
  }

  const existing = await db
    .selectFrom("certificates")
    .select("id")
    .where("enrollment_id", "=", enrollmentId)
    .executeTakeFirst();
  if (existing) {
    throw new AppError("CONFLICT", "A certificate has already been issued for this learner.");
  }

  const issuedAt = new Date();
  const html = renderCertificateHtml({
    learnerName: enrollment.learner_name,
    courseName: enrollment.course_name,
    issuedAt,
  });
  const fileRef = generateFileRef();
  await writeStoredFile(fileRef, Buffer.from(html, "utf8"));

  return db.transaction().execute(async (trx) => {
    const certificate = await trx
      .insertInto("certificates")
      .values({ enrollment_id: enrollmentId, file_ref: fileRef, issued_by: staffUserId })
      .returning("id")
      .executeTakeFirstOrThrow();

    await logAccess(trx, {
      userId: staffUserId,
      action: "issue_certificate",
      resourceType: "certificate",
      resourceId: certificate.id,
    });

    return { id: certificate.id, enrollmentId };
  });
}

export interface CertificateForDownload {
  id: string;
  fileRef: string;
  trainerId: string;
  learnerUserId: string | null;
}

export async function getCertificateForDownload(
  db: Kysely<Database>,
  certificateId: string,
): Promise<CertificateForDownload> {
  const row = await db
    .selectFrom("certificates")
    .innerJoin("enrollments", "enrollments.id", "certificates.enrollment_id")
    .innerJoin("cohorts", "cohorts.id", "enrollments.cohort_id")
    .innerJoin("learners", "learners.id", "enrollments.learner_id")
    .where("certificates.id", "=", certificateId)
    .select([
      "certificates.id",
      "certificates.file_ref",
      "cohorts.trainer_id",
      "learners.user_id as learner_user_id",
    ])
    .executeTakeFirst();

  if (!row) {
    throw new AppError("NOT_FOUND", "Not found.");
  }

  return {
    id: row.id,
    fileRef: row.file_ref,
    trainerId: row.trainer_id,
    learnerUserId: row.learner_user_id,
  };
}
