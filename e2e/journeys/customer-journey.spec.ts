/**
 * Safeguard 3 (elearning/README.md, "Releases"): the full customer journey
 * across both products. No production deploy of either product happens
 * unless this passes against staging.
 *
 * Steps that need features not built yet are `test.fixme` with the reason,
 * never deleted or faked. Turn each into a real test when its feature ships
 * (elearning/docs/03-ELEARNING-PLATFORM.md, MVP scope). Steps tagged
 * @readonly change nothing and also run against production (synthetic.yml).
 */
import { enrollLinkSchema } from "@zgate/elearning-contracts";
import { expect, test } from "@playwright/test";

const siteUrl = process.env["JOURNEY_SITE_URL"];
const learnUrl = process.env["JOURNEY_LEARN_URL"];
const courseSlug = process.env["JOURNEY_COURSE_SLUG"] ?? "ebm-digital-invoicing";

test.describe.configure({ mode: "serial" });

test.describe("customer journey: course page to verified certificate", () => {
  test.beforeAll(() => {
    if (!siteUrl || !learnUrl) {
      throw new Error("Set JOURNEY_SITE_URL and JOURNEY_LEARN_URL (journey.yml / synthetic.yml).");
    }
  });

  test("the website course page loads @readonly", async ({ page }) => {
    const response = await page.goto(`${siteUrl}/academy/courses/${courseSlug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    // The way forward is always visible: the LMS enroll button, or the
    // waitlist and direct contact channels before the LMS launches.
    await expect(page.locator("#enroll")).toBeVisible();
  });

  test("its Enroll link follows the enroll-link contract and reaches the LMS @readonly", async ({
    page,
  }) => {
    await page.goto(`${siteUrl}/academy/courses/${courseSlug}`);
    const enroll = page.locator(
      '#enroll a[href*="/courses/"][href$="/enroll"], #enroll a[href*="/enroll?"]',
    );
    // The website switches between waitlist and LMS mode in its CMS.
    if ((await enroll.count()) === 0) {
      test.fixme(
        true,
        "The website is in waitlist mode (Site settings -> Academy -> enrollmentMode); there is no Enroll link until the LMS launches.",
      );
      return;
    }
    const href = await enroll.first().getAttribute("href");
    const parsed = enrollLinkSchema.safeParse(href);
    expect(parsed.success, `enroll link ${href}`).toBe(true);
    expect(parsed.data?.slug).toBe(courseSlug);
    expect(parsed.data?.origin).toBe(new URL(learnUrl!).origin);
  });

  test("the LMS API is up @readonly", async ({ request }) => {
    const response = await request.get(`${learnUrl}/api/health`);
    expect(response.status()).toBe(200);
  });

  test.fixme("a visitor signs up on the LMS from the enroll page", async () => {
    // Not built yet: LMS sign-up (email or phone + OTP), MVP capability 1.
  });

  test.fixme("the learner pays with the payment provider's sandbox", async () => {
    // Not built yet: checkout with MTN MoMo / Airtel Money, MVP capability 4.
    // Needs the payment aggregator chosen (decision D5) and its sandbox keys.
  });

  test.fixme("the learner opens the first lesson and completes it", async () => {
    // Not built yet: course structure, lessons and progress, MVP capabilities 5-7.
  });

  test.fixme("a certificate is issued when the completion rules are met", async () => {
    // Not built yet: certificates (PDF with QR code), MVP capability 10.
  });

  test.fixme("anyone can verify the certificate at /verify/[code] @readonly", async () => {
    // Not built yet: the public certificate verification page, MVP
    // capability 10. Read-only once built: production can check a known
    // published certificate code.
  });
});
