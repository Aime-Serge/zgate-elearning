/**
 * Response headers for every route - identical to legacy/ops/next.config.ts
 * (the platform's existing baseline), kept as a function so it is testable.
 *
 * NEXT_PUBLIC_API_URL is inlined at build time, so the Docker build
 * refuses to run without it (see this package's Dockerfile).
 */
export function securityHeaders(apiOrigin: string): { key: string; value: string }[] {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
}
