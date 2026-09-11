import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// The API is a different origin by design (docs/architecture/
// API_ARCHITECTURE.md) - connect-src has to name it explicitly or every
// fetch() this app makes would be CSP-blocked. Read at request time (not
// baked into a literal here) so this tracks whatever NEXT_PUBLIC_API_URL
// is actually configured with per environment.
function apiOrigin(): string {
  return process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";
}

const nextConfig: NextConfig = {
  // Minimal, self-contained server bundle for the container's prod
  // image (apps/web/Dockerfile) - not the full node_modules tree.
  output: "standalone",
  // apps/web is an independent package with its own lockfile
  // (docs/frontend/FRONTEND_ARCHITECTURE.md's structural decision - not
  // an npm workspace with the root backend package). Without this,
  // Turbopack finds the root's lockfile too and guesses the wrong
  // workspace root.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  // docs/security/SECURITY_REQUIREMENTS.md V14 / docs/frontend/
  // FRONTEND_SECURITY.md's "security headers set... on every response"
  // requirement. `next/font` self-hosts Google Fonts at build time (the
  // browser never fetches fonts.gstatic.com directly), so font-src
  // 'self' is enough - no external font host needs allowlisting.
  //
  // script-src/style-src still allow 'unsafe-inline': Next's App Router
  // embeds its own hydration payload as inline <script> tags with no
  // nonce wired up yet, and a strict script-src would break the app
  // without one. This is a real, intentional gap, not an oversight -
  // recorded as a finding in SECURITY_TEST_REPORT.md rather than
  // shipped as a nonce-based CSP I can't verify against a real browser
  // in this environment.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self' ${apiOrigin()}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
