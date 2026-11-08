import { defineConfig, devices } from "@playwright/test";
import { config as chargerEnv } from "dotenv";

chargerEnv({ path: ".env.local", quiet: true });

const channel =
  process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "msedge");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    headless: true,
    ...(channel ? { channel } : {}),
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "js",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "sans-js",
      use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
