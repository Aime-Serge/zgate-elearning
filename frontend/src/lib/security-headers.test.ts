import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

describe("securityHeaders", () => {
  const headers = Object.fromEntries(
    securityHeaders("https://learn.example.rw").map((h) => [h.key, h.value]),
  );

  it("matches the platform baseline", () => {
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("only lets the page call its own origin and the configured API", () => {
    expect(headers["Content-Security-Policy"]).toContain(
      "connect-src 'self' https://learn.example.rw",
    );
  });
});
