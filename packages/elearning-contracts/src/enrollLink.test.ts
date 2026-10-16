import { describe, expect, it } from "vitest";
import { enrollLinkSchema } from "./enrollLink.ts";

describe("enrollLinkSchema", () => {
  it("parses the documented format", () => {
    const parsed = enrollLinkSchema.parse(
      "https://learn.example.rw/courses/ebm-digital-invoicing/enroll?cohort=c-2026-11&utm_source=facebook&utm_medium=social&utm_campaign=nov-intake",
    );
    expect(parsed).toEqual({
      origin: "https://learn.example.rw",
      slug: "ebm-digital-invoicing",
      cohort: "c-2026-11",
      utm_source: "facebook",
      utm_medium: "social",
      utm_campaign: "nov-intake",
    });
  });

  it("accepts a link with no query parameters (what the website sends today)", () => {
    expect(
      enrollLinkSchema.safeParse(
        "https://learn.example.rw/courses/tax-bookkeeping-fundamentals/enroll",
      ).success,
    ).toBe(true);
  });

  it("rejects other paths, schemes, slugs and parameters", () => {
    for (const link of [
      "https://learn.example.rw/courses/tax/enrol",
      "http://learn.example.rw/courses/tax/enroll",
      "https://learn.example.rw/courses/Tax%20Basics/enroll",
      "https://learn.example.rw/courses/tax/enroll?coupon=FREE",
      "not a url",
    ]) {
      expect(enrollLinkSchema.safeParse(link).success).toBe(false);
    }
  });
});
