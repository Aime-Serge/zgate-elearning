/**
 * The enroll-link format: where the website's "Enroll" buttons send a
 * learner (docs/platform-v2/02-TARGET-ARCHITECTURE.md §6):
 *
 *   https://learn.{domain}/courses/{slug}/enroll?cohort={id}&utm_source=…&utm_medium=…&utm_campaign=…
 *
 * Every query parameter is optional. The LMS stores the UTM parameters and
 * the referrer on the enrollment, so the business can see which channel
 * produced paying learners.
 */
import { z } from "zod";
import { courseSlugSchema } from "./courseSlug.ts";

export const ENROLL_PATH_PATTERN = /^\/courses\/([^/]+)\/enroll$/;

/** UTM parameters an enroll link may carry, with the website's own limits. */
export const UTM_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export const enrollLinkParamsSchema = z.object({
  slug: courseSlugSchema,
  cohort: z.string().min(1).max(64).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
});

export type EnrollLinkParams = z.infer<typeof enrollLinkParamsSchema>;

/**
 * A complete enroll link, parsed into its parts. Accepts only an https
 * origin (http on localhost, for development), the enroll path for a valid
 * course slug, and known query parameters.
 */
export const enrollLinkSchema = z
  .string()
  .transform((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Not an absolute URL." });
      return z.NEVER;
    }
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
      ctx.addIssue({ code: "custom", message: "Enroll links use https." });
    }
    const match = ENROLL_PATH_PATTERN.exec(url.pathname);
    if (!match?.[1]) {
      ctx.addIssue({ code: "custom", message: "Path must be /courses/{slug}/enroll." });
      return z.NEVER;
    }
    const known = new Set<string>(["cohort", ...UTM_PARAMETERS]);
    const params: Record<string, string> = { slug: decodeURIComponent(match[1]) };
    for (const [key, param] of url.searchParams) {
      if (!known.has(key)) ctx.addIssue({ code: "custom", message: `Unknown parameter: ${key}` });
      params[key] = param;
    }
    return { origin: url.origin, ...params };
  })
  .pipe(enrollLinkParamsSchema.extend({ origin: z.string() }));

export type EnrollLink = z.infer<typeof enrollLinkSchema>;
