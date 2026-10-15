import { test, expect } from '@playwright/test';
import { E2E, one, signInStudent } from './support/env';

/**
 * End-to-end flows against the local stack (student web client + admin + API).
 * Students are signed in with locally minted cookies; the admin uses the real
 * login form with the seeded local account.
 */

test('student: Today → subject → lecture, then it shows under "Continue"', async ({ page, context }) => {
  await signInStudent(context);
  const subject = await one(`SELECT id, name, code FROM subjects WHERE code = 'MDCV201'`);

  await page.goto(`${E2E.webUrl}/`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);
  await expect(page.getByRole('heading', { name: /Latest news/ })).toBeVisible();

  await page.goto(`${E2E.webUrl}/subjects/${subject.id}`);
  await expect(page.getByRole('heading', { level: 1, name: subject.name })).toBeVisible();
  // Seed: CVS's last section ("Pharmacology") is inactive and must stay hidden.
  await expect(page.getByRole('button', { name: 'Haemodynamics', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pharmacology', exact: true })).toHaveCount(0);

  const firstLecture = page.locator('[role="row"] a').first();
  const title = (await firstLecture.innerText()).split('\n')[0].trim();
  await firstLecture.click();
  await expect(page).toHaveURL(new RegExp(`/subjects/${subject.id}/lectures/`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(title);

  // Back on Today, the lecture is offered under "Continue where you left off".
  await page.goto(`${E2E.webUrl}/`);
  await expect(page.getByText('Continue where you left off')).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: title })).toBeVisible();
});

test('student: ⌘K search finds a lecture and opens it', async ({ page, context }) => {
  await signInStudent(context);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${E2E.webUrl}/subjects`);
  await expect(page.getByRole('heading', { level: 1, name: 'Subjects' })).toBeVisible();

  await page.keyboard.press('Control+k');
  const input = page.getByRole('dialog').getByRole('textbox', { name: 'Search' });
  await expect(input).toBeFocused();
  await input.fill('cardiac');
  const option = page.getByRole('option').filter({ hasText: /Cardiac physiology/ }).first();
  await expect(option).toBeVisible();
  await option.click();
  await expect(page).toHaveURL(/\/lectures\//);
  // Hidden subjects never appear in results.
  await page.keyboard.press('Control+k');
  await page.getByRole('dialog').getByRole('textbox', { name: 'Search' }).fill('Hidden Draft');
  await expect(page.getByText(/No results for/)).toBeVisible();
});

async function adminSignIn(page: import('@playwright/test').Page) {
  await page.goto(`${E2E.adminUrl}/login`);
  await page.fill('#username', E2E.admin.username);
  await page.fill('#password', E2E.admin.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('admin: leaving the subject editor with unsaved changes asks first', async ({ page }) => {
  const subject = await one(`SELECT id FROM subjects WHERE code = 'MDAN101'`);
  await adminSignIn(page);
  await expect(page.getByRole('heading', { name: /Needs attention/ })).toBeVisible();

  await page.goto(`${E2E.adminUrl}/subjects/edit/${subject.id}`);
  await page.getByRole('button', { name: /Subject details/ }).click();
  const name = page.getByRole('textbox', { name: /^Name/ });
  await expect(name).toHaveValue('Gross Anatomy');
  await name.fill('Gross Anatomy (edited)');
  // The sticky save bar counts the change.
  await expect(page.getByText('1 unsaved change')).toBeVisible();
  await expect(page.getByText('Details edited')).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('Leave without saving?')).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page).toHaveURL(/\/subjects\/edit\//);
  await expect(name).toHaveValue('Gross Anatomy (edited)');
});

test('admin: tree editor adds a lecture and saves the subject', async ({ page }) => {
  const subject = await one(`SELECT id FROM subjects WHERE code = 'MDPA301'`);
  const before = await one(
    `SELECT count(*)::int AS n FROM lectures l JOIN sections s ON s.id = l.section_id WHERE s.subject_id = '${subject.id}'`,
  );
  await adminSignIn(page);
  await page.goto(`${E2E.adminUrl}/subjects/edit/${subject.id}`);
  await page.getByRole('button', { name: 'Expand section' }).first().click();
  await page.getByRole('button', { name: '+ Add lecture' }).first().click();
  // Titles are unique per section, so make each run's lecture distinct.
  await page.getByRole('textbox', { name: 'Lecture title' }).last().fill(`E2E added lecture ${Date.now()}`);
  await page.getByRole('button', { name: '+ Add file or link' }).last().click();
  await page.getByRole('textbox', { name: 'Link URL' }).last().fill(`https://www.youtube.com/watch?v=${String(Date.now()).slice(-11)}`);
  await page.getByRole('textbox', { name: 'Link URL' }).last().blur();
  // Pasting a YouTube link fills the label and type.
  await expect(page.getByRole('textbox', { name: 'Link label' }).last()).toHaveValue('Lecture recording');
  await expect(page.getByText('1 lecture added · 1 link added')).toBeVisible();
  await page.getByRole('button', { name: 'Save subject' }).click();
  await expect(page.getByText('Subject saved')).toBeVisible();
  await expect(page.getByText(/unsaved change/)).toHaveCount(0);

  const after = await one(
    `SELECT count(*)::int AS n FROM lectures l JOIN sections s ON s.id = l.section_id WHERE s.subject_id = '${subject.id}'`,
  );
  expect(after.n).toBe(before.n + 1);
});

test('admin: All files filters to duplicate recordings', async ({ page }) => {
  await adminSignIn(page);
  await page.goto(`${E2E.adminUrl}/resources?duplicates=true`);
  await expect(page.getByRole('heading', { level: 1, name: 'All files' })).toBeVisible();
  // Seed: one recording is reused on two lectures of CVS section 2 (other tests may add more).
  const seeded = page.getByRole('row').filter({ hasText: 'mock0000063' });
  await expect(seeded).toHaveCount(2);
  await expect(seeded.getByText('Duplicate', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('row').filter({ hasText: 'mock0000062' })).toHaveCount(0);
});
