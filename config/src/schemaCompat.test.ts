import { describe, expect, it } from "vitest";
import { compareSchemas, compareSnapshots } from "./schemaCompat.js";

const lead = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 200 },
    kind: { type: "string", enum: ["contact", "waitlist"] },
    note: { type: "string" },
  },
  required: ["name", "kind"],
  additionalProperties: false,
};

const withProps = (properties: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  ...lead,
  properties: { ...lead.properties, ...properties },
  ...extra,
});

describe("compareSchemas", () => {
  it("accepts an identical schema", () => {
    expect(compareSchemas(lead, structuredClone(lead))).toEqual([]);
  });

  it("accepts additive and widening changes", () => {
    const wider = withProps(
      {
        name: { type: "string", maxLength: 300 },
        kind: { type: "string", enum: ["contact", "waitlist", "callback"] },
        note: { type: ["string", "null"] },
        phone: { type: "string" },
      },
      { additionalProperties: true },
    );
    expect(compareSchemas(lead, wider)).toEqual([]);
  });

  it("flags a removed or renamed property", () => {
    const { note: _note, ...rest } = lead.properties;
    const renamed = { ...lead, properties: { ...rest, comment: { type: "string" } } };
    expect(compareSchemas(lead, renamed)).toEqual(["$.note: property removed or renamed"]);
  });

  it("flags narrowed types, enums and bounds", () => {
    const narrower = withProps({
      name: { type: "string", minLength: 2, maxLength: 100 },
      kind: { type: "string", enum: ["contact"] },
      note: { type: "string", pattern: "^[a-z]+$" },
    });
    expect(compareSchemas(lead, narrower)).toEqual([
      "$.name: maxLength tightened to 100",
      "$.name: minLength tightened to 2",
      '$.kind: enum no longer accepts "waitlist"',
      '$.note: pattern changed to "^[a-z]+$"',
    ]);
  });

  it("flags a type change and number -> integer", () => {
    const changed = withProps({ note: { type: "number" } });
    expect(compareSchemas(lead, changed)).toEqual(["$.note: type narrowed from string to number"]);
    expect(compareSchemas({ type: "number" }, { type: "integer" })).toEqual([
      "$: type narrowed from number to integer",
    ]);
    expect(compareSchemas({ type: "integer" }, { type: "number" })).toEqual([]);
  });

  it("flags an optional property that becomes required", () => {
    expect(compareSchemas(lead, { ...lead, required: ["name", "kind", "note"] })).toEqual([
      "$.note: became required",
    ]);
  });

  it("checks array items and union branches", () => {
    expect(
      compareSchemas(
        { type: "array", items: { type: "string" } },
        { type: "array", items: { type: "boolean" } },
      ),
    ).toEqual(["$[]: type narrowed from string to boolean"]);
    expect(
      compareSchemas(
        { anyOf: [{ type: "string" }, { type: "null" }] },
        { anyOf: [{ type: "string" }] },
      ),
    ).toEqual(["$: anyOf lost 1 branch(es)"]);
  });
});

describe("compareSnapshots", () => {
  it("flags a schema that is no longer exported", () => {
    expect(compareSnapshots({ lead, other: lead }, { lead })).toEqual(["other: schema removed"]);
  });
});
