import type { MetadataRoute } from "next";
import { divisions } from "@/lib/content";

const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3001";

// Matches docs/frontend/ROUTE_MAP.md's approved public route list
// exactly - no case-studies/careers/blog routes, since none exist.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.8 },
  ];

  const divisionRoutes: MetadataRoute.Sitemap = divisions.map((division) => ({
    url: `${siteUrl}/${division.slug}`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...divisionRoutes];
}
