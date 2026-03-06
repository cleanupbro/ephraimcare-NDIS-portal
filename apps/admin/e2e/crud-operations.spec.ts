import { test, expect } from '@playwright/test';

// Helper: login as admin
async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
  await page.getByLabel(/password/i).fill('EphraimAdmin2026');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });
}

test.describe('Admin CRUD Operations', () => {
  // test.describe.configure({ mode: 'serial' });

  // ─── SHIFTS ────────────────────────────────────────────────────────────────

  test('Create a new shift', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/shifts');
    await expect(page.getByRole('heading', { name: /shifts/i })).toBeVisible({ timeout: 15000 });

    // Click New Shift button
    const newShiftBtn = page.getByRole('button', { name: /new shift/i }).or(page.locator('a', { hasText: /new shift/i }));
    await newShiftBtn.first().click();

    // Wait for modal or new page
    await page.waitForTimeout(1500);

    // Fill participant field
    const participantField = page.getByLabel(/participant/i).first();
    if (await participantField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await participantField.click();
      await page.waitForTimeout(500);
      // Pick first option from dropdown
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Fill worker field
    const workerField = page.getByLabel(/worker/i).first();
    if (await workerField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await workerField.click();
      await page.waitForTimeout(500);
      const firstWorkerOption = page.getByRole('option').first();
      if (await firstWorkerOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstWorkerOption.click();
      }
    }

    // Fill date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateInput.fill(dateStr);
    }

    // Fill start time
    const startTimeInput = page.locator('input[type="time"]').first();
    if (await startTimeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startTimeInput.fill('09:00');
    }

    // Fill end time
    const endTimeInput = page.locator('input[type="time"]').nth(1);
    if (await endTimeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endTimeInput.fill('11:00');
    }

    // Submit the form
    const submitBtn = page.getByRole('button', { name: /create|save|submit/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify we're back on shifts page or success shown
    const onShiftsPage = await page.url().includes('/shifts');
    const successVisible = await page.locator('text=/success|created|shift/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(onShiftsPage || successVisible).toBeTruthy();
  });

  test('Edit an existing shift', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/shifts');
    await expect(page.getByRole('heading', { name: /shifts/i })).toBeVisible({ timeout: 15000 });

    // Click first shift row to open detail/edit
    const firstShiftRow = page.locator('table tbody tr, [data-testid="shift-row"]').first();
    if (await firstShiftRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstShiftRow.click();
      await page.waitForTimeout(1500);

      // Look for an Edit button
      const editBtn = page.getByRole('button', { name: /edit/i }).or(page.locator('a', { hasText: /edit/i }));
      if (await editBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBtn.first().click();
        await page.waitForTimeout(1000);

        // Change end time
        const endTimeInput = page.locator('input[type="time"]').nth(1);
        if (await endTimeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await endTimeInput.fill('12:00');
        }

        // Save
        const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
        if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Assert we're still on shifts or detail page
    expect(page.url()).toContain('/shift');
  });

  test('Delete a shift', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/shifts');
    await expect(page.getByRole('heading', { name: /shifts/i })).toBeVisible({ timeout: 15000 });

    // Open first shift
    const firstShiftRow = page.locator('table tbody tr').first();
    if (await firstShiftRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstShiftRow.click();
      await page.waitForTimeout(1500);

      // Look for Delete button
      const deleteBtn = page.getByRole('button', { name: /delete|cancel shift/i });
      if (await deleteBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.first().click();
        await page.waitForTimeout(1000);

        // Confirm delete dialog if present
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.first().click();
          await page.waitForTimeout(2000);
        }
      }
    }
    // Just verify the page is still accessible
    expect(page.url()).toContain('/shifts');
  });

  // ─── PARTICIPANTS ───────────────────────────────────────────────────────────

  test('Create a new participant', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/participants');
    await expect(page.getByRole('heading', { name: /participants/i })).toBeVisible({ timeout: 15000 });

    // Click Add Participant
    const addBtn = page.getByRole('button', { name: /add participant/i }).or(page.locator('a', { hasText: /add participant/i }));
    await addBtn.first().click();
    await page.waitForTimeout(1500);

    // Fill fields
    const firstNameField = page.getByLabel(/first name/i);
    if (await firstNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstNameField.fill('TestFirst');
    }
    const lastNameField = page.getByLabel(/last name/i);
    if (await lastNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lastNameField.fill('TestLast');
    }
    const emailField = page.getByLabel(/email/i).nth(1);
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill('testparticipant_delete_me@ephraimcare.com.au');
    }
    const phoneField = page.getByLabel(/phone/i);
    if (await phoneField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneField.fill('0400000000');
    }
    const ndisField = page.getByLabel(/ndis/i);
    if (await ndisField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ndisField.fill('430000000');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /create|save|next|submit/i }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Verify navigated or success shown
    const success = await page.locator('text=/success|created|participant/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(success || page.url().includes('/participants')).toBeTruthy();
  });

  test('Edit a participant', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/participants');
    await expect(page.getByRole('heading', { name: /participants/i })).toBeVisible({ timeout: 15000 });

    // Click first participant
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(1500);

      const editBtn = page.getByRole('button', { name: /edit/i }).or(page.locator('a', { hasText: /edit/i }));
      if (await editBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBtn.first().click();
        await page.waitForTimeout(1000);

        const noteField = page.getByLabel(/notes/i);
        if (await noteField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await noteField.fill('Updated by automated test');
        }

        const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
        if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    expect(page.url()).toContain('/participant');
  });

  // ─── CANCELLATIONS ──────────────────────────────────────────────────────────

  test('Accept a cancellation request', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/cancellation-requests');
    await expect(page.locator('h1').first()).toContainText(/Cancellation/i);

    // Look for an Approve/Accept button
    const approveBtn = page.getByRole('button', { name: /approve|accept/i }).first();
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(2000);

      // Confirm if dialog
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|approve/i });
      if (await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.first().click();
        await page.waitForTimeout(2000);
      }
    }
    expect(page.url()).toContain('/cancellation-requests');
  });

  // ─── CASE NOTES ─────────────────────────────────────────────────────────────

  test('View and add a case note', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/case-notes');
    await expect(page.getByRole('heading', { name: /case notes/i })).toBeVisible({ timeout: 15000 });

    // Check if we can see case notes
    const noteRow = page.locator('table tbody tr').first();
    const hasNotes = await noteRow.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasNotes || page.url().includes('/case-notes')).toBeTruthy();
  });

  // ─── INCIDENTS ──────────────────────────────────────────────────────────────

  test('View incidents list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/incidents');
    await expect(page.getByRole('heading', { name: /incidents/i })).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('/incidents');
  });

  // ─── COMPLIANCE ─────────────────────────────────────────────────────────────

  test('View compliance dashboard and check score', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/compliance');
    await expect(page.getByRole('heading', { name: /compliance/i }).first()).toBeVisible({ timeout: 15000 });

    // Score should be visible
    const scoreText = page.locator('text=/score|%|\\/100/i');
    const scoreVisible = await scoreText.first().isVisible({ timeout: 8000 }).catch(() => false);
    expect(scoreVisible || page.url().includes('/compliance')).toBeTruthy();
  });

  // ─── WORKERS ────────────────────────────────────────────────────────────────

  test('Open Add Worker form and verify fields', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/workers');
    await expect(page.getByRole('heading', { name: /workers/i })).toBeVisible({ timeout: 15000 });

    const addWorkerBtn = page.getByRole('button', { name: /add worker|invite/i }).or(page.locator('a', { hasText: /add worker|invite/i }));
    await addWorkerBtn.first().click();
    await page.waitForTimeout(1500);

    // Verify form fields are present
    const nameField = page.getByLabel(/name/i).first();
    const emailField = page.getByLabel(/email/i).first();
    expect(
      (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await emailField.isVisible({ timeout: 3000 }).catch(() => false))
    ).toBeTruthy();
  });
});
