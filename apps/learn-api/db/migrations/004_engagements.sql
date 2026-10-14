-- engagements: a Client's relationship with one division under one
-- Service Schedule. See docs/database/DATA_MODEL.md.

CREATE TYPE service_schedule AS ENUM ('A', 'B', 'C', 'D');

CREATE TYPE engagement_status AS ENUM (
  'active',
  'completed',
  'terminated'
);

CREATE TABLE engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients (id) ON DELETE RESTRICT,
  division division NOT NULL,
  service_schedule service_schedule NOT NULL,
  status engagement_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX engagements_client_id_idx ON engagements (client_id);
