/**
 * Z-GATE brand tokens - one source for both products' look. Values are
 * the approved Brand Identity Guide colours (docs/design/DESIGN_SYSTEM.md),
 * as used in website/app/src/app/(site)/globals.css. Components come
 * later; the website keeps its own CSS until it adopts this package.
 */
export const colors = {
  ink: "#0b0f1a",
  ink2: "#131a2b",
  paper: "#eceef3",
  paperDim: "#b9bec9",
  gate1: "#5b6bfa",
  gate2: "#34e0c9",
  advisory: "#c9a15a",
  academy: "#3fae7a",
  tech: "#3f8cfa",
  data: "#a85cf6",
  error: "#e17575",
  /**
   * Button background. Slightly darker than gate1: white text on #5b6bfa
   * is 4.26:1, below WCAG AA's 4.5:1 (found by the website's axe checks).
   */
  action: "#5666ee",
  actionHover: "#5260e1",
} as const;

export const space = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
} as const;

/** WCAG 2.x contrast ratio between two #rrggbb colours. */
export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = channels.map((c) =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}
