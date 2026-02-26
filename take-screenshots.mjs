/**
 * Screenshot capture script for EphraimCare Portal
 * Takes screenshots of all major pages on the LIVE Vercel deployments
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.join(
  '/Users/shamalkrishna/Desktop/CLIENT PROJECTS/ephraimcare-portal-2026/client-handover/screenshots'
);

const ADMIN_URL = 'https://ephraimcare-ndis-portal-admin.vercel.app';
const PARTICIPANT_URL = 'https://ephraimcare-participant-portal.vercel.app';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function shot(page, filename) {
  const dest = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: dest, fullPage: true });
  console.log(`  ✓ ${filename}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  try {
    // ── ADMIN PORTAL ──────────────────────────────────────────────────────────
    console.log('\n📸 Admin Portal...');

    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'admin-00-login.png');

    await page.fill('input[type="email"]', 'admin@ephraimcare.com.au');
    await page.fill('input[type="password"]', 'EphraimAdmin2026');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await shot(page, 'admin-01-dashboard.png');

    for (const [slug, file] of [
      ['/participants', 'admin-02-participants.png'],
      ['/workers',     'admin-03-workers.png'],
      ['/shifts',      'admin-04-shifts.png'],
      ['/plans',       'admin-05-ndis-plans.png'],
      ['/invoices',    'admin-06-invoices.png'],
      ['/case-notes',  'admin-07-case-notes.png'],
      ['/incidents',   'admin-08-incidents.png'],
      ['/compliance',  'admin-09-compliance.png'],
      ['/cancellation-requests', 'admin-10-cancellations.png'],
      ['/settings',    'admin-11-settings.png'],
    ]) {
      await page.goto(`${ADMIN_URL}${slug}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await shot(page, file);
    }

    // Sign out via server action button
    await page.goto(`${ADMIN_URL}/`);
    await page.waitForLoadState('networkidle');
    const signOutBtn = page.locator('button', { hasText: 'Sign out' });
    await signOutBtn.scrollIntoViewIfNeeded();
    await shot(page, 'admin-12-before-signout.png');
    await signOutBtn.click({ force: true });
    await page.waitForURL(`${ADMIN_URL}/login`, { timeout: 15000 });
    await shot(page, 'admin-13-after-signout.png');

    // ── PARTICIPANT PORTAL ─────────────────────────────────────────────────────
    console.log('\n📸 Participant Portal...');

    await page.goto(`${PARTICIPANT_URL}/login`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'participant-00-login.png');

    await page.fill('input[type="email"]', 'client@ephraimcare.com.au');
    await page.fill('input[type="password"]', 'EphraimClient2026');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await shot(page, 'participant-01-dashboard.png');

    for (const [slug, file] of [
      ['/appointments', 'participant-02-appointments.png'],
      ['/invoices',     'participant-03-invoices.png'],
      ['/profile',      'participant-04-profile.png'],
    ]) {
      await page.goto(`${PARTICIPANT_URL}${slug}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await shot(page, file);
    }

    console.log('\n✅ All screenshots saved to:', SCREENSHOT_DIR);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await browser.close();
  }
}

run();
