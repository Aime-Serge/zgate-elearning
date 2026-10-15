"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "./api";

export interface SessionInfo {
  role: string;
  division: string | null;
  clientId: string | null;
}

/**
 * Client-side session read for UX only - which nav to show, where to
 * redirect after login. Not a security boundary: every API call this
 * session makes is re-checked server-side regardless of what this hook
 * returns (docs/frontend/FRONTEND_SECURITY.md).
 */
export function useSession() {
  return useQuery<SessionInfo | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await apiFetch<SessionInfo>("/api/auth/session");
      } catch (error) {
        if (error instanceof ApiError && error.code === "UNAUTHENTICATED") {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });
}
