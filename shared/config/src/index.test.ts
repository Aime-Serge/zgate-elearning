import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRESETS } from "./index.js";

const read = (relative: string) =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), "utf8"),
  ) as Record<string, unknown>;

describe("@zgate/config presets", () => {
  it("keeps the repository's existing Prettier rules unchanged", () => {
    expect(read("prettier.json")).toEqual({
      semi: true,
      singleQuote: false,
      trailingComma: "all",
      printWidth: 100,
      tabWidth: 2,
    });
  });

  it("ships valid tsconfig presets that inherit the strict base", () => {
    expect(read("tsconfig/base.json")).toMatchObject({ compilerOptions: { strict: true } });
    expect(read("tsconfig/library.json")).toMatchObject({ extends: "./base.json" });
    expect(read("tsconfig/nextjs.json")).toMatchObject({ extends: "./base.json" });
  });

  it("lists every preset under the package's own name", () => {
    for (const path of Object.values(PRESETS)) expect(path.startsWith("@zgate/config/")).toBe(true);
  });
});
