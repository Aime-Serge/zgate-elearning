import { describe, expect, it } from "vitest";
import { parseConfig } from "./config.js";

describe("parseConfig", () => {
  it("applies safe defaults when nothing is set", () => {
    const result = parseConfig({});
    expect(result).toEqual({
      NODE_ENV: "development",
      PORT: 3000,
      WEB_ORIGIN: "http://localhost:3001",
    });
  });

  it("coerces PORT from a string env var to a number", () => {
    const result = parseConfig({ PORT: "4000" });
    expect(result.PORT).toBe(4000);
    expect(typeof result.PORT).toBe("number");
  });

  it("respects an explicit WEB_ORIGIN", () => {
    const result = parseConfig({ WEB_ORIGIN: "https://zgaterw.com" });
    expect(result.WEB_ORIGIN).toBe("https://zgaterw.com");
  });

  it("throws a clear, non-value-leaking error for an invalid NODE_ENV", () => {
    expect(() => parseConfig({ NODE_ENV: "not-a-real-environment" })).toThrowError(
      /Invalid environment configuration for: NODE_ENV/,
    );
  });

  it("throws for a non-numeric PORT", () => {
    expect(() => parseConfig({ PORT: "not-a-port" })).toThrowError(
      /Invalid environment configuration for: PORT/,
    );
  });
});
