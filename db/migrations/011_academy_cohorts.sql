-- cohorts: one scheduled run of a course, assigned to exactly one
-- Trainer (docs/security/RBAC_SECURITY_MODEL.md: "staff:academy...
-- for cohorts they're assigned to" - unlike Advisory's engagements,
-- which have no assignment tracking at all, Academy's own role
-- definition names cohort assignment directly, so this table is
-- designed with it from the start rather than as a later retrofit).
--
-- No "staff creates a cohort" workflow is backlogged (same gap as
-- Advisory's engagements/compliance_items) - cohorts are seeded
-- directly for now, consistent with that established precedent.

CREATE TYPE cohort_status AS ENUM ('upcoming', 'active', 'completed');

CREATE TABLE cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses (id) ON DELETE RESTRICT,
  trainer_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  label text NOT NULL,
  starts_at date NOT NULL,
  status cohort_status NOT NULL DEFAULT 'upcoming',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cohorts_trainer_id_idx ON cohorts (trainer_id);
CREATE INDEX cohorts_course_id_idx ON cohorts (course_id);
