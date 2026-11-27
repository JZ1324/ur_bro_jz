import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? join(tmpdir(), 'garden-playwright-results'),
  use: { baseURL: 'http://127.0.0.1:5189', trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'node --import tsx e2e/server.mjs',
    url: 'http://127.0.0.1:5189',
    reuseExistingServer: false,
    env: {
      GARDEN_PUBLIC_URL: 'http://127.0.0.1:5189',
      VITE_SECRET_NAME_FUNCTION_URL: '/api/test-secret-name',
    },
  },
});
