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
