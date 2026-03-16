/**
 * Client auth setup — runs once before client specs.
 * Logs in as each account type and saves storage state so tests
 * can skip the login step entirely.
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
  await loginClient(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'client-user.json') })
})

setup('save client admin session', async ({ page }) => {
  await loginClient(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'client-admin.json') })
})
