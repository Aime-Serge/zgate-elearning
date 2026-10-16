/**
 * The course join key: a course is joined across products by its slug
 * (ADR-007). The website owns a course's marketing copy, the LMS owns its
 * price, cohorts and seats.
 */
import { z } from "zod";

/** Same rule the website CMS enforces on slugs (zgate-website backend/src/fields/common.ts). */
export const courseSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

export type CourseSlug = z.infer<typeof courseSlugSchema>;
