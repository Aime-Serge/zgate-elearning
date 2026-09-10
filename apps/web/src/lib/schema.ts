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
