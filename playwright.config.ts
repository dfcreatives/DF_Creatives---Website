import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3102",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node --import tsx server/index.ts",
    url: "http://127.0.0.1:3102/health",
    reuseExistingServer: false,
    env: {
      PORT: "3102",
      SITE_URL: "http://127.0.0.1:3102",
      NODE_ENV: "test",
      DATA_DIR: mkdtempSync(path.join(tmpdir(), "df-browser-")),
      DEMO_ADMIN_PASSWORD: "browser-test-password-2026",
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      RESEND_API_KEY: "",
    },
  },
});
