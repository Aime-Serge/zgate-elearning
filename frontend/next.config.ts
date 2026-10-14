import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

// pnpm workspace root (two levels up): dependencies live in the root
// node_modules/.pnpm store, so resolution and standalone tracing start there.
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  // Minimal, self-contained server bundle for the production image.
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  poweredByHeader: false,
  async headers() {
    const apiOrigin = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";
    return [{ source: "/:path*", headers: securityHeaders(apiOrigin) }];
  },
};

export default nextConfig;
