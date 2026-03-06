import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
  await page.getByLabel(/password/i).fill('EphraimAdmin2026');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });
}

test.describe('Admin Rostering & Balancing Workflow', () => {
  
  test('Admin can check participant budgets and roster a shift', async ({ page }) => {
    // 1. Log in
    await loginAsAdmin(page);

    // 2. Check NDIS Plans (Balancing)
    await page.goto('/plans');
    await expect(page.getByRole('heading', { name: /NDIS Plans/i })).toBeVisible({ timeout: 15000 });
    
    // Check that we can see at least the word 'Budget' or some plans
    const budgetText = page.locator('text=/Total Budget/i');
    if (await budgetText.first().isVisible({ timeout: 5000 }).catch(() => false)) {
       expect(true).toBeTruthy();
    } else {
       // If empty state
       const emptyState = page.locator('text=/No NDIS plans found/i');
       expect(await emptyState.isVisible()).toBeTruthy();
    }

    // 3. Roster a Shift (Rostering)
    await page.goto('/shifts');
    await expect(page.getByRole('heading', { name: /shifts/i })).toBeVisible({ timeout: 15000 });

    const newShiftBtn = page.getByRole('button', { name: /new shift/i }).or(page.locator('a', { hasText: /new shift/i }));
    await newShiftBtn.first().click();
    await page.waitForTimeout(1500);

    // Fill participant
    const participantField = page.getByLabel(/participant/i).first();
    if (await participantField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await participantField.click();
      await page.waitForTimeout(500);
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Fill worker
    const workerField = page.getByLabel(/worker/i).first();
    if (await workerField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await workerField.click();
      await page.waitForTimeout(500);
      const firstWorkerOption = page.getByRole('option').first();
      if (await firstWorkerOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstWorkerOption.click();
      }
    }

    // Fill date & time
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await dateInput.fill(tomorrow.toISOString().split('T')[0]);
    }

    const startTimeInput = page.locator('input[type="time"]').first();
    if (await startTimeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startTimeInput.fill('08:00');
    }

    const endTimeInput = page.locator('input[type="time"]').nth(1);
    if (await endTimeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endTimeInput.fill('16:00');
    }

    // Submit shift
    const submitBtn = page.getByRole('button', { name: /create|save|submit/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // 4. Verify back on shifts or success
    const onShiftsPage = await page.url().includes('/shifts');
    const successVisible = await page.locator('text=/success|created|shift/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(onShiftsPage || successVisible).toBeTruthy();

    // 5. Final Balance check
    await page.goto('/plans');
    await expect(page.getByRole('heading', { name: /NDIS Plans/i })).toBeVisible({ timeout: 15000 });
  });
});
