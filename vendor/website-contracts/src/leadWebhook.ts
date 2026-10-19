/**
 * The lead/waitlist webhook: the payload the website sends to a system
 * outside the website when a contact enquiry or a course-waitlist sign-up
 * has been stored. Its first consumer is the e-learning platform's CRM
 * (ADR-007: the CMS lead inbox is the record of truth until leads are
 * forwarded to a CRM).
 *
 * Contract definition only: the website does not send this webhook yet.
 * The fields mirror what the CMS stores for every lead today
 * (website/backend src/collections/Leads.ts) and the limits match the
 * lead form (leads/schema.ts), so a stored lead always fits.
 */
import { z } from "zod";
import { INTERESTS } from "./leads/constants.ts";

export const LEAD_WEBHOOK_EVENT = "lead.created";

/** Same rule the CMS enforces on course slugs. */
const courseSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const leadWebhookPayloadSchema = z.object({
  event: z.literal(LEAD_WEBHOOK_EVENT),
  /** Payload format version; additive changes keep it. */
  version: z.literal(1),
  /** When the lead was stored, ISO 8601 UTC. */
  occurredAt: z.iso.datetime(),
  lead: z.object({
    /** The lead's id in the website CMS - the idempotency key. */
    id: z.string().min(1).max(64),
    kind: z.enum(["contact", "waitlist"]),
    name: z.string().min(1).max(200),
    /** Free-form on purpose: email, phone or WhatsApp number. */
    contact: z.string().min(1).max(200),
    interest: z.enum(INTERESTS).optional(),
    /** Set for waitlist sign-ups: the course they asked about. */
    courseSlug: courseSlug.optional(),
    message: z.string().max(2000).optional(),
    consent: z.object({
      contactAllowed: z.boolean(),
      marketingAllowed: z.boolean(),
      /** The privacy notice version the person agreed to. */
      noticeVersion: z.string().min(1).max(40),
      consentedAt: z.iso.datetime(),
    }),
    /** First-touch attribution, as captured by the site (ATTRIBUTION_FIELDS). */
    attribution: z.object({
      utmSource: z.string().max(100).optional(),
      utmMedium: z.string().max(100).optional(),
      utmCampaign: z.string().max(100).optional(),
      utmContent: z.string().max(100).optional(),
      utmTerm: z.string().max(100).optional(),
      landingPage: z.string().max(500).optional(),
      referrer: z.string().max(500).optional(),
    }),
  }),
});

export type LeadWebhookPayload = z.infer<typeof leadWebhookPayloadSchema>;
