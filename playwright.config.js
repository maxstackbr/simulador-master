import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'test',
  testMatch: /.*\.spec\.js/, // test/*.test.js é do Vitest
  timeout: 30_000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
