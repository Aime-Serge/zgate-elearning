/**
 * identity module business logic - the only module that touches the
 * users table (docs/architecture/MODULE_ARCHITECTURE.md).
 */
import type { Kysely } from "kysely";
import type { Database } from "../../lib/db.js";
import { hashPassword, verifyPassword } from "../../lib/auth.js";
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
