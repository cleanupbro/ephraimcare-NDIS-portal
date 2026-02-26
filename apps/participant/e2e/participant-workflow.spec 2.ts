import { test, expect } from '@playwright/test';

test.describe('Participant Full E2E Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  test('Login as Participant', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Ephraim Care/i })).toBeVisible();

    await page.getByLabel(/email/i).fill('client@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimClient2026');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Dashboard heading: "Welcome, ..."
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible({ timeout: 20000 });
  });

  test('Verify Dashboard & Appointments', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('client@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimClient2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible({ timeout: 20000 });

    // Navigate to Appointments
    await page.click('a:has-text("Appointments"), [href*="appointment"]');
    await expect(page.getByRole('heading', { name: /Appointments/i })).toBeVisible({ timeout: 10000 });
  });

  test('Verify Invoices Page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('client@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimClient2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible({ timeout: 20000 });

    // Navigate to Invoices
    await page.click('a:has-text("Invoices"), [href*="invoice"]');
    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible({ timeout: 10000 });
  });

  test('Logout Participant gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('client@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimClient2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible({ timeout: 20000 });

    // Click Sign out button
    await page.click('button:has-text("Sign out")');

    // Should return to login page without crash
    await expect(page.getByRole('heading', { name: /Ephraim Care/i })).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
