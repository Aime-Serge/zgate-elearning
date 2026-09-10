import { z } from "zod";

/**
 * Mirrors the backend's contactInputSchema exactly
 * (src/modules/crm/schema.ts in the repo root) — client-side validation
 * exists for immediate user feedback only; the backend re-validates
 * every field regardless (docs/frontend/STATE_MANAGEMENT.md: "client
 * validates for UX, server validates for real"). If one changes, the
 * other must too - not yet extracted into a shared package
 * (docs/backend/BACKEND_ARCHITECTURE.md notes this as a deferred
 * packaging decision).
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  contact: z.string().trim().min(1, "Enter a way to reach you.").max(200),
  statedNeed: z.string().trim().max(2000).optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/**
 * Mirrors the backend's loginInputSchema
 * (src/modules/identity/schema.ts) - see the comment on
 * contactFormSchema above for why this isn't shared as a package yet.
 */
export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * Mirrors the backend's manualLeadInputSchema
 * (src/modules/crm/schema.ts) - "website" is deliberately excluded, same
 * as the backend: that channel is reserved for the public contact form.
 */
export const leadChannelOptions = ["whatsapp", "facebook", "linkedin", "other"] as const;

export const manualLeadFormSchema = z.object({
  name: z.string().trim().min(1, "Enter the lead's name.").max(200),
  contact: z.string().trim().min(1, "Enter a way to reach them.").max(200),
  channel: z.enum(leadChannelOptions, { message: "Choose a channel." }),
  statedNeed: z.string().trim().max(2000).optional(),
});

export type ManualLeadFormValues = z.infer<typeof manualLeadFormSchema>;

/**
 * Mirrors the backend's convertLeadInputSchema
 * (src/modules/crm/schema.ts) - only legalName is required, matching
 * the backend exactly.
 */
export const convertLeadFormSchema = z.object({
  legalName: z.string().trim().min(1, "Enter the client's legal name.").max(300),
  tin: z.string().trim().max(50).optional(),
  registeredAddress: z.string().trim().max(500).optional(),
  primaryContactName: z.string().trim().max(200).optional(),
  primaryContactChannel: z.string().trim().max(200).optional(),
});

export type ConvertLeadFormValues = z.infer<typeof convertLeadFormSchema>;
