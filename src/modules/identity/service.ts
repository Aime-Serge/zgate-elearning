/**
 * identity module business logic - the only module that touches the
 * users table (docs/architecture/MODULE_ARCHITECTURE.md).
 */
import type { Kysely } from "kysely";
import type { Database } from "../../lib/db.js";
import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from "../../lib/auth.js";
import { generateToken, hashToken } from "../../lib/token.js";
import { AppError } from "../../lib/errors.js";
import type { SessionUser } from "../../lib/session.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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
    // Still runs a real bcrypt compare, against a fixed dummy hash, so
    // this branch costs the same as the wrong-password branch below -
    // see DUMMY_PASSWORD_HASH's own comment for why this matters even
    // though the response is already identical either way.
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
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

export type PasswordResetRequestResult =
  | { matched: true; userId: string; token: string }
  // Same non-enumeration reasoning as CredentialCheckResult above - a
  // deactivated account is treated identically to no account at all,
  // both here and in the route's response.
  | { matched: false };

export async function requestPasswordReset(
  db: Kysely<Database>,
  email: string,
): Promise<PasswordResetRequestResult> {
  const user = await db
    .selectFrom("users")
    .select(["id", "deactivated_at"])
    .where("email", "=", email.toLowerCase())
    .executeTakeFirst();

  if (!user || user.deactivated_at) {
    return { matched: false };
  }

  const token = generateToken();
  await db
    .insertInto("password_reset_tokens")
    .values({
      user_id: user.id,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    })
    .execute();

  return { matched: true, userId: user.id, token };
}

/**
 * Incident containment (docs/security/INCIDENT_RESPONSE_REQUIREMENTS.md's
 * "disable a specific account... operationally possible from MVP" - the
 * previously-missing half of that requirement; deactivated_at was
 * already checked at login, but nothing could ever set it). Idempotent:
 * re-deactivating an already-deactivated account succeeds rather than
 * erroring, since an admin retrying a containment action under incident
 * pressure should never get a confusing failure for the right outcome
 * already being true.
 *
 * Does NOT invalidate a session already issued to this account - this
 * module's sessions are stateless, signed cookies with no server-side
 * store to revoke from (ADR-005), so an already-logged-in session for
 * this account remains valid until it expires or SESSION_SECRET is
 * rotated (which invalidates every session platform-wide, not just this
 * one - docs/devops/INCIDENT_RUNBOOK.md). This blocks the account from
 * logging in again, immediately; it is not a full "log this person out
 * right now" control.
 */
export async function deactivateUser(db: Kysely<Database>, userId: string): Promise<{ userId: string }> {
  const result = await db
    .updateTable("users")
    .set({ deactivated_at: new Date() })
    .where("id", "=", userId)
    .where("deactivated_at", "is", null)
    .executeTakeFirst();

  if (result.numUpdatedRows === 0n) {
    const existing = await db.selectFrom("users").select("id").where("id", "=", userId).executeTakeFirst();
    if (!existing) {
      throw new AppError("NOT_FOUND", "No account with that id.");
    }
    // Row exists but the WHERE didn't match - already deactivated.
    // Falls through as a success, per this function's idempotency
    // contract above.
  }

  return { userId };
}

export async function confirmPasswordReset(
  db: Kysely<Database>,
  token: string,
  newPassword: string,
): Promise<{ userId: string }> {
  const tokenHash = hashToken(token);

  return db.transaction().execute(async (trx) => {
    const row = await trx
      .selectFrom("password_reset_tokens")
      .select(["id", "user_id", "expires_at", "used_at"])
      .where("token_hash", "=", tokenHash)
      .executeTakeFirst();

    if (!row || row.used_at || row.expires_at.getTime() < Date.now()) {
      throw new AppError(
        "VALIDATION_ERROR",
        "This reset link is invalid or has expired. Request a new one.",
        { token: "Invalid or expired." },
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await trx
      .updateTable("users")
      .set({ password_hash: passwordHash })
      .where("id", "=", row.user_id)
      .execute();

    // Every outstanding token for this user is closed out, not just the
    // one just redeemed - a reset that succeeds should invalidate any
    // other in-flight reset links for the same account.
    await trx
      .updateTable("password_reset_tokens")
      .set({ used_at: new Date() })
      .where("user_id", "=", row.user_id)
      .where("used_at", "is", null)
      .execute();

    return { userId: row.user_id };
  });
}
