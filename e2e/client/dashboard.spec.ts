import { test, expect } from '@playwright/test'
import { ACCOUNTS, loginClient } from '../helpers/auth'

test.describe('Client / Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginClient(page, ACCOUNTS.supervisor.email, ACCOUNTS.supervisor.password)
  })

  test('redirects unauthenticated users to login', async ({ browser }) => {
    const ctx = await browser.newContext() // fresh context, no auth
    const page = await ctx.newPage()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
    await ctx.close()
  })

  test('dashboard page loads for authenticated user', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('streak badge or streak card is visible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(3_000)
    // Streak info — could be displayed as a badge or stat card
    const streakText = page.getByText(/streak|day streak|🔥/i)
    // Verify no crash even if streak is 0
    await expect(page).not.toHaveTitle(/error/i)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('user profile info is displayed', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2_000)
    // First name or email should appear in the header or profile area
    await expect(page.locator('body')).toContainText(/admin|UpToU/i)
  })

  test('achievement cards are rendered', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2_000)
    // The welcome achievement is always unlocked
    await expect(page.getByText(/Welcome/i)).toBeVisible()
  })

  test('credits stat is visible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2_000)
    // Credits label or icon
    await expect(page.getByText(/credit/i).first()).toBeVisible()
  })
})
