-- attendance_records: per-session, per-enrollment presence
-- (FEAT-08.3) - "a checklist per session per cohort". Feeds the
-- 90%-session-completion SLA metric (Schedule B).

CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments (id) ON DELETE RESTRICT,
  session_number integer NOT NULL CHECK (session_number > 0),
  present boolean NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT
);

-- One attendance mark per learner per session - re-marking updates the
-- existing row (application-layer upsert), not a growing history of
-- corrections.
CREATE UNIQUE INDEX attendance_records_enrollment_session_unique_idx
  ON attendance_records (enrollment_id, session_number);
