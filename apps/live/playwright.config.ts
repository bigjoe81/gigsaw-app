import { defineConfig } from '@playwright/test';
import path from 'node:path';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4310',
    viewport: { width: 1280, height: 900 },
    permissions: ['microphone'],
    launchOptions: {
      executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'],
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
    serviceWorkers: 'allow',
  },
  webServer: {
    cwd: path.resolve(__dirname, '../..'),
    command: 'node apps/live/serve.mjs',
    url: 'http://127.0.0.1:4310',
    reuseExistingServer: !process.env['CI'],
    timeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 1194, height: 834 },
        hasTouch: true,
      },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
