/**
 * Single source of truth for site navigation — matches
 * docs/frontend/ROUTE_MAP.md's approved public route list exactly.
 * Adding a link here without a corresponding approved route is exactly
 * the scope-creep this whole engagement has consistently avoided.
 */
export const navLinks = [
  { href: "/advisory", label: "Advisory" },
  { href: "/academy", label: "Academy" },
  { href: "/tech", label: "Tech" },
  { href: "/data", label: "Data" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
