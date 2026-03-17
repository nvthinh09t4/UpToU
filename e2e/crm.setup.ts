/**
 * CRM auth setup — runs once before CRM specs.
 *
 * Playwright's storageState() captures cookies + localStorage but NOT sessionStorage.
 * The CRM auth store uses sessionStorage (Zustand persist). We therefore capture
 * the sessionStorage key manually and merge it into the saved state file so that
 * each test loads a fully authenticated context without needing to refresh via cookie.
 *
 * Uses a 120 s timeout to survive Vite's cold-start module compilation.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { ACCOUNTS, loginCrm } from './helpers/auth'

const AUTH_DIR  = path.join(__dirname, '.auth')
const CRM_URL   = 'http://localhost:5174'

setup.beforeAll(() => { fs.mkdirSync(AUTH_DIR, { recursive: true }) })

setup.setTimeout(120_000)

async function saveCrmSession(page: import('@playwright/test').Page, filePath: string) {
  const state = await page.context().storageState()

  // Playwright doesn't capture sessionStorage — extract it manually
  const sessionEntries = await page.evaluate<Array<{ name: string; value: string }>>(() => {
    const entries: Array<{ name: string; value: string }> = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!
      entries.push({ name: key, value: sessionStorage.getItem(key)! })
    }
    return entries
  })

  if (sessionEntries.length > 0) {
    // Check if origin already exists in state
    let origin = (state.origins as Array<{ origin: string; localStorage: Array<{ name: string; value: string }>; sessionStorage?: Array<{ name: string; value: string }> }>)
      .find(o => o.origin === CRM_URL)
    if (origin) {
      origin.sessionStorage = sessionEntries
    } else {
      (state.origins as Array<unknown>).push({
        origin: CRM_URL,
        localStorage: [],
        sessionStorage: sessionEntries,
      })
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(state, null, 2))
}

setup('save crm admin session', async ({ page }) => {
  await loginCrm(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  await expect(page).not.toHaveURL(/\/login/)
  await saveCrmSession(page, path.join(AUTH_DIR, 'crm-admin.json'))
})

setup('save crm contributor session', async ({ page }) => {
  await loginCrm(page, ACCOUNTS.contributor.email, ACCOUNTS.contributor.password)
  await expect(page).not.toHaveURL(/\/login/)
  await saveCrmSession(page, path.join(AUTH_DIR, 'crm-contributor.json'))
})
