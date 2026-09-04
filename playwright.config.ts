import { defineConfig, devices } from '@playwright/test'

/**
 * E2E · architecture.md §14.
 *
 * Servernya dijalankan Playwright sendiri (`webServer`), jadi menjalankan
 * `npm run e2e` di mesin bersih hanya menuntut satu hal tambahan: unduh
 * perambannya lewat `npx playwright install`.
 *
 * Hanya Chromium di CI lokal — alur yang diuji di sini tidak menyentuh
 * kekhasan mesin render, dan tiga peramban berarti tiga kali waktu tunggu
 * untuk keyakinan yang sama.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
