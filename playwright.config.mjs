import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['line'], ['json', { outputFile: 'artifacts/playwright.json' }]] : 'line',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3105', trace: 'retain-on-failure' },
  webServer: process.env.PLAYWRIGHT_MANAGED_SERVER ? undefined : {
    command: 'npm run dev -- -p 3105',
    url: 'http://127.0.0.1:3105/api/v1/health',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-375', use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
});
