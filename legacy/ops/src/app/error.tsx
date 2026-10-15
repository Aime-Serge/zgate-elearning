"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";

// Route-level error boundary (Next.js convention) - a plain, honest
// message, never a raw stack trace to the user
// (docs/frontend/STATE_MANAGEMENT.md's error-handling table).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The only client-side logging point for an otherwise-unhandled
    // render error; no user data involved.
    console.error(error);
  }, [error]);

  return (
    <div
      className="max"
      style={{ paddingTop: "var(--space-16)", paddingBottom: "var(--space-16)" }}
    >
      <h1>Something went wrong</h1>
      <p
        style={{
          color: "var(--paper-dim)",
          marginTop: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        Please try again, or contact us directly if the problem continues.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
