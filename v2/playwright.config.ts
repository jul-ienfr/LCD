import { defineConfig } from "@playwright/test";

// Local Windows : Edge système, aucun navigateur à télécharger.
// CI Linux : installer Chromium (`npx playwright install chromium`) et
// laisser PLAYWRIGHT_CHANNEL vide.
const channel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "msedge");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    headless: true,
    ...(channel ? { channel } : {}),
    trace: "retain-on-failure",
  },
});
