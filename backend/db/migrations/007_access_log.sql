-- access_log: append-only audit trail. Operationalizes the Data Privacy
-- Policy's quarterly access-review commitment from day one.
-- See docs/database/DATA_LIFECYCLES.md, docs/database/DATA_SECURITY.md.
-- admin-role access only at the application layer - this table is itself
-- a sensitive record.

CREATE TABLE access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX access_log_resource_idx ON access_log (resource_type, resource_id);
CREATE INDEX access_log_occurred_at_idx ON access_log (occurred_at);

-- No UPDATE/DELETE path is granted to the application's database role for
-- this table in any environment - enforced at the connection-role/grant
-- level when real infrastructure is provisioned (pending ADR-004).
-- Documented here so the requirement isn't lost between phases.
