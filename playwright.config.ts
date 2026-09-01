import { defineConfig, devices } from "@playwright/test";

const externalServer = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalServer ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: externalServer
    ? undefined
    : {
        command: "pnpm dev --port 4173",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
