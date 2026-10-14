import { z } from "zod";

/**
 * `clientId` is required for staff, forbidden/ignored for the `client`
 * role - enforced in the route handler (the role determines which
 * branch runs at all), not by this schema alone.
 */
export const complianceItemsQuerySchema = z.object({
  clientId: z.string().uuid("clientId must be a valid id.").optional(),
});

export type ComplianceItemsQuery = z.infer<typeof complianceItemsQuerySchema>;
