/**
 * Client auth setup — runs once before client specs.
 * Logs in as each account type and saves storage state so tests
 * can skip the login step entirely.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { ACCOUNTS, loginClient } from './helpers/auth'

const AUTH_DIR = path.join(__dirname, '.auth')

setup('save client user session', async ({ page }) => {
  await loginClient(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  // Confirm we're past the login page
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'client-user.json') })
})

setup('save client admin session', async ({ page }) => {
  await loginClient(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'client-admin.json') })
})
