import { defineConfig, devices } from "@playwright/test";

const PORT = 5174;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Locally, run the dev server with VITE_E2E so it inlines the flag and
    // hot-reloads as you iterate. In CI, serve a prebuilt bundle via
    // `vite preview` — the dev server's per-request dep optimization is
    // pathological on cold runners with this app's heavy deps (Gosling,
    // Vitessce, Monaco), and individual tests hit their timeout. The CI
    // workflow runs `VITE_E2E=true npm run build` before this step.
    command: process.env.CI
      ? `npx vite preview --port ${PORT} --strictPort`
      : `npm run dev -- --port ${PORT}`,
    url: baseURL,
    env: process.env.CI ? undefined : { VITE_E2E: "true" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
