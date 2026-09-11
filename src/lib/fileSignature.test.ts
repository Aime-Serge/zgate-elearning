import { describe, expect, it } from "vitest";
import { matchesClaimedType } from "./fileSignature.js";

describe("matchesClaimedType", () => {
  it("accepts a real PDF's leading bytes", () => {
    const content = Buffer.from("%PDF-1.4\n...");
    expect(matchesClaimedType(content, "application/pdf")).toBe(true);
  });

  it("rejects content that doesn't match the claimed type", () => {
    const content = Buffer.from("<script>alert(1)</script>");
    expect(matchesClaimedType(content, "application/pdf")).toBe(false);
  });

  it("accepts a real PNG's leading bytes", () => {
    const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(matchesClaimedType(content, "image/png")).toBe(true);
  });

  it("rejects a PNG claim on JPEG bytes", () => {
    const content = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00]);
    expect(matchesClaimedType(content, "image/png")).toBe(false);
  });

  it("returns false for a type with no known signature", () => {
    const content = Buffer.from("whatever");
    expect(matchesClaimedType(content, "application/x-sh")).toBe(false);
  });

  it("does not throw on a buffer shorter than the signature", () => {
    const content = Buffer.from([0x25]);
    expect(matchesClaimedType(content, "application/pdf")).toBe(false);
  });
});
