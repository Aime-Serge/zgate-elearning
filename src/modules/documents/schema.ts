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
