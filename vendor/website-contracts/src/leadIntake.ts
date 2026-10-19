/**
 * POST /api/lead-intake: the website frontend hands the CMS a public form
 * submission (src/endpoints/leadIntake.ts). Server to server only - the
 * frontend authenticates with `Authorization: Bearer <LEAD_INTAKE_TOKEN>`,
 * and the browser never talks to the CMS.
 */
import type { LeadField } from "./leads/constants.ts";

export const LEAD_INTAKE_PATH = "/api/lead-intake";

export type LeadIntakeRequest = {
  /** The submitted form fields, attribution included, exactly as posted. */
  form: Record<string, string>;
};

export type LeadIntakeResponse =
  | { ok: true; leadId: number | string }
  | { ok: false; reason: "invalid"; fieldErrors: Partial<Record<LeadField, string>> }
  | { ok: false; reason: "course-unavailable" | "privacy-unpublished" };
