/**
 * Verifies an uploaded file's actual content against its claimed MIME
 * type, by checking the bytes every real file of that type starts with
 * (docs/security/SECURITY_REQUIREMENTS.md V5/V12's "type allowlist").
 * A multipart part's `Content-Type` is asserted by the caller and
 * trivially spoofable - checking it alone isn't real type validation,
 * only a client-supplied claim. This closes that gap without a new
 * dependency: every format on the allowlist has a well-known, stable
 * leading byte sequence.
 */
const SIGNATURES: Record<string, readonly (readonly number[])[]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // "%PDF"
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  // .xlsx/.docx are both OOXML-in-a-ZIP containers - the ZIP local-file-
  // header signature is what's actually verifiable from the leading
  // bytes; distinguishing xlsx from docx specifically requires parsing
  // the archive's internal manifest, out of scope for a leading-bytes
  // check. Still a real improvement over trusting the claimed type.
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
  ],
};

export function matchesClaimedType(content: Buffer, claimedMimeType: string): boolean {
  const signatures = SIGNATURES[claimedMimeType];
  if (!signatures) {
    return false;
  }
  return signatures.some((signature) => signature.every((byte, index) => content[index] === byte));
}
