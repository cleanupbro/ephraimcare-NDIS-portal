import { test, expect } from '@playwright/test';

test('DEBUG: dump all buttons on page after login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@ephraimcare.com.au');
  await page.getByLabel(/password/i).fill('EphraimAdmin2026');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 20000 });

  // Dump all buttons found on the page
  const buttons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => ({
      text: b.innerText.trim(),
      visible: b.offsetParent !== null,
      rect: b.getBoundingClientRect(),
    }));
  });

  console.log('=== ALL BUTTONS ON PAGE ===');
  console.log(JSON.stringify(buttons, null, 2));

  // Also dump the full sidebar HTML
  const sidebarHTML = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerHTML : 'NO ASIDE FOUND';
  });

  console.log('=== SIDEBAR HTML ===');
  console.log(sidebarHTML.slice(0, 2000));
});
