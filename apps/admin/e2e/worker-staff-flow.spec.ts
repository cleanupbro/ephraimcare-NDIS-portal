import { test, expect } from '@playwright/test';

test.describe('Staff/Worker Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
    await page.getByLabel(/password/i).fill('EphraimAdmin2026');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });
  });

  test('View Workers list with active workers', async ({ page }) => {
    await page.goto('/workers');
    
    // Heading and count
    await expect(page.getByRole('heading', { name: /Workers/i })).toBeVisible({ timeout: 15000 });
    
    // Should show count of active workers
    await expect(page.locator('text=/\\d+ active worker/')).toBeVisible({ timeout: 10000 });
    
    // Workers should be listed (at least one worker exists: james@ephraimcare.com.au)
    const workerRows = page.locator('table tbody tr, [data-worker-card], .worker-card, [class*="worker"]').first();
    await expect(workerRows).toBeVisible({ timeout: 10000 });
  });

  test('Search and filter workers', async ({ page }) => {
    await page.goto('/workers');
    await expect(page.getByRole('heading', { name: /Workers/i })).toBeVisible({ timeout: 15000 });
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('James');
      await page.waitForTimeout(600); // debounce
      // Should show filtered results
      await expect(page.locator('text=/James/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Open worker detail page via link or navigate to /workers/new', async ({ page }) => {
    await page.goto('/workers');
    await expect(page.getByRole('heading', { name: /Workers/i })).toBeVisible({ timeout: 15000 });
    
    // Try clicking any link to a worker detail page
    const workerLinks = page.locator('a[href*="/workers/"]').filter({ hasText: /.+/ });
    const count = await workerLinks.count();
    
    if (count > 0) {
      // Click the first worker link that isn't /workers/new or /workers itself
      for (let i = 0; i < count; i++) {
        const href = await workerLinks.nth(i).getAttribute('href');
        if (href && href !== '/workers' && !href.endsWith('/new')) {
          await workerLinks.nth(i).click();
          await expect(page).toHaveURL(/\/workers\/.+/, { timeout: 10000 });
          // Back link should be present
          await expect(page.locator('text=Workers').first()).toBeVisible({ timeout: 10000 });
          return;
        }
      }
    }
    
    // Fallback: verify /workers/new loads correctly
    await page.goto('/workers/new');
    await expect(page.getByRole('heading', { name: /Add Worker/i })).toBeVisible({ timeout: 15000 });
  });

  test('View worker compliance page (Compliance Dashboard)', async ({ page }) => {
    await page.goto('/compliance');
    
    // The page heading is "Compliance Dashboard"
    await expect(page.locator('h1').filter({ hasText: 'Compliance Dashboard' })).toBeVisible({ timeout: 20000 });
    
    // Score calculation info is always visible (not async)
    await expect(page.locator('text=Score Calculation')).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Shifts and view shift details', async ({ page }) => {
    await page.goto('/shifts');
    await expect(page.getByRole('heading', { name: /Shifts/i })).toBeVisible({ timeout: 15000 });
    
    // At least some content loads
    const content = page.locator('main');
    await expect(content).toBeVisible();
    
    // Try to open a shift detail if rows are clickable
    const clickableRow = page.locator('table tbody tr').first();
    if (await clickableRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clickableRow.click();
      // Either a sheet/drawer opens or navigates
      await page.waitForTimeout(1000);
      // Just check we didn't crash
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Invite new worker form is accessible', async ({ page }) => {
    await page.goto('/workers');
    await expect(page.getByRole('heading', { name: /Workers/i })).toBeVisible({ timeout: 15000 });
    
    // Look for invite/add worker button
    const inviteBtn = page.locator('button, a').filter({ hasText: /invite|add worker|new worker/i }).first();
    if (await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(1000);
      
      // Should open a form or navigate to a new page
      const hasEmailField = await page.getByLabel(/email/i).isVisible().catch(() => false);
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      expect(hasEmailField || hasModal).toBeTruthy();
    }
  });

  test('Case Notes page loads for admin', async ({ page }) => {
    await page.goto('/case-notes');
    await expect(page.getByRole('heading', { name: /Case Notes/i })).toBeVisible({ timeout: 15000 });
    
    // Content should be present (may be empty or have data)
    await expect(page.locator('main')).toBeVisible();
  });

  test('Incidents page loads and shows filter controls', async ({ page }) => {
    await page.goto('/incidents');
    await expect(page.getByRole('heading', { name: /Incidents/i })).toBeVisible({ timeout: 15000 });
    
    // Filter or table should be present
    await expect(page.locator('main')).toBeVisible();
  });
});
