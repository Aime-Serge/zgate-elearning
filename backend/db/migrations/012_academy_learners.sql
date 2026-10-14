-- learners: deliberately separate from `users`
-- (docs/database/DATA_MODEL.md entity #22) - most Academy learners have
-- no platform login at all; enrollment/attendance/certification is
-- entirely Trainer-managed (FEAT-08.2-08.4). `user_id` is nullable and
-- set only for the rare learner who is also a `client`-role account
-- (docs/security/RBAC_SECURITY_MODEL.md's "Read own enrollment, if a
-- learner" permission).

CREATE TABLE learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- A given platform account maps to at most one learner record.
CREATE UNIQUE INDEX learners_user_id_unique_idx ON learners (user_id) WHERE user_id IS NOT NULL;
