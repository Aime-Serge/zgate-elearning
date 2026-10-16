/**
 * The public catalog: what `GET /api/v1/public/catalog` returns
 * (openapi/v1.yaml). The website renders its course marketing pages from
 * it (docs/platform-v2/02-TARGET-ARCHITECTURE.md §6): published
 * courses, upcoming cohorts, price and outcomes.
 *
 * Contract definition: the e-learning API does not serve this endpoint
 * yet. `/api/v1` accepts additive changes only.
 */
import { z } from "zod";
import { courseSlugSchema } from "./courseSlug.ts";

/** How a course or cohort is delivered (schema.org courseMode values). */
export const DELIVERY_MODES = ["online", "onsite", "blended"] as const;

export const catalogCohortSchema = z.object({
  /** Opaque cohort id; the `cohort` parameter of an enroll link. */
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  /** First session, ISO 8601 calendar date (Africa/Kigali). */
  startsOn: z.iso.date(),
  deliveryMode: z.enum(DELIVERY_MODES),
  /** Null when the cohort has no seat limit. */
  seatsRemaining: z.number().int().min(0).nullable(),
});

export const catalogItemSchema = z.object({
  slug: courseSlugSchema,
  title: z.string().min(1).max(200),
  summary: z.string().max(1000),
  outcomes: z.array(z.string().min(1).max(300)),
  /** Whole Rwandan francs; null for a free course. */
  priceAmount: z.number().int().min(0).nullable(),
  currency: z.literal("RWF"),
  deliveryMode: z.enum(DELIVERY_MODES),
  /** Upcoming cohorts, soonest first; empty for self-paced or unscheduled courses. */
  cohorts: z.array(catalogCohortSchema),
  /** When the course was last published, ISO 8601 UTC. */
  updatedAt: z.iso.datetime(),
});

export const catalogResponseSchema = z.object({
  courses: z.array(catalogItemSchema),
});

export type CatalogCohort = z.infer<typeof catalogCohortSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
