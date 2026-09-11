/**
 * Random tokens for single-use, time-limited flows (password reset -
 * docs/security/SECURITY_REQUIREMENTS.md V2). Deliberately separate
 * from lib/auth.ts's bcrypt password hashing: a reset token is a
 * 256-bit, server-generated random value, not a human-chosen low-
 * entropy secret, so a fast cryptographic hash for at-rest storage is
 * the standard, correct choice here - bcrypt's deliberate slowness
 * exists to resist brute-forcing a *guessable* secret, which this isn't.
 */
import { randomBytes, createHash } from "node:crypto";

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
