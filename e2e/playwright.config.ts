import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const CLIENT_URL = 'http://localhost:5173'
const CRM_URL    = 'http://localhost:5174'

export const AUTH_FILE = {
  clientUser:     path.join(__dirname, '.auth', 'client-user.json'),
  clientAdmin:    path.join(__dirname, '.auth', 'client-admin.json'),
  crmAdmin:       path.join(__dirname, '.auth', 'crm-admin.json'),
  crmContributor: path.join(__dirname, '.auth', 'crm-contributor.json'),
}

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts'],

  // Global pre-flight: verify the API is reachable before running any tests
  globalSetup: './api.check.ts',

  // Global test settings
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ── Authentication setup ────────────────────────────────────────────────
    {
      name: 'setup-client',
      testMatch: '**/global.setup.ts',
      use: { baseURL: CLIENT_URL },
    },
    {
      name: 'setup-crm',
      testMatch: '**/crm.setup.ts',
      use: { baseURL: CRM_URL },
    },

    // ── Client (http://localhost:5173) ──────────────────────────────────────
    {
      name: 'client',
      testDir: './client',
      dependencies: ['setup-client'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: CLIENT_URL,
      },
    },

    // ── CRM (http://localhost:5174) ─────────────────────────────────────────
    {
      name: 'crm',
      testDir: './crm',
      dependencies: ['setup-crm'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: CRM_URL,
      },
    },
  ],

  // ── Frontend dev servers ──────────────────────────────────────────────────
  // Started automatically when not in CI (CI expects them pre-started).
  // The API (port 5070) must be started separately — see api.check.ts.
  webServer: process.env.CI
    ? []
    : [
        {
          command: 'npm run dev',
          cwd: path.join(__dirname, '../client'),
          url: CLIENT_URL,
          reuseExistingServer: true,
          timeout: 60_000,
        },
        {
          command: 'npm run dev',
          cwd: path.join(__dirname, '../crm'),
          url: CRM_URL,
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ],
})
