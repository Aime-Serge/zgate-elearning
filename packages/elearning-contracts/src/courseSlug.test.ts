import { describe, expect, it } from "vitest";
import { courseSlugSchema } from "./courseSlug.ts";

describe("courseSlugSchema", () => {
  it("accepts the slugs the website already uses", () => {
    for (const slug of ["tax-bookkeeping-fundamentals", "ebm-digital-invoicing"]) {
      expect(courseSlugSchema.safeParse(slug).success).toBe(true);
    }
  });

  it("rejects anything that couldn't be a URL segment", () => {
    for (const slug of ["Tax", "tax basics", "-lead", "double--hyphen", "../etc", ""]) {
      expect(courseSlugSchema.safeParse(slug).success).toBe(false);
    }
  });
});
