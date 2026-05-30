import { test, expect } from '@playwright/test';

/**
 * Sanity checks pa Browser interactions — verifikon qe vite preview serven
 * eshte i ngritur dhe ben serv HTML + assets sakte. Nese keto fail-ojnë,
 * problemi eshte ne deploy, jo ne app code.
 */

test.describe('Server health @critical', () => {
  test('vite preview serves index.html', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html.length).toBeGreaterThan(1000);
    expect(html).toContain('<div id="root">');
    expect(html).toContain('RentaKar');
  });

  test('main JS bundle eshte i ngarkueshëm', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const match = html.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/);
    expect(match, `Main JS bundle nuk u gjet ne HTML. HTML excerpt: ${html.slice(0, 500)}`).not.toBeNull();
    if (!match) return;
    const jsRes = await request.get(match[1]);
    expect(jsRes.status()).toBe(200);
    const js = await jsRes.text();
    expect(js.length).toBeGreaterThan(10_000);
  });

  test('SPA serv shafq index.html per rrugë te panjohur', async ({ request }) => {
    const res = await request.get('/rrugë-qe-nuk-ekziston-xyz');
    expect([200, 404]).toContain(res.status());
    const html = await res.text();
    expect(html).toContain('<div id="root">');
  });
});
