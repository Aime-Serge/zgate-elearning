/**
 * identity module business logic - the only module that touches the
 * users table (docs/architecture/MODULE_ARCHITECTURE.md).
 */
import type { Kysely } from "kysely";
import type { Database } from "../../lib/db.js";
import { verifyPassword } from "../../lib/auth.js";
import type { SessionUser } from "../../lib/session.js";

export type CredentialCheckResult =
  | { ok: true; user: SessionUser }
  // matchedUserId is set only when the email matched a real, non-
  // deactivated account (wrong password) - lets the caller audit-log
  // against a real access_log.user_id FK for that case, while still
  // returning the exact same generic error either way
  // (docs/backend/SECURITY_REQUIREMENTS.md V2: never reveal which of
  // email/password was wrong). Unset when no such account exists at
  // all - there's no valid FK target to log against in that case.
  | { ok: false; matchedUserId?: string };

export async function verifyCredentials(
  db: Kysely<Database>,
  email: string,
  password: string,
): Promise<CredentialCheckResult> {
  const user = await db
    .selectFrom("users")
    .select(["id", "password_hash", "role", "division", "client_id", "deactivated_at"])
    .where("email", "=", email.toLowerCase())
    .executeTakeFirst();

  if (!user || user.deactivated_at) {
    return { ok: false };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { ok: false, matchedUserId: user.id };
  }

  return {
    ok: true,
    user: {
      userId: user.id,
      role: user.role,
      division: user.division,
      clientId: user.client_id,
    },
  };
}
