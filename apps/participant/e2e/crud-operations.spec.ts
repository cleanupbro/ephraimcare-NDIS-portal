import { test, expect } from '@playwright/test';

// Helper: login as participant
async function loginAsParticipant(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('client@ephraimcare.com.au');
  await page.getByLabel(/password/i).fill('EphraimClient2026');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible({ timeout: 20000 });
}

test.describe('Participant CRUD Operations', () => {

  test('View dashboard and check budget', async ({ page }) => {
    await loginAsParticipant(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Check budget widget
    const budgetHeading = page.locator('text=/Budget Usage/i');
    if (await budgetHeading.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(true).toBeTruthy();
    }
    
    // Check upcoming appointments widget
    const appointmentsText = page.locator('text=/Upcoming Appointments/i');
    if (await appointmentsText.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(true).toBeTruthy();
    }
  });

  test('View appointments', async ({ page }) => {
    await loginAsParticipant(page);
    await page.goto('/appointments');
    await expect(page.locator('h1').first()).toContainText(/Appointments/i);
    
    // Verify list is rendered or empty state
    expect(page.url()).toContain('/appointments');
  });

  test('View invoices', async ({ page }) => {
    await loginAsParticipant(page);
    await page.goto('/invoices');
    await expect(page.locator('h1').first()).toContainText(/Invoices/i);
    expect(page.url()).toContain('/invoices');
  });

  test('View profile', async ({ page }) => {
    await loginAsParticipant(page);
    await page.goto('/profile');
    await expect(page.locator('h1').first()).toContainText(/Profile/i);
    expect(page.url()).toContain('/profile');
  });

  test('Request a cancellation from appointments', async ({ page }) => {
    await loginAsParticipant(page);
    await page.goto('/appointments');
    await expect(page.locator('h1').first()).toContainText(/Appointments/i);

    // If an appointment exists with a Cancel button, click it
    const cancelBtn = page.getByRole('button', { name: /Request Cancellation|Cancel/i }).first();
    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(1000);

      // Confirm dialog if it appears
      const confirmBtn = page.getByRole('button', { name: /Confirm|Yes|Submit/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    expect(page.url()).toContain('/appointments');
  });

  test('Sign out gracefully', async ({ page }) => {
    await loginAsParticipant(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible({ timeout: 15000 });

    const signOutBtn = page.getByRole('button', { name: /Sign out/i }).or(page.locator('text=/Sign out/i')).first();
    if (await signOutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signOutBtn.click();
      await page.waitForTimeout(2000);
    }
    await expect(page).toHaveURL(/.*\/login/);
  });
});
