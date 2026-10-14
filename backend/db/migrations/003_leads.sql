-- leads: CRM foundation. See docs/database/DATA_MODEL.md, FEAT-02.1/02.2/03.1/03.2.

CREATE TYPE lead_channel AS ENUM (
  'website',
  'whatsapp',
  'facebook',
  'linkedin',
  'other'
);

CREATE TYPE lead_status AS ENUM (
  'new',
  'qualified',
  'converted',
  'lost'
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  channel lead_channel NOT NULL,
  stated_need text,
  status lead_status NOT NULL DEFAULT 'new',
  converted_client_id uuid REFERENCES clients (id) ON DELETE RESTRICT,
  converted_at timestamptz,
  converted_by uuid REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- A lead marked converted must actually reference the Client it
  -- converted to. See docs/database/ENTITY_RELATIONSHIPS.md.
  CONSTRAINT leads_converted_requires_client
    CHECK (status != 'converted' OR converted_client_id IS NOT NULL)
);

CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_channel_idx ON leads (channel);
