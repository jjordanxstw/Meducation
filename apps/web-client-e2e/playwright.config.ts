import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright smoke suite for the student web client (8.3).
 *
 * Runs against APP_ENV=test with a dedicated test Supabase project. The base URL
 * defaults to the local dev server; override with E2E_BASE_URL in CI.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
