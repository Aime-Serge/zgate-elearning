-- deliverables: also covers "Document" (docs/database/DATA_MODEL.md #16 -
-- merged, not a separate table). FEAT-05.2/06.3.

CREATE TYPE deliverable_type AS ENUM ('report', 'filing_copy', 'other');

CREATE TABLE deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements (id) ON DELETE RESTRICT,
  type deliverable_type NOT NULL,
  -- Storage pointer, not the file itself. No direct/guessable public URL -
  -- access mediated at the application layer (docs/security/THREAT_MODEL.md #7).
  file_ref text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX deliverables_engagement_id_idx ON deliverables (engagement_id);
