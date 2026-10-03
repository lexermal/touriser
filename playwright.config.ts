import { defineConfig, devices } from "@playwright/test";

const PORT = 3211;
// Set E2E_BASE_URL to test against an already running server (Next allows one `next dev` per folder).
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: external ?? `http://127.0.0.1:${PORT}`, ...devices["Pixel 7"] },
  webServer: external
    ? undefined
    : {
        command: `pnpm exec next dev --port ${PORT} --hostname 127.0.0.1`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI,
        env: { DB_PATH: "test-results/e2e.db" },
        timeout: 120_000,
      },
});
