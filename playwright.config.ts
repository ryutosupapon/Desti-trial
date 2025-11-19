import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    headless: true,
  },
})
