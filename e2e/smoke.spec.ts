import { test, expect, Page } from '@playwright/test';

/**
 * Smoke tests — verifikojnë qe faqet kryesore ngarkohen pa errors fatale
 * dhe permbajtja kryesore eshte e dukshme. Nuk kane nevoje per credentials
 * Supabase reale, sepse build-i bash perdor placeholder env vars qe kthejne
 * data te zbrazet por nuk hedhin throw.
 */

/**
 * Vite-built React app duhet kohë per te ngarkuar chunks dhe per te bere mount.
 * Kjo wait per `#root > *` qe nje fëmijë i parë te shfaqet ne root div.
 * Përdor `load` ne vend te `domcontentloaded` qe te presë per te gjitha chunks.
 */
async function gotoAndWaitForApp(page: Page, path: string): Promise<void> {
  // Capture console errors per debugging nese test fails.
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(path, { waitUntil: 'load' });

  // Prit qe React te bëje mount (root div te kete nje child element).
  try {
    await page.waitForSelector('#root > *', { state: 'attached', timeout: 20_000 });
  } catch (e) {
    // Diagnostik: log se cfare ka body dhe console errors per debugging.
    const html = await page.content();
    console.error('[e2e diag] App did not mount within 20s. Path:', path);
    console.error('[e2e diag] Console errors:', consoleErrors.slice(0, 20).join('\n'));
    console.error('[e2e diag] HTML length:', html.length);
    console.error('[e2e diag] Body excerpt:', html.slice(0, 2000));
    throw e;
  }
}

test.describe('Smoke @critical', () => {
  test('homepage rendon me hero dhe nav', async ({ page }) => {
    await gotoAndWaitForApp(page, '/');

    await expect(page).toHaveTitle(/RentaKar/i);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 15_000 });

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 15_000 });
  });

  test('/automjetet shfaqet', async ({ page }) => {
    await gotoAndWaitForApp(page, '/automjetet');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });

  test('/login rendon formularin', async ({ page }) => {
    await gotoAndWaitForApp(page, '/login');
    // Loginage mund te kete input pa role=textbox, perdor nje selector me te gjere.
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('/regjistrohu rendon formularin', async ({ page }) => {
    await gotoAndWaitForApp(page, '/regjistrohu');
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible({ timeout: 15_000 });
  });

  test('/per-platformen rendon', async ({ page }) => {
    await gotoAndWaitForApp(page, '/per-platformen');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Rruga e panjohur nuk eshte blank (404 ose redirect)', async ({ page }) => {
    await gotoAndWaitForApp(page, '/qe-nuk-ekziston-pa-ndjenje-xyz');
    // Verifiko qe trupin (after React mount) ka permbajtje te mjaftueshme — ose 404 page ose redirect ne nje page real.
    const bodyText = (await page.locator('body').textContent()) || '';
    expect(bodyText.trim().length).toBeGreaterThan(20);
  });
});

test.describe('Navigation @critical', () => {
  test('navigim nga homepage tek /automjetet permes nav link', async ({ page, isMobile }) => {
    await gotoAndWaitForApp(page, '/');

    if (isMobile) {
      const hamburger = page.getByRole('button', { name: /menu|menue/i }).first();
      if (await hamburger.isVisible().catch(() => false)) {
        await hamburger.click();
      }
    }

    const vehiclesLink = page.getByRole('link', { name: /vetura|vehicles|fahrzeuge/i }).first();
    await expect(vehiclesLink).toBeVisible({ timeout: 10_000 });
    await vehiclesLink.click();

    await page.waitForURL('**/automjetet', { timeout: 10_000 });
    expect(page.url()).toContain('/automjetet');
  });
});
