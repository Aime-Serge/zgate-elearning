/**
 * Lead form validation - server-side (the server action). Client components
 * import from ./constants instead, which has no dependencies: this file
 * pulls in zod, which must stay out of the browser bundle.
 *
 * Plain-language messages and a deliberately free-form "contact" field
 * (email, phone or WhatsApp) carry over from the v1 contact form, which the
 * commercial review found well suited to this market
 * (docs/release/COMMERCIAL_READINESS.md §6).
 */
import { z } from "zod";
import { INTERESTS, type LeadField } from "./constants";

export { ATTRIBUTION_FIELDS, INTERESTS, type LeadFormState } from "./constants";

const trimmed = (max: number, required?: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    required ? z.string().min(1, required).max(max) : z.string().max(max),
  );

const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const optionalId = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().positive().optional(),
);

export const leadFormSchema = z
  .object({
    kind: z.enum(["contact", "waitlist"]),
    name: trimmed(200, "Enter your name."),
    contact: trimmed(200, "Enter a phone number, WhatsApp number or email so we can reach you."),
    interest: z.enum(INTERESTS).optional().catch(undefined),
    courseId: optionalId,
    message: trimmed(2000),
    consentContact: checkbox.refine((v) => v, {
      message: "Please agree so we can contact you about your enquiry.",
    }),
    consentMarketing: checkbox,
  })
  .superRefine((value, ctx) => {
    if (value.kind === "waitlist" && value.courseId === undefined) {
      ctx.addIssue({ code: "custom", path: ["courseId"], message: "Choose a course." });
    }
  });

export type LeadFormInput = z.infer<typeof leadFormSchema>;

/** UTM and referrer captured in the browser; every field optional and capped. */
export const attributionSchema = z.object({
  utmSource: trimmed(100),
  utmMedium: trimmed(100),
  utmCampaign: trimmed(100),
  utmContent: trimmed(100),
  utmTerm: trimmed(100),
  landingPage: trimmed(500),
  referrer: trimmed(500),
});

export type Attribution = z.infer<typeof attributionSchema>;

export function fieldErrorsFrom(error: z.ZodError): Partial<Record<LeadField, string>> {
  const errors: Partial<Record<LeadField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as LeadField | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
