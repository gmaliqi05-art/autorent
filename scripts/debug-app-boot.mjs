/**
 * Manual debug script: launches a headless chromium against the preview server,
 * captures EVERYTHING, and writes it to debug-output.json. Run via:
 *
 *   node scripts/debug-app-boot.mjs
 *
 * Use this when Playwright tests fail in CI to capture exact browser behavior.
 */
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const url = process.env.DEBUG_URL || 'http://127.0.0.1:4173/';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const consoleMessages = [];
const pageErrors = [];
const failedRequests = [];
const responses = [];

page.on('console', msg => {
  consoleMessages.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
  });
});
page.on('pageerror', err => {
  pageErrors.push({
    message: err.message,
    stack: err.stack,
    name: err.name,
  });
});
page.on('requestfailed', req => {
  failedRequests.push({
    method: req.method(),
    url: req.url(),
    failure: req.failure()?.errorText,
    resourceType: req.resourceType(),
  });
});
page.on('response', res => {
  // Only log a summary
  if (responses.length < 50) {
    responses.push({
      status: res.status(),
      url: res.url(),
      contentType: res.headers()['content-type'],
    });
  }
});

let bootError = null;
try {
  await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
} catch (e) {
  bootError = String(e);
}

// Wait a bit for React to mount
await page.waitForTimeout(5000);

const html = await page.content().catch(() => '<unavailable>');
const rootInnerHtml = await page.locator('#root').innerHTML().catch(() => '<unavailable>');
const rootChildCount = await page.locator('#root > *').count().catch(() => -1);
const title = await page.title().catch(() => '<unavailable>');
const navCount = await page.locator('nav').count().catch(() => -1);
const h1Count = await page.locator('h1').count().catch(() => -1);

const result = {
  url,
  title,
  bootError,
  rootChildCount,
  navCount,
  h1Count,
  htmlLength: html.length,
  rootInnerHtmlLength: rootInnerHtml.length,
  htmlExcerpt: html.slice(0, 3000),
  rootInnerHtmlExcerpt: rootInnerHtml.slice(0, 3000),
  consoleMessages,
  pageErrors,
  failedRequests,
  responses,
};

await writeFile('debug-output.json', JSON.stringify(result, null, 2));
console.log('=== DEBUG OUTPUT ===');
console.log('Title:', title);
console.log('Boot error:', bootError);
console.log('Root child count:', rootChildCount);
console.log('Nav count:', navCount);
console.log('H1 count:', h1Count);
console.log('HTML length:', html.length);
console.log('Root innerHTML length:', rootInnerHtml.length);
console.log('Console messages:', consoleMessages.length);
consoleMessages.forEach(m => console.log(`  [${m.type}] ${m.text}`));
console.log('Page errors:', pageErrors.length);
pageErrors.forEach(e => console.log(`  ${e.name}: ${e.message}`));
console.log('Failed requests:', failedRequests.length);
failedRequests.forEach(r => console.log(`  ${r.method} ${r.url} — ${r.failure}`));
console.log('=== END DEBUG ===');

await browser.close();
process.exit(bootError ? 1 : 0);
