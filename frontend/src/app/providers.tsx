"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query is the platform's server-state layer for authenticated
 * portals (docs/frontend/STATE_MANAGEMENT.md) - the public site pages
 * stayed static/fetch-only because none of them needed it until the
 * staff lead-management screens did. One QueryClient per browser
 * session, created inside state so it survives re-renders but isn't
 * shared across users on the server (Next.js App Router SSR pitfall).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
