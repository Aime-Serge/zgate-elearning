-- enrollments: a learner's registration in one cohort (FEAT-08.2).
-- "pending" until a Trainer confirms with one action - the enrollment-
-- confirmation SLA target (Schedule B, 2 business days) is measured
-- from enrolled_at to confirmed_at.

CREATE TYPE enrollment_status AS ENUM ('pending', 'confirmed', 'withdrawn');

CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learners (id) ON DELETE RESTRICT,
  cohort_id uuid NOT NULL REFERENCES cohorts (id) ON DELETE RESTRICT,
  status enrollment_status NOT NULL DEFAULT 'pending',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES users (id) ON DELETE RESTRICT,

  -- Same pattern as compliance_items.completed_by: can't attribute a
  -- confirmation to someone without recording when it happened.
  CONSTRAINT enrollments_confirmed_by_requires_confirmed_at
    CHECK (confirmed_by IS NULL OR confirmed_at IS NOT NULL)
);

-- A learner enrolls in a given cohort at most once.
CREATE UNIQUE INDEX enrollments_learner_cohort_unique_idx ON enrollments (learner_id, cohort_id);
CREATE INDEX enrollments_cohort_id_idx ON enrollments (cohort_id);
