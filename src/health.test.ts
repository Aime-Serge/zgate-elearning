import { describe, expect, it } from "vitest";
import { getHealthStatus } from "./health.js";

describe("getHealthStatus", () => {
  it("reports ok with the given timestamp", () => {
    const now = new Date("2026-09-10T00:00:00.000Z");
    expect(getHealthStatus(now)).toEqual({
      status: "ok",
      checkedAt: "2026-09-10T00:00:00.000Z",
    });
  });
});
