import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  outputDir: "output/playwright/results",
  reporter: [["list"], ["html", { outputFolder: "output/playwright/report", open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4180", trace: "retain-on-failure" },
  webServer: { command: "npm run demo -- --host 127.0.0.1 --port 4180", url: "http://127.0.0.1:4180/demo/", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
