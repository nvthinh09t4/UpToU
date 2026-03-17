/**
 * Client auth setup — runs once before client specs.
 * Logs in as each account type and saves storage state so tests
 * can skip the login step entirely.
 *
 * Uses different accounts from the CRM setup to avoid refresh-token
 * rotation conflicts (the login handler revokes all previous tokens
 * for a user on each new login).
 *
 * Uses a 120 s timeout to survive Vite's cold-start module compilation.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { ACCOUNTS, loginClient } from './helpers/auth'

const AUTH_DIR = path.join(__dirname, '.auth')

// Ensure the auth directory exists
setup.beforeAll(() => { fs.mkdirSync(AUTH_DIR, { recursive: true }) })

setup.setTimeout(120_000)

setup('save client user session', async ({ page }) => {
  // Use supervisor account — NOT the admin account used by CRM setup.
  // Both setups use the same API user; logging in revokes the previous
  // user's refresh tokens. Using separate accounts avoids this conflict.
  await loginClient(page, ACCOUNTS.supervisor.email, ACCOUNTS.supervisor.password)
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'client-user.json') })
})

setup('save client admin session', async ({ page }) => {
  // Use senior supervisor account for the "admin" client session
  await loginClient(page, ACCOUNTS.senior.email, ACCOUNTS.senior.password)
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'client-admin.json') })
})
