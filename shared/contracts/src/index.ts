/**
 * Contracts between the website and the e-learning platform
 * (docs/architecture/ADR/ADR-007-separate-product-backends.md). Neither
 * product imports the other; both import these schemas instead.
 *
 * Starts with the one contract ADR-007 already fixes: a course is joined
 * across products by its slug (website = marketing copy, LMS = price,
 * intakes, seats).
 */
import { z } from "zod";

/** Same rule the website CMS enforces on slugs (website/app/src/fields/common.ts). */
export const courseSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

export type CourseSlug = z.infer<typeof courseSlugSchema>;
