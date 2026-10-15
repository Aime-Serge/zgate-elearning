import type { MetadataRoute } from "next";

const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3001";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated-only surfaces (docs/frontend/ROUTE_MAP.md) - never
      // indexable, and a crawler shouldn't even be spending budget on
      // their login/reset entry points. Standard robots.txt prefix
      // matching means each of these also covers its own subtree
      // (e.g. "/staff" covers "/staff/leads", "/staff/clients/:id", ...).
      disallow: ["/login", "/forgot-password", "/reset-password", "/portal", "/staff"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
