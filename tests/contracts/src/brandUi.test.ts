/**
 * The brand tokens the e-learning frontend will use from @zgate/brand-ui
 * (owned by the website) exist and stay readable. Runs here and in the
 * website's CI whenever the brand package changes.
 */
import { colors, contrastRatio, space } from "@zgate/brand-ui";
import { describe, expect, it } from "vitest";

describe("@zgate/brand-ui, as the e-learning platform uses it", () => {
  it("provides the surface, text, action and Academy colours", () => {
    for (const name of ["ink", "paper", "action", "actionHover", "academy", "error"] as const) {
      expect(colors[name], name).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("keeps button and body text readable (WCAG AA, 4.5:1)", () => {
    expect(contrastRatio("#ffffff", colors.action)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.paper, colors.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("provides the spacing scale", () => {
    expect(space[4]).toBe("16px");
  });
});
