-- compliance_items: Advisory's due-date-driven work. "Overdue" is
-- deliberately not a stored state - see docs/database/DATA_LIFECYCLES.md.

CREATE TYPE compliance_item_type AS ENUM (
  'close_out',
  'vat_ebm_filing',
  'annual_return',
  'urgent_issue'
);

CREATE TABLE compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements (id) ON DELETE RESTRICT,
  type compliance_item_type NOT NULL,
  due_date date NOT NULL,
  completed_at timestamptz,
  completed_by uuid REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Can't attribute a completion to someone without recording when it
  -- happened. See docs/database/ENTITY_RELATIONSHIPS.md.
  CONSTRAINT compliance_items_completed_by_requires_completed_at
    CHECK (completed_by IS NULL OR completed_at IS NOT NULL)
);

-- Partial index: only pending items matter for FEAT-06.1's due-date sort.
CREATE INDEX compliance_items_pending_due_date_idx
  ON compliance_items (engagement_id, due_date)
  WHERE completed_at IS NULL;
