import { defineConfig, devices } from "@playwright/test";

/**
 * QUAL-1 — E2E coverage of the admission and payment funnel, the flow that creates
 * accounts and moves money. Runs against a real dev server and a real database.
 */
/**
 * Note the trim-and-check rather than `??`: an empty E2E_BASE_URL is "not set", but `??`
 * only fires on null/undefined and would hand Playwright an empty baseURL. Same trap as
 * SEC-1's SESSION_HOURS.
 */
const externalBaseUrl = process.env.E2E_BASE_URL?.trim() || "";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // the funnel writes real rows; keep ordering predictable
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: externalBaseUrl || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
