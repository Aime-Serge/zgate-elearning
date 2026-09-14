import { z } from "zod";

/**
 * Same dual-mode shape as the advisory module's query schema -
 * `clientId` required for staff, forbidden/ignored for `client`
 * (docs/backend/API_CONVENTIONS.md).
 */
export const documentsQuerySchema = z.object({
  clientId: z.string().uuid("clientId must be a valid id.").optional(),
});

export type DocumentsQuery = z.infer<typeof documentsQuerySchema>;

export const deliverableTypeSchema = z.enum(["report", "filing_copy", "other"]);

export const uploadFieldsSchema = z.object({
  engagementId: z.string().uuid("engagementId must be a valid id."),
  type: deliverableTypeSchema,
});

export type UploadFields = z.infer<typeof uploadFieldsSchema>;

/**
 * File-type allowlist (docs/security/SECURITY_REQUIREMENTS.md V5/V12) -
 * exactly the document formats an Advisory deliverable is: a scanned/
 * generated filing copy or a bookkeeping report, never an executable or
 * script. 10MB is a generous ceiling for a single-document upload at
 * this scale, not a size a legitimate compliance document approaches.
 */
export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
