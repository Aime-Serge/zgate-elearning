/**
 * Thin fetch wrapper for authenticated API calls -
 * docs/frontend/STATE_MANAGEMENT.md's TanStack Query hooks all go
 * through this, not a raw fetch() each time. `credentials: "include"`
 * is required on every call - the session lives in an httpOnly cookie
 * (docs/frontend/FRONTEND_SECURITY.md), which the browser only sends
 * cross-origin when explicitly told to.
 */
// Exported for the one legitimate non-fetch use: a plain <a href> link to
// a download endpoint, where the browser (not this wrapper) makes the
// request - Content-Disposition on the response, not a JS-driven blob
// fetch, is what triggers the actual download (docs/backend/
// API_CONVENTIONS.md's download endpoint).
export const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string>; correlationId: string };
}

export class ApiError extends Error {
  readonly code: string;
  readonly fields: Record<string, string> | undefined;

  constructor(body: ApiErrorBody) {
    super(body.error.message);
    this.code = body.error.code;
    this.fields = body.error.fields;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    if (body) {
      throw new ApiError(body);
    }
    throw new Error("Something went wrong. Please try again.");
  }

  return response.json() as Promise<T>;
}

/**
 * For multipart form uploads (docs/backend/API_CONVENTIONS.md's
 * POST /api/documents) - deliberately does not set Content-Type at all,
 * so the browser sets `multipart/form-data; boundary=...` itself; a
 * FormData body handed to fetch() alongside a manual Content-Type
 * header would omit the boundary and break parsing server-side.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    if (body) {
      throw new ApiError(body);
    }
    throw new Error("Something went wrong. Please try again.");
  }

  return response.json() as Promise<T>;
}
