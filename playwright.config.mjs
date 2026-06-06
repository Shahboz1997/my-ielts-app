import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  globalSetup: './e2e/global-setup.mjs',
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          // Must match Playwright baseURL (127.0.0.1 ≠ localhost for auth cookies).
          AUTH_URL: baseURL,
          NEXTAUTH_URL: baseURL,
          AUTH_TRUST_HOST: 'true',
          // Playwright/CI use http://127.0.0.1 — secure auth cookies are not sent over HTTP.
          E2E_INSECURE_AUTH_COOKIES: '1',
          E2E_MOCK_OPENAI: process.env.E2E_MOCK_OPENAI || '1',
          NODE_ENV: 'production',
        },
      },
});
