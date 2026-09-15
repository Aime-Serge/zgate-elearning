-- users: staff and client accounts in one table, differentiated by role.
-- See docs/database/DATA_MODEL.md, docs/database/DATA_SECURITY.md.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM (
  'client',
  'staff_advisory',
  'staff_marketing',
  'admin'
);

CREATE TYPE division AS ENUM (
  'advisory',
  'academy',
  'tech',
  'data'
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  -- Never plaintext. Application layer writes a modern, slow password
  -- hash here (Argon2id/bcrypt) - see docs/database/DATA_SECURITY.md.
  password_hash text NOT NULL,
  role user_role NOT NULL,
  division division,
  client_id uuid, -- FK added in 002_clients.sql once clients exists
  created_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,

  -- A client-role account always links to exactly one Client; a
  -- staff/admin account never does. Database-level backstop for
  -- docs/security/THREAT_MODEL.md's Critical client-to-staff
  -- privilege-escalation concern.
  CONSTRAINT users_client_role_requires_client_id
    CHECK (role != 'client' OR client_id IS NOT NULL),
  CONSTRAINT users_non_client_role_has_no_client_id
    CHECK (role = 'client' OR client_id IS NULL)
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (lower(email));
