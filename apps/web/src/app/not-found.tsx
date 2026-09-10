import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <div
      className="max"
      style={{ paddingTop: "var(--space-16)", paddingBottom: "var(--space-16)" }}
    >
      <h1>Page not found</h1>
      <p
        style={{
          color: "var(--paper-dim)",
          marginTop: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Button href="/">Back to home</Button>
    </div>
  );
}
