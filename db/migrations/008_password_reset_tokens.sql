-- password_reset_tokens: single-use, time-limited tokens for the
-- password-recovery flow (docs/security/SECURITY_REQUIREMENTS.md V2:
-- "reset tokens are single-use and time-limited").
--
-- Stores a hash of the token, never the token itself - same principle
-- as users.password_hash (docs/database/DATA_SECURITY.md). Unlike a
-- password, a reset token is a 256-bit server-generated random value,
-- not a human-chosen low-entropy secret - a fast cryptographic hash
-- (SHA-256, applied in the application layer) is the standard, correct
-- choice here, not bcrypt; bcrypt's deliberate slowness exists to resist
-- brute-forcing a *guessable* secret, which a random 256-bit token isn't.

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX password_reset_tokens_token_hash_idx ON password_reset_tokens (token_hash);
CREATE INDEX password_reset_tokens_user_id_idx ON password_reset_tokens (user_id);
