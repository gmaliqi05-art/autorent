import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config për smoke E2E tests.
 *
 * Tests run kundër vite preview server qe build-i prodhues servohet.
 * Per CI, browsers do install-ohen permes `npx playwright install --with-deps`.
 *
 * Per local dev: `npm run test:e2e` (build + preview + test)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4173',
        port: 4173,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: {
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
          VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key',
          VITE_SITE_URL: 'http://localhost:4173',
        },
      },
});
