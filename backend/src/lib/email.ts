/**
 * Transactional email. docs/architecture/INTEGRATION_ARCHITECTURE.md
 * scopes this platform's only use of email to "password reset,
 * account-related notices" - nothing else - and explicitly defers the
 * vendor choice to implementation. Resend is used here: a simple,
 * single-API-key HTTP interface that matches the
 * EMAIL_PROVIDER_API_KEY / EMAIL_FROM_ADDRESS shape deploy/env/dev.env.example
 * already scaffolded. Swapping providers later only touches this file.
 *
 * Without a configured API key (local dev, tests, or a deployment that
 * hasn't provisioned one yet), sends are logged instead of transmitted.
 * This is a real functional gap, not a silently-papered-over one - it's
 * always logged at warn level so it's visible in any environment where
 * it happens.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env["EMAIL_PROVIDER_API_KEY"];
  // Matches dev.env.example's own placeholder - the real sending domain is
  // still an open decision (docs/marketing/SEO_STRATEGY.md), never
  // guessed at here.
  const from = process.env["EMAIL_FROM_ADDRESS"] ?? "no-reply@example.com";

  if (!apiKey) {
    console.warn(
      `[email] EMAIL_PROVIDER_API_KEY not set - logging instead of sending to ${to}: ${subject}`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!response.ok) {
    throw new Error(`Email provider responded with ${response.status}`);
  }
}
