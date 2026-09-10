/**
 * Zod schemas for the crm module. Shared, in intent, with the frontend's
 * React Hook Form validation once that package exists (docs/frontend/
 * STATE_MANAGEMENT.md) - this schema is the server-side authority
 * regardless of what the client already checked
 * (docs/backend/BACKEND_ARCHITECTURE.md; never trust client validation
 * alone).
 */
import { z } from "zod";

/**
 * A missing/non-string field and an empty string should produce the same
 * plain-language message - Zod's default "invalid_type" error otherwise
 * pre-empts a custom .min() message when the field is absent entirely, so
 * this normalizes both cases onto the same required-string check.
 */
function requiredString(message: string, maxLength: number) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, message).max(maxLength),
  );
}

export const contactInputSchema = z.object({
  name: requiredString("Enter your name.", 200),
  contact: requiredString("Enter a way to reach you.", 200),
  statedNeed: z.string().trim().max(2000).optional(),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

const leadChannelSchema = z.enum(["website", "whatsapp", "facebook", "linkedin", "other"]);
const leadStatusSchema = z.enum(["new", "qualified", "converted", "lost"]);

// Manual (non-web) lead entry - FEAT-02.2. Same shape as contactInputSchema
// plus an explicit, required channel (never "website" - that's reserved
// for the public form, which sets it server-side, not client-supplied).
export const manualLeadInputSchema = z.object({
  name: requiredString("Enter the lead's name.", 200),
  contact: requiredString("Enter a way to reach them.", 200),
  channel: leadChannelSchema.refine((value) => value !== "website", {
    message: "Manual entries can't use the website channel.",
  }),
  statedNeed: z.string().trim().max(2000).optional(),
});

export type ManualLeadInput = z.infer<typeof manualLeadInputSchema>;

export const leadListQuerySchema = z.object({
  status: leadStatusSchema.optional(),
  channel: leadChannelSchema.optional(),
});

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

// The new Client's details, captured at conversion time - Client SLA
// signing itself stays a business/legal step outside the product
// (docs/product/PRD.md non-goals); this only creates the Client record.
export const convertLeadInputSchema = z.object({
  legalName: requiredString("Enter the client's legal name.", 300),
  tin: z.string().trim().max(50).optional(),
  registeredAddress: z.string().trim().max(500).optional(),
  primaryContactName: z.string().trim().max(200).optional(),
  primaryContactChannel: z.string().trim().max(200).optional(),
});

export type ConvertLeadInput = z.infer<typeof convertLeadInputSchema>;
