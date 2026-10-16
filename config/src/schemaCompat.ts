/**
 * Schema compatibility check for published contract packages: compares the
 * JSON Schema of a schema as last published (a committed snapshot) with
 * the current one, and lists every change a consumer could break on.
 *
 * Breaking (each yields one problem):
 *  - a property is removed or renamed (the old name is gone);
 *  - an optional property becomes required;
 *  - a type is narrowed: fewer JSON types, fewer enum values, a different
 *    constant, a stricter length/size/number bound, a new or changed
 *    pattern or format, extra properties forbidden, fewer union branches.
 *
 * Adding optional properties, widening a type or relaxing a bound is
 * compatible. Pure JSON in, list of problems out: callers produce the JSON
 * Schema themselves (Zod 4: z.toJSONSchema), so this file needs no
 * dependencies and works for any schema library.
 */

export type JsonSchema = { [key: string]: unknown };

const isObject = (value: unknown): value is JsonSchema =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const types = (schema: JsonSchema): string[] | null => {
  const type = schema["type"];
  if (typeof type === "string") return type === "integer" ? ["integer"] : [type];
  if (Array.isArray(type)) return type.map(String);
  return null;
};

// "integer" is a narrower "number": a number -> integer change narrows.
const typeCovers = (newTypes: string[], oldType: string) =>
  newTypes.includes(oldType) || (oldType === "integer" && newTypes.includes("number"));

const UPPER_BOUNDS = ["maxLength", "maxItems", "maxProperties", "maximum", "exclusiveMaximum"];
const LOWER_BOUNDS = ["minLength", "minItems", "minProperties", "minimum", "exclusiveMinimum"];

export function compareSchemas(previous: unknown, current: unknown, path = "$"): string[] {
  if (!isObject(previous)) return [];
  if (!isObject(current)) return [`${path}: schema removed`];
  const problems: string[] = [];

  const oldTypes = types(previous);
  const newTypes = types(current);
  if (newTypes && (!oldTypes || oldTypes.some((t) => !typeCovers(newTypes, t)))) {
    problems.push(
      `${path}: type narrowed from ${oldTypes?.join("|") ?? "any"} to ${newTypes.join("|")}`,
    );
  }

  if (Array.isArray(current["enum"])) {
    const allowed = new Set((current["enum"] as unknown[]).map((v) => JSON.stringify(v)));
    const before = Array.isArray(previous["enum"]) ? (previous["enum"] as unknown[]) : null;
    const removed = before
      ? before.filter((v) => !allowed.has(JSON.stringify(v)))
      : ["(any value)"];
    if (removed.length > 0) {
      problems.push(
        `${path}: enum no longer accepts ${removed.map((v) => JSON.stringify(v)).join(", ")}`,
      );
    }
  }

  if (
    "const" in current &&
    JSON.stringify(current["const"]) !== JSON.stringify(previous["const"])
  ) {
    problems.push(`${path}: constant changed to ${JSON.stringify(current["const"])}`);
  }

  for (const key of UPPER_BOUNDS) {
    const now = current[key];
    const before = previous[key];
    if (typeof now === "number" && (typeof before !== "number" || now < before)) {
      problems.push(`${path}: ${key} tightened to ${now}`);
    }
  }
  for (const key of LOWER_BOUNDS) {
    const now = current[key];
    const before = previous[key];
    if (typeof now === "number" && (typeof before !== "number" || now > before)) {
      problems.push(`${path}: ${key} tightened to ${now}`);
    }
  }

  for (const key of ["pattern", "format"]) {
    if (key in current && current[key] !== previous[key]) {
      problems.push(`${path}: ${key} changed to ${JSON.stringify(current[key])}`);
    }
  }

  if (current["additionalProperties"] === false && previous["additionalProperties"] !== false) {
    problems.push(`${path}: extra properties are no longer allowed`);
  }

  const oldProps = isObject(previous["properties"]) ? previous["properties"] : {};
  const newProps = isObject(current["properties"]) ? current["properties"] : {};
  for (const [name, schema] of Object.entries(oldProps)) {
    if (!(name in newProps)) {
      problems.push(`${path}.${name}: property removed or renamed`);
      continue;
    }
    problems.push(...compareSchemas(schema, newProps[name], `${path}.${name}`));
  }

  const oldRequired = new Set(Array.isArray(previous["required"]) ? previous["required"] : []);
  const newRequired = Array.isArray(current["required"]) ? (current["required"] as string[]) : [];
  for (const name of newRequired) {
    if (!oldRequired.has(name) && name in oldProps) {
      problems.push(`${path}.${name}: became required`);
    } else if (!oldRequired.has(name) && !(name in oldProps)) {
      problems.push(`${path}.${name}: new required property`);
    }
  }

  if (previous["items"] !== undefined || current["items"] !== undefined) {
    problems.push(...compareSchemas(previous["items"], current["items"] ?? {}, `${path}[]`));
  }

  for (const key of ["anyOf", "oneOf"]) {
    const before = previous[key];
    const now = current[key];
    if (!Array.isArray(before) && !Array.isArray(now)) continue;
    const oldBranches = Array.isArray(before) ? before : [previous];
    const newBranches = Array.isArray(now) ? now : [current];
    if (newBranches.length < oldBranches.length) {
      problems.push(`${path}: ${key} lost ${oldBranches.length - newBranches.length} branch(es)`);
    } else {
      oldBranches.forEach((branch, i) =>
        problems.push(...compareSchemas(branch, newBranches[i], `${path}.${key}[${i}]`)),
      );
    }
  }

  return problems;
}

/**
 * Compares a whole published snapshot ({ schemaName: jsonSchema }) with the
 * current schemas. A schema missing from `current` is a removal.
 */
export function compareSnapshots(
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
): string[] {
  return Object.entries(previous).flatMap(([name, schema]) =>
    name in current ? compareSchemas(schema, current[name], name) : [`${name}: schema removed`],
  );
}
