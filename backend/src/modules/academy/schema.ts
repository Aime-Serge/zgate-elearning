import { z } from "zod";

function requiredString(message: string, maxLength: number) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, message).max(maxLength),
  );
}

// FEAT-08.2: "a short enrollment form" - name/contact, plus which
// cohort. No email verification, no account creation required -
// enrollment/attendance/certification is Trainer-managed
// (docs/database/DATA_MODEL.md entity #22).
export const enrollmentInputSchema = z.object({
  name: requiredString("Enter the learner's name.", 200),
  contact: requiredString("Enter a way to reach the learner.", 200),
  cohortId: z.string().uuid("Choose a valid cohort."),
});

export type EnrollmentInput = z.infer<typeof enrollmentInputSchema>;

export const cohortsQuerySchema = z.object({
  courseId: z.string().uuid("courseId must be a valid id.").optional(),
});

export type CohortsQuery = z.infer<typeof cohortsQuerySchema>;

export const attendanceInputSchema = z.object({
  enrollmentId: z.string().uuid("enrollmentId must be a valid id."),
  sessionNumber: z.number().int().positive("sessionNumber must be a positive integer."),
  present: z.boolean(),
});

export type AttendanceInput = z.infer<typeof attendanceInputSchema>;

export const assessmentInputSchema = z.object({
  enrollmentId: z.string().uuid("enrollmentId must be a valid id."),
  passed: z.boolean(),
  // Course 2's pass criterion is a live demo, not a numeric score
  // (docs/business/OPEN_BUSINESS_QUESTIONS.md #12) - optional for
  // exactly that reason, not an oversight.
  score: z.number().min(0).max(100).optional(),
});

export type AssessmentInput = z.infer<typeof assessmentInputSchema>;

export const certificateInputSchema = z.object({
  enrollmentId: z.string().uuid("enrollmentId must be a valid id."),
});

export type CertificateInput = z.infer<typeof certificateInputSchema>;
