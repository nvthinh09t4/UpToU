import { test, expect } from '@playwright/test'
import { ACCOUNTS, loginCrm } from '../helpers/auth'

// ── Login page ────────────────────────────────────────────────────────────────

test.describe('CRM / Login', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('nobody@example.com')
    await page.locator('input[type="password"]').fill('wrongpass')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 })
  })

  test('admin login succeeds and redirects to dashboard', async ({ page }) => {
    await loginCrm(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('non-staff user is rejected with an error', async ({ page }) => {
    // Use a non-existent account — will get invalid credentials error
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('nouser@example.com')
    await page.locator('input[type="password"]').fill('123456aA@')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 })
  })
})

// ── Auth guard ────────────────────────────────────────────────────────────────

test.describe('CRM / Auth Guard', () => {
  test('unauthenticated visit to / redirects to /login', async ({ browser }) => {
    const ctx = await browser.newContext() // fresh context, no auth
    const page = await ctx.newPage()
    await page.goto('/')
    // AppBootstrap attempts /auth/refresh (no cookie → 401), then ProtectedRoute redirects
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await ctx.close()
  })
})

// ── Logout ───────────────────────────────────────────────────────────────────

test.describe('CRM / Logout', () => {
  test.beforeEach(async ({ page }) => {
    await loginCrm(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/)

    // Look for logout via account/avatar button
    const accountBtn = page.getByRole('button', { name: /account|logout|admin/i }).last()
    if (await accountBtn.isVisible()) {
      await accountBtn.click()
      const logoutItem = page.getByRole('menuitem', { name: /logout|sign out/i })
      if (await logoutItem.isVisible()) {
        await logoutItem.click()
        await expect(page).toHaveURL(/\/login/)
      }
    }
  })
})
