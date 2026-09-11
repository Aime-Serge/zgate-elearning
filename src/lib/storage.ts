/**
 * Local-disk deliverable storage - docs/architecture/ARCHITECTURE.md's
 * own pre-approved fallback ("object storage OR server-local disk with
 * automated backup, region pending the same data-residency ADR as the
 * database"). Object storage is deferred until ADR-004's hosting region
 * is decided; server-local disk is not a novel choice invented here,
 * it's the other half of that already-approved either/or. Swapping to
 * object storage later only touches this file - callers only ever see
 * `readDeliverable`/`writeDeliverable`, never a path.
 *
 * `deliverables.file_ref` is an opaque storage pointer (never a path
 * the client sees or supplies) - never served with execute permissions,
 * never a directly guessable/public URL (docs/security/
 * SECURITY_REQUIREMENTS.md V12); the only access path is this module,
 * called from the authorization-checked download route.
 */
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";

function getStorageDir(): string {
  return resolve(process.env["DELIVERABLES_STORAGE_DIR"] ?? "./storage/deliverables");
}

/**
 * Generates a fresh, random storage pointer - never derived from a
 * client- or staff-supplied filename, which closes off path-traversal
 * at the source rather than only sanitizing it on the way back out.
 */
export function generateFileRef(): string {
  return randomUUID();
}

export async function writeDeliverable(fileRef: string, content: Buffer): Promise<void> {
  const dir = getStorageDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, fileRef), content);
}

/**
 * Resolves a storage pointer to a readable stream. Throws if the
 * resolved path would escape the storage root - defense in depth on
 * top of generateFileRef() never producing a traversal-capable value in
 * the first place (docs/security/SECURITY_REQUIREMENTS.md V12).
 */
export function readDeliverable(fileRef: string): Readable {
  const dir = getStorageDir();
  const path = resolve(join(dir, fileRef));
  if (path !== dir && !path.startsWith(dir + sep)) {
    throw new Error("Resolved storage path escapes the storage root.");
  }
  return createReadStream(path);
}
