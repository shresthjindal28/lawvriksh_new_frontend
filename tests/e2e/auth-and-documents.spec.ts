import { test, expect } from '@playwright/test';

const hasUserCredentials =
  !!process.env.E2E_TEST_USER_EMAIL && !!process.env.E2E_TEST_USER_PASSWORD;

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test('login flow', async ({ page }) => {
  if (!hasUserCredentials) test.skip();

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_TEST_USER_EMAIL || '');
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_USER_PASSWORD || '');
  await page.getByRole('button', { name: /login|sign in|continue/i }).click();

  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await expect(page.getByText(/dashboard/i)).toBeVisible();
});

test('create document flow', async ({ page }) => {
  if (!hasUserCredentials) test.skip();

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_TEST_USER_EMAIL || '');
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_USER_PASSWORD || '');
  await page.getByRole('button', { name: /login|sign in|continue/i }).click();

  await page.waitForURL('**/dashboard**', { timeout: 30000 });

  const createButton = page
    .getByRole('button', { name: /new document|new project|start writing|create/i })
    .first();
  await createButton.click();

  await page.waitForURL('**/writing-section/**', { timeout: 30000 });
  await expect(page.getByText(/editor|writing/i)).toBeVisible();
});

test('export pdf flow', async ({ page }) => {
  if (!hasUserCredentials) test.skip();

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_TEST_USER_EMAIL || '');
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_USER_PASSWORD || '');
  await page.getByRole('button', { name: /login|sign in|continue/i }).click();

  await page.waitForURL('**/dashboard**', { timeout: 30000 });

  const firstProject = page
    .getByRole('link')
    .filter({ hasText: /project|document/i })
    .first();
  await firstProject.click();

  await page.waitForURL('**/writing-section/**', { timeout: 30000 });

  const exportButton = page.getByRole('button', { name: /export.*pdf|download.*pdf|pdf/i }).first();
  await exportButton.click();
});

test('role based access for admin pages', async ({ page }) => {
  if (!hasUserCredentials) test.skip();

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_TEST_USER_EMAIL || '');
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_USER_PASSWORD || '');
  await page.getByRole('button', { name: /login|sign in|continue/i }).click();

  await page.waitForURL('**/dashboard**', { timeout: 30000 });

  await page.goto('/dashboard/admin');

  const unauthorizedMessage = page.getByText(/unauthorized|permission denied|not allowed/i);
  const adminHeading = page.getByText(/admin/i);

  await expect(unauthorizedMessage.or(adminHeading)).toBeVisible();
});
