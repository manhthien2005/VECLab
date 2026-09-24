import { defineConfig, devices } from '@playwright/test'

/**
 * E2E covers guest flow, auth, resume, report, compare and responsive
 * behaviour in isolated browser contexts (docs/verification-and-acceptance.md §3).
 * Requires a running app plus configured Supabase credentials; CI runs it
 * against the preview deployment.
 */
const isCi = !!process.env.CI
/**
 * `workers` and `webServer` are omitted rather than set to `undefined`:
 * tsconfig enables exactOptionalPropertyTypes, and omission is also the
 * semantically correct way to say "use the default".
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  ...(isCi ? { workers: 2 } : {}),
  reporter: isCi ? [['html', { outputFolder: 'e2e-report' }], ['list']] : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // Against a deployed preview URL there is nothing to launch locally.
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !isCi,
          timeout: 180_000,
        },
      }),
})
