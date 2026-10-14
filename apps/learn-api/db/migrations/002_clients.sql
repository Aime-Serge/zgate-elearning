-- clients: the core relationship record. See docs/database/DATA_MODEL.md.

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  -- Highest-sensitivity field in this schema - field-level encryption
  -- required at the application layer. See docs/database/DATA_SECURITY.md.
  -- Nullable: a Client record can exist before TIN is confirmed during
  -- onboarding; enforced complete before an Advisory engagement activates.
  tin text,
  registered_address text,
  primary_contact_name text,
  primary_contact_channel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Soft delete only - see docs/database/DATA_LIFECYCLES.md. No hard
  -- delete path exists until the statutory retention period is confirmed
  -- (docs/business/OPEN_BUSINESS_QUESTIONS.md #9).
  deleted_at timestamptz
);

-- Now that clients exists, wire up the FK deferred from 001_users.sql.
-- RESTRICT, not CASCADE - see docs/database/ENTITY_RELATIONSHIPS.md.
ALTER TABLE users
  ADD CONSTRAINT users_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT;
