/**
 * CRM auth setup — runs once before CRM specs.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { ACCOUNTS, loginCrm } from './helpers/auth'

const AUTH_DIR = path.join(__dirname, '.auth')

setup('save crm admin session', async ({ page }) => {
  await loginCrm(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'crm-admin.json') })
})

setup('save crm contributor session', async ({ page }) => {
  await loginCrm(page, ACCOUNTS.contributor.email, ACCOUNTS.contributor.password)
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: path.join(AUTH_DIR, 'crm-contributor.json') })
})
