import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verifikojnë qe faqet kryesore ngarkohen pa errors fatale
 * dhe permbajtja kryesore eshte e dukshme. Nuk kane nevoje per credentials
 * Supabase reale, sepse build-i bash perdor placeholder env vars qe kthejne
 * data te zbrazet por nuk hedhin throw.
 */

test.describe('Smoke @critical', () => {
  test('homepage rendon me hero dhe nav', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/RentaKar/i);

    // Nav (logo / sitename ose link "Vetura")
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Hero ose H1
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 15_000 });

    // Asnje page error (uncaught)
    expect(errors, `Pageerrors: ${errors.join('\n')}`).toEqual([]);
  });

  test('/automjetet shfaqet pa errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/automjetet', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    expect(errors).toEqual([]);
  });

  test('/login rendon formularin', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 15_000 });
  });

  test('/regjistrohu rendon formularin', async ({ page }) => {
    await page.goto('/regjistrohu', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 15_000 });
  });

  test('/per-platformen rendon', async ({ page }) => {
    await page.goto('/per-platformen', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Rruga e panjohur tregon 404 ose redirect ne homepage', async ({ page }) => {
    const response = await page.goto('/qe-nuk-ekziston-pa-ndjenje-xyz', { waitUntil: 'domcontentloaded' });
    // SPA: server kthen 200, por ne app duhet ose 404 ose redirect.
    // Verifiko qe nuk eshte blank.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length || 0).toBeGreaterThan(20);
    // Status duhet te jete 200 (SPA serve everywhere) ose 404 (perfect setup).
    expect([200, 404]).toContain(response?.status() || 0);
  });
});

test.describe('Navigation @critical', () => {
  test('navigim nga homepage tek /automjetet permes nav link', async ({ page, isMobile }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    if (isMobile) {
      // Mobile: hap hamburger menu se nav-i eshte i fshehur
      const hamburger = page.getByRole('button', { name: /menu|menue/i }).first();
      if (await hamburger.isVisible().catch(() => false)) {
        await hamburger.click();
      }
    }

    const vehiclesLink = page.getByRole('link', { name: /vetura|vehicles|fahrzeuge/i }).first();
    await expect(vehiclesLink).toBeVisible();
    await vehiclesLink.click();

    await page.waitForURL('**/automjetet', { timeout: 10_000 });
    expect(page.url()).toContain('/automjetet');
  });
});
