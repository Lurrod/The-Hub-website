import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "node e2e/serve.mjs",
    url: "http://localhost:3000",
    timeout: 120000,
    reuseExistingServer: false,
  },
});
