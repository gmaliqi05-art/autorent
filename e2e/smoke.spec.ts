import { test, expect, Page } from '@playwright/test';

/**
 * Smoke tests qe NUK kërkojnë React mount te sukseshëm.
 *
 * Cdo test kontrollon nje vetë te SPA-it qe nuk varet nga JS:
 * - Title (nga <title> ne index.html)
 * - Meta tags (nga index.html)
 * - SPA routing (server kthen index.html per cdo path)
 *
 * Pra keto teste vërtetojnë qe deploy-i serven app-in sakte. Per të testuar
 * sjelljen browser-side te plotë (qe kërkojnë Supabase real), shih roadmap-in
 * ne PR-in #64 — duhet test environment me Supabase staging.
 */

test.describe('Page metadata @critical', () => {
  for (const path of ['/', '/automjetet', '/login', '/regjistrohu', '/per-platformen']) {
    test(`${path} kthen index.html me title te sakte`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      // Title vjen nga index.html — nuk kërkon React mount.
      await expect(page).toHaveTitle(/RentaKar/i);
    });
  }

  test('homepage ka root div per React mount', async ({ page }: { page: Page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeAttached();
  });

  test('main JS bundle eshte i lidhur nga index.html', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Vite bundle preload links me hash ne emer
    const scriptCount = await page.locator('script[type="module"]').count();
    expect(scriptCount).toBeGreaterThan(0);
  });
});

test.describe('SPA routing @critical', () => {
  test('rrugë e panjohur kthen index.html (jo 500)', async ({ page }) => {
    const response = await page.goto('/rrugë-qe-nuk-ekziston-xyz', { waitUntil: 'domcontentloaded' });
    expect([200, 404]).toContain(response?.status() || 0);
    // Permbajtja duhet ende te kete tag-un root (SPA fallback)
    await expect(page.locator('#root')).toBeAttached();
  });
});
