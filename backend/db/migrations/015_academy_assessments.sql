-- assessments: one pass/fail (+ optional score) entry per learner
-- (FEAT-08.4) - "no retake, remediation, or partial-credit process is
-- documented" (docs/business/OPEN_BUSINESS_QUESTIONS.md #12), so none
-- is built: the unique index below makes a second assessment for the
-- same enrollment a database-level conflict, not a silently-allowed
-- retake. `score` is nullable - Course 2's pass criterion is a live
-- demo, not a numeric score (per the same open question), so the
-- Trainer's pass/fail judgment is the field of record either way, not
-- a server-computed threshold.

CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments (id) ON DELETE RESTRICT,
  passed boolean NOT NULL,
  score numeric(5, 2),
  assessed_at timestamptz NOT NULL DEFAULT now(),
  assessed_by uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX assessments_enrollment_unique_idx ON assessments (enrollment_id);
