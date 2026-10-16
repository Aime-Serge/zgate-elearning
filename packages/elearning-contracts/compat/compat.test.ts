/**
 * Safeguard 1 (elearning/README.md "Contracts"): a schema other products
 * rely on may not remove or rename a field or narrow a type.
 *
 * published.json is the agreed contract baseline. After an additive change,
 * refresh it with `pnpm --filter @zgate/elearning-contracts compat:update`
 * in the same pull request (../README.md, "Changing the contract").
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "@zgate/config/schema-compat";
import { describe, expect, it } from "vitest";
import { currentSnapshot } from "./schemas.ts";

const snapshotFile = fileURLToPath(new URL("./published.json", import.meta.url));
// `vitest --mode update` (the compat:update script); Vitest sets env.MODE.
const mode = (import.meta as ImportMeta & { env?: { MODE?: string } }).env?.MODE;

describe("published schema compatibility", () => {
  if (mode === "update") {
    it("writes the contract baseline", () => {
      writeFileSync(snapshotFile, `${JSON.stringify(currentSnapshot(), null, 2)}\n`);
    });
    return;
  }

  it("removes, renames and narrows nothing since the baseline", () => {
    const published = JSON.parse(readFileSync(snapshotFile, "utf8")) as Record<string, unknown>;
    expect(compareSnapshots(published, currentSnapshot())).toEqual([]);
  });
});
