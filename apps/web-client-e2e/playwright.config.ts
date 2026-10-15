import { defineConfig, devices } from '@playwright/test';

/**
 * Integration suite: API authorization rules + UI flows for the student and
 * admin apps, run against the LOCAL Supabase stack with mock data
 * (pnpm db:local:start / db:local:migrate / db:local:seed). See tests/support/env.ts
 * for the URLs and local-only secrets (E2E_* env vars override them).
 */
export default defineConfig({
  testDir: './tests',
  // Serial: the admin account allows one active session, and tests share seed data.
  fullyParallel: false,
  workers: 1,
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
