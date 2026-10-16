/**
 * openapi/v1.yaml and the Zod schemas describe the same payloads: the same
 * fields, the same required fields, and the same types, enums and
 * constants. Without this, oasdiff could pass while the Zod schemas the
 * website parses with drift (or the other way round).
 *
 * Bounds, patterns and formats aren't compared here: Zod's JSON Schema
 * adds details OpenAPI leaves implicit (safe-integer bounds, date
 * patterns). compat.test.ts guards those against the last release.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { catalogCohortSchema, catalogItemSchema, catalogResponseSchema } from "../src/index.ts";

type Schema = { [key: string]: unknown };

const spec = load(
  readFileSync(fileURLToPath(new URL("../openapi/v1.yaml", import.meta.url)), "utf8"),
) as { components: { schemas: Record<string, Schema> } };

const isSchema = (value: unknown): value is Schema =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function deref(node: Schema): Schema {
  const ref = node["$ref"];
  if (typeof ref !== "string") return node;
  return deref(spec.components.schemas[ref.replace("#/components/schemas/", "")] ?? {});
}

/** The comparable shape of a schema: types, enum/const, properties, required, items. */
function shape(input: unknown): unknown {
  if (!isSchema(input)) return null;
  const node = deref(input);
  const branches = Array.isArray(node["anyOf"]) ? (node["anyOf"] as unknown[]) : [node];
  const types = new Set<string>();
  let base: Schema = {};
  for (const branch of branches) {
    if (!isSchema(branch)) continue;
    const b = deref(branch);
    const t = b["type"];
    for (const type of Array.isArray(t) ? t : t === undefined ? [] : [t]) types.add(String(type));
    if (b["type"] !== "null") base = { ...base, ...b };
  }
  const properties = isSchema(base["properties"]) ? base["properties"] : null;
  return {
    types: [...types].sort(),
    ...(base["enum"] !== undefined
      ? { enum: [...(base["enum"] as unknown[])].map(String).sort() }
      : {}),
    ...(base["const"] !== undefined ? { const: base["const"] } : {}),
    ...(properties
      ? {
          properties: Object.fromEntries(
            Object.keys(properties)
              .sort()
              .map((key) => [key, shape(properties[key])]),
          ),
          required: [...((base["required"] as string[] | undefined) ?? [])].sort(),
        }
      : {}),
    ...(base["items"] !== undefined ? { items: shape(base["items"]) } : {}),
  };
}

const pairs = {
  CatalogCohort: catalogCohortSchema,
  CatalogItem: catalogItemSchema,
  CatalogResponse: catalogResponseSchema,
};

describe("openapi/v1.yaml matches the Zod schemas", () => {
  for (const [name, zodSchema] of Object.entries(pairs)) {
    it(name, () => {
      const zod = z.toJSONSchema(zodSchema, { io: "output", unrepresentable: "any" });
      expect(shape(spec.components.schemas[name])).toEqual(shape(zod));
    });
  }
});
