import { describe, expect, it } from "vitest";
import { catalogResponseSchema } from "./catalog.ts";

const course = {
  slug: "ebm-digital-invoicing",
  title: "EBM Digital Invoicing",
  summary: "Issue and file compliant electronic invoices.",
  outcomes: ["Set up EBM for a small business"],
  priceAmount: 150000,
  currency: "RWF",
  deliveryMode: "blended",
  cohorts: [
    {
      id: "c-2026-11",
      label: "November 2026",
      startsOn: "2026-11-09",
      deliveryMode: "onsite",
      seatsRemaining: 12,
    },
  ],
  updatedAt: "2026-10-16T08:00:00Z",
};

describe("catalogResponseSchema", () => {
  it("accepts a published catalog", () => {
    expect(catalogResponseSchema.safeParse({ courses: [course] }).success).toBe(true);
  });

  it("accepts a free course and an unlimited cohort", () => {
    const free = {
      ...course,
      priceAmount: null,
      cohorts: [{ ...course.cohorts[0], seatsRemaining: null }],
    };
    expect(catalogResponseSchema.safeParse({ courses: [free] }).success).toBe(true);
  });

  it("rejects a non-RWF price and an unknown delivery mode", () => {
    expect(
      catalogResponseSchema.safeParse({ courses: [{ ...course, currency: "USD" }] }).success,
    ).toBe(false);
    expect(
      catalogResponseSchema.safeParse({ courses: [{ ...course, deliveryMode: "hybrid" }] }).success,
    ).toBe(false);
  });
});
