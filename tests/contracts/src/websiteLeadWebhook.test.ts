/**
 * The e-learning platform accepts the website's lead/waitlist webhook
 * (@zgate/website-contracts). The website owns the payload; these tests
 * run here on every e-learning change and in the website's CI whenever the
 * payload changes, so neither side can break the other unnoticed.
 *
 * What exists today is the CRM's public lead intake (contactInputSchema:
 * name, contact, statedNeed). The endpoint that will receive the webhook,
 * POST /api/v1/public/leads (docs/platform-v2/02-TARGET-ARCHITECTURE.md §6,
 * "Leads"), isn't built yet.
 */
import { type LeadWebhookPayload, leadWebhookPayloadSchema } from "@zgate/website-contracts";
import { describe, expect, it, test } from "vitest";
import { z } from "zod";
import { contactInputSchema } from "../../../backend/src/modules/crm/schema.ts";

type Schema = { properties?: Record<string, { maxLength?: number }> };

const longest = (length: number) => "x".repeat(length);

/** The largest payload the website's schema allows. */
const largest: LeadWebhookPayload = leadWebhookPayloadSchema.parse({
  event: "lead.created",
  version: 1,
  occurredAt: "2026-10-16T08:00:00Z",
  lead: {
    id: "42",
    kind: "waitlist",
    name: longest(200),
    contact: longest(200),
    interest: "academy",
    courseSlug: "ebm-digital-invoicing",
    message: longest(2000),
    consent: {
      contactAllowed: true,
      marketingAllowed: false,
      noticeVersion: "2026-11-01",
      consentedAt: "2026-10-16T08:00:00Z",
    },
    attribution: { utmSource: "facebook", landingPage: "/academy/courses/ebm-digital-invoicing" },
  },
});

/** How the CRM intake will read a webhook lead: its stated need is the message. */
const toCrmInput = ({ lead }: LeadWebhookPayload) => ({
  name: lead.name,
  contact: lead.contact,
  statedNeed: lead.message,
});

describe("website lead webhook -> e-learning CRM intake", () => {
  it("accepts the largest lead the website can send", () => {
    expect(contactInputSchema.safeParse(toCrmInput(largest)).success).toBe(true);
  });

  it("accepts a lead without the optional message", () => {
    const { message: _message, ...lead } = largest.lead;
    expect(contactInputSchema.safeParse(toCrmInput({ ...largest, lead })).success).toBe(true);
  });

  it("never lets the website send more than the CRM stores", () => {
    const website = z.toJSONSchema(leadWebhookPayloadSchema, { io: "output" }) as unknown as {
      properties: { lead: Schema };
    };
    const crm = z.toJSONSchema(contactInputSchema, { io: "output" }) as unknown as Schema;
    const limit = (schema: Schema, field: string) => schema.properties?.[field]?.maxLength;

    for (const [webhookField, crmField] of [
      ["name", "name"],
      ["contact", "contact"],
      ["message", "statedNeed"],
    ] as const) {
      const sent = limit(website.properties.lead, webhookField);
      const stored = limit(crm, crmField);
      expect(sent, `website ${webhookField} has a length limit`).toBeTypeOf("number");
      expect(stored, `CRM ${crmField} has a length limit`).toBeTypeOf("number");
      expect(sent!).toBeLessThanOrEqual(stored!);
    }
  });

  // Not built yet: the e-learning API has no endpoint for the website's
  // lead webhook. Replace this with an app.inject() test against the
  // endpoint when it is added (backend/src/modules/crm). Reported as "todo",
  // never as passed.
  test.todo(
    "POST /api/v1/public/leads stores a webhook lead with its consent and attribution (not built yet)",
  );
});
