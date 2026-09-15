-- certificates: one generated, timestamped document per passed
-- enrollment (FEAT-08.4) - the 5-business-day issuance SLA target
-- (Schedule B) is measured from the pass in `assessments` to
-- `issued_at`. `file_ref` is the same kind of opaque local-disk storage
-- pointer as deliverables.file_ref (lib/storage.ts) - never a direct/
-- guessable URL, mediated entirely through an authorization-checked
-- download endpoint (docs/security/SECURITY_REQUIREMENTS.md V12).

CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments (id) ON DELETE RESTRICT,
  file_ref text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT
);

-- One certificate per enrollment - a passed assessment issues at most
-- one certificate, not a growing reissue history.
CREATE UNIQUE INDEX certificates_enrollment_unique_idx ON certificates (enrollment_id);
