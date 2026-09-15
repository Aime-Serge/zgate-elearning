import type { Kysely } from "kysely";
import { describe, expect, it } from "vitest";
import { getHealthStatus, getReadinessStatus } from "./health.js";
import type { Database } from "./lib/db.js";

describe("getHealthStatus", () => {
  it("reports ok with the given timestamp", () => {
    const now = new Date("2026-09-10T00:00:00.000Z");
    expect(getHealthStatus(now)).toEqual({
      status: "ok",
      checkedAt: "2026-09-10T00:00:00.000Z",
    });
  });
});

describe("getReadinessStatus", () => {
  it("reports not_ready when the database accessor throws synchronously", async () => {
    // Regression case: DATABASE_URL unset means lib/config.ts's
    // getDatabaseUrl() throws before any query ever runs - this must
    // still surface as a readiness failure (503), not an unhandled 500.
    const throwingAccessor = () => {
      throw new Error("DATABASE_URL is not set.");
    };
    await expect(getReadinessStatus(throwingAccessor)).resolves.toEqual({
      status: "not_ready",
      checks: { database: "error" },
    });
  });

  it("reports not_ready when the query itself rejects", async () => {
    // Minimal stand-in - kysely's `sql` tag only ever calls .execute()
    // on whatever's passed to it for a plain `select 1` query.
    const failingDb = {
      execute: () => Promise.reject(new Error("connection refused")),
    } as unknown as Kysely<Database>;

    await expect(getReadinessStatus(() => failingDb)).resolves.toEqual({
      status: "not_ready",
      checks: { database: "error" },
    });
  });
});
