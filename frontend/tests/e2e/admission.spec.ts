import { test, expect } from "@playwright/test";

/**
 * QUAL-1 — the admission and payment funnel end to end.
 *
 * This is the flow that creates user accounts and takes money, so it gets the E2E budget.
 * The security regressions it guards (SEC-2, SEC-3, SEC-7) are all things that looked fine
 * in the UI while being wrong underneath, which is exactly what unit tests miss.
 *
 * Requires a seeded database. Run with `npm run test:e2e`.
 */

const applicant = () => `E2E Applicant ${Date.now()}`;

test.describe("public site", () => {
  test("home page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Bangladesh Community School/i);
  });

  test("SEC-8: security headers are present on every response", async ({ page }) => {
    const res = await page.goto("/");
    const h = res!.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("no console errors on the home page (CSP does not break hydration)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
});

test.describe("SEC-2: login surfaces", () => {
  for (const [surface, path] of [["Admin", "/admin"], ["Classroom", "/classroom"], ["Office", "/office"]] as const) {
    test(`${surface} login shows no demo credentials`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("bcsk1234");
      await expect(page.locator("body")).not.toContainText(/Demo:/);
    });
  }

  test("invalid credentials are refused without revealing which field was wrong", async ({ page }) => {
    await page.goto("/admin");
    await page.fill('input[name="loginId"]', "no-such-account");
    await page.fill('input[name="password"]', "wrong-password");
    await page.getByRole("button", { name: /log ?in/i }).click();
    // The wording is deliberately non-specific — it must not reveal which field was wrong.
    await expect(page.getByText(/doesn't match our records|invalid/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("SEC-3 / SEC-7: the payment step cannot be reached or tampered with", () => {
  test("an application id alone does not open the payment page", async ({ request }) => {
    for (const id of [1, 2, 3, 42]) {
      expect((await request.get(`/apply/payment/${id}`)).status()).toBe(404);
    }
  });

  test("the ?bcsk=1 discount parameter no longer works", async ({ request }) => {
    // The original SEC-3 exploit: appending this bought the discounted rate.
    expect((await request.get("/apply/payment/1?bcsk=1")).status()).toBe(404);
  });

  test("a malformed capability token is refused", async ({ request }) => {
    expect((await request.get("/apply/payment/1?t=not.a.token")).status()).toBe(404);
  });
});

test.describe("SEC-5.1: file access is deny-by-default", () => {
  test("an unmapped folder is forbidden, not merely missing", async ({ request }) => {
    const res = await request.get("/api/files/some-future-folder/anything.pdf");
    expect(res.status()).toBe(403);
  });

  test("applicant photos are not public", async ({ request }) => {
    const res = await request.get("/api/files/applications/whatever.jpg");
    expect([401, 403]).toContain(res.status());
  });

  test("bank receipts are not public", async ({ request }) => {
    const res = await request.get("/api/files/receipts/whatever.pdf");
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("admission funnel", () => {
  test("a regular application reaches a tokenised payment page", async ({ page }) => {
    await page.goto("/apply/regular");

    const name = applicant();
    await page.fill('input[name="applicantName"]', name);
    await page.fill('input[name="dob"]', "2016-04-11");
    await page.selectOption('select[name="gender"]', { index: 1 });
    await page.selectOption('select[name="religion"]', { index: 1 });
    await page.selectOption('select[name="grade"]', { index: 1 });
    await page.fill('input[name="phone"]', "+82 10 1234 5678");
    await page.fill('input[name="email"]', "e2e@example.test");
    await page.fill('input[name="fatherName"]', "Father Name");
    await page.fill('input[name="motherName"]', "Mother Name");
    await page.fill('textarea[name="addressKorea"], input[name="addressKorea"]', "Yongin-si");
    await page.fill('textarea[name="addressBangladesh"], input[name="addressBangladesh"]', "Dhaka");
    await page.fill('input[name="emergencyContact"]', "+82 10 9999 8888");
    await page.setInputFiles('input[name="photo"]', {
      name: "photo.png",
      mimeType: "image/png",
      // 1x1 PNG — must pass the magic-byte check in lib/uploads.ts
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      ),
    });
    await page.check('input[name="parentalConsent"]');
    await page.getByRole("button", { name: /continue to payment/i }).click();

    // SEC-7: the redirect must carry a capability token, not a bare id.
    await page.waitForURL(/\/apply\/payment\/\d+\?t=/, { timeout: 30_000 });
    expect(page.url()).toMatch(/[?&]t=[\w-]+\.[\w-]+\.[\w-]+/);
    await expect(page.locator("body")).toContainText(name);
    await expect(page.locator("body")).toContainText(/Bank Transfer/i);

    // The same page without its token must be unreachable.
    const bare = page.url().split("?")[0];
    expect((await page.request.get(bare)).status()).toBe(404);
  });
});
