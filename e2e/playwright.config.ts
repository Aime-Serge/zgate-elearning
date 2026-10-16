/**
 * The customer journey across both products, in a real browser:
 *
 *   website course page -> Enroll link -> LMS sign-up -> sandbox payment
 *   -> lesson -> certificate -> public /verify/[code]
 *
 * Targets come from the environment (never hard-coded):
 *   JOURNEY_SITE_URL   the website, e.g. https://www.staging.example.rw
 *   JOURNEY_LEARN_URL  the LMS,     e.g. https://learn.staging.example.rw
 *   JOURNEY_COURSE_SLUG  a published course (default: ebm-digital-invoicing)
 *
 * Staging runs everything (.github/workflows/journey.yml). Production runs
 * only the read-only steps, tagged @readonly (.github/workflows/synthetic.yml):
 * they create no accounts, payments or records.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./journeys",
  fullyParallel: false,
  // Low-memory development: one browser at a time locally; CI may use two.
  workers: process.env["CI"] ? 2 : 1,
  retries: process.env["CI"] ? 1 : 0,
  timeout: 60_000,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "retain-on-failure",
    // Mid-range Android-sized viewport - the platform's primary audience.
    ...devices["Pixel 7"],
  },
  projects: [{ name: "chromium-mobile", use: { browserName: "chromium" } }],
});
