import { test, expect } from '@playwright/test';

/**
 * Minimal e2e smoke suite (8.3). Designed to run against APP_ENV=test with a
 * test Supabase project. OAuth is mocked via network interception in CI.
 */

test('login page shows the Google sign-in button and redirects to Google', async ({ page }) => {
  await page.goto('/en/login');

  const signIn = page.getByRole('button', { name: /sign in with google|google/i });
  await expect(signIn).toBeVisible();

  // Intercept the OAuth handshake so CI never hits real Google.
  await page.route(/accounts\.google\.com.*/, (route) =>
    route.fulfill({ status: 200, body: 'mocked-google-oauth' }),
  );

  await signIn.click();
  // Either we were routed to the (mocked) Google endpoint or to the NextAuth
  // signin handler that initiates it.
  await expect(page).toHaveURL(/google|api\/auth/i);
});

test('unauthenticated access to a dashboard route redirects to login', async ({ page }) => {
  await page.goto('/en/subjects');
  await expect(page).toHaveURL(/\/login/);
});

test('authenticated user can see the subjects list', async ({ page, context }) => {
  // Seed an authenticated session cookie issued by the test backend. The token
  // is provided by the CI harness for the test Supabase project.
  const token = process.env.E2E_STUDENT_ACCESS_TOKEN;
  test.skip(!token, 'E2E_STUDENT_ACCESS_TOKEN not provided');

  await context.addCookies([
    {
      name: 'student_access_token',
      value: token as string,
      url: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
      httpOnly: true,
    },
  ]);

  await page.goto('/en/subjects');
  await expect(page.getByRole('main')).toBeVisible();
});
