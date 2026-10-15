import { test, expect } from '@playwright/test';
import { signInStudent } from './support/env';

/**
 * Minimal e2e smoke suite (8.3), run against the local Supabase stack with mock
 * data. OAuth is mocked via network interception; signed-in tests use locally
 * minted cookies (see support/env.ts).
 */

test('login page shows the Google sign-in button and redirects to Google', async ({ page }) => {
  await page.goto('/login');

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
  await page.goto('/subjects?year=all');
  await expect(page).toHaveURL(/\/login/);
});

test('authenticated user can see the subjects list', async ({ page, context }) => {
  await signInStudent(context);
  await page.goto('/subjects?year=all');
  await expect(page.getByRole('heading', { level: 1, name: 'Subjects' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Cardiovascular System/ })).toBeVisible();
});
