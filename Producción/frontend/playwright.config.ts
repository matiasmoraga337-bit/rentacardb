import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: isCI ? 'chromium' : 'edge',
      testIgnore: /mobile\.spec\.ts/,
      use: isCI
        ? { ...devices['Desktop Chrome'] }
        : { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: isCI ? 'mobile-chromium' : 'mobile-edge',
      testMatch: /mobile\.spec\.ts/,
      use: isCI
        ? { ...devices['Pixel 7'] }
        : { ...devices['Pixel 7'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
