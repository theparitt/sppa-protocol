import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/site', workers: 1, forbidOnly: true, reporter: 'list',
  outputDir: 'test-results',
  use: { baseURL: 'http://127.0.0.1:8247', browserName: 'chromium', launchOptions: { executablePath: process.env.SPPA_CHROMIUM || undefined }, screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/preview.mjs', url: 'http://127.0.0.1:8247/sppa-protocol/', reuseExistingServer: false },
});
