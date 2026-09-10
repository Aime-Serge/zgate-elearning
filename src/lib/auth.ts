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
