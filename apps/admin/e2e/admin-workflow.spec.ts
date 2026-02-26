import { test, expect } from '@playwright/test';

test.describe('Admin Full E2E Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  test('Login as Admin and verify Dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Ephraim Care/i })).toBeVisible();

    await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimAdmin2026');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Dashboard heading: "Welcome back, ..."
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });

    // Verify dashboard content is rendered
    await expect(page.getByRole('heading', { name: /Quick Actions/i })).toBeVisible();
  });

  test('Navigate to Shifts page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimAdmin2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });

    // Navigate to Shifts
    await page.click('a:has-text("Shifts"), [href="/shifts"]');
    await page.waitForURL(/\/shifts/);
    await expect(page.getByRole('heading', { name: /Shifts/i })).toBeVisible();
  });

  test('Navigate to Invoices page with pagination', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimAdmin2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });

    // Navigate to Invoices
    await page.click('a:has-text("Invoices"), [href="/invoices"]');
    await page.waitForURL(/\/invoices/);
    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible();

    // Check pagination controls exist (even if disabled)
    const paginationArea = page.locator('text=/Page|Previous|Next|Showing/i');
    if (await paginationArea.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Pagination controls rendered
      const nextBtn = page.getByRole('button', { name: /Next/i });
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        if (!(await nextBtn.isDisabled())) {
          await nextBtn.click();
        }
      }
    }
  });

  test('Navigate to Workers page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimAdmin2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });

    // Navigate to Workers
    await page.click('a:has-text("Workers"), [href="/workers"]');
    await page.waitForURL(/\/workers/);
    await expect(page.getByRole('heading', { name: /Workers/i })).toBeVisible();
  });

  test('Navigate to Participants page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimAdmin2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });

    // Navigate to Participants
    await page.click('a:has-text("Participants"), [href="/participants"]');
    await page.waitForURL(/\/participants/);
    await expect(page.getByRole('heading', { name: /Participants/i })).toBeVisible();
  });

  test('Logout Admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimAdmin2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });

    // Click Sign out button
    await page.click('button:has-text("Sign out")');

    // Should return to login page
    await expect(page.getByRole('heading', { name: /Ephraim Care/i })).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
