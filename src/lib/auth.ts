/**
 * Password hashing. Never a reversible encryption, never a fast general-
 * purpose hash - bcrypt (a modern, deliberately slow algorithm) per
 * docs/database/DATA_SECURITY.md and docs/security/SECURITY_REQUIREMENTS.md
 * V2. This is the only place in the codebase that should ever call
 * bcrypt directly.
 */
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * A fixed, valid bcrypt hash of a placeholder string nothing real is
 * ever hashed against - used only to give a nonexistent-account login
 * attempt the same bcrypt.compare() cost a real, wrong-password attempt
 * incurs. Without this, "no such account" returns after a single fast
 * DB lookup while "wrong password" waits on a ~100ms+ bcrypt compare -
 * a measurable timing side-channel that defeats
 * docs/security/SECURITY_REQUIREMENTS.md V2's "never reveal which of
 * email/password was wrong" even though the response body is already
 * identical either way (CWE-208, observable timing discrepancy).
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$EHTvuYLaFvPXQCX14D96PeChYfbAtXxO7RRQilsvCrmdFQaGC6Jva";
