/**
 * Lead form constants and result type, with NO dependencies - safe to
 * import from client components. The validation schema (schema.ts) pulls
 * in zod, which is server-only here: importing it into the form put the
 * whole library in every page's JavaScript (~90 KB compressed, found by
 * e2e/performance.spec.ts).
 */
export const INTERESTS = ["advisory", "academy", "tech", "data", "not-sure"] as const;

export const ATTRIBUTION_FIELDS = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
  "landingPage",
  "referrer",
] as const;

export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];

export type LeadField =
  | "kind"
  | "name"
  | "contact"
  | "interest"
  | "courseId"
  | "message"
  | "consentContact"
  | "consentMarketing";

export type LeadFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors: Partial<Record<LeadField, string>>;
      // Echoed back so a no-JavaScript submission doesn't lose what was typed.
      values: Partial<Record<"name" | "contact" | "message" | "interest" | "courseId", string>>;
    };
