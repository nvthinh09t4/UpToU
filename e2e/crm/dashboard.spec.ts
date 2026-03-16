import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH = path.join(__dirname, '../.auth/crm-admin.json')

test.describe('CRM / Dashboard', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('dashboard page loads without error', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('greeting message is displayed', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2_000)
    await expect(
      page.getByText(/good morning|good afternoon|good evening/i)
    ).toBeVisible({ timeout: 8_000 })
  })

  test('KPI stat cards are present', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3_000)
    // At least one stat card should be visible (users, stories, etc.)
    const statCard = page.locator('.MuiCard-root').first()
    await expect(statCard).toBeVisible()
  })

  test('sidebar navigation links are visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /stories/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /categories/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /users/i })).toBeVisible()
  })

  test('recent users or recent stories list renders', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3_000)
    // Recent activity tables / lists
    await expect(page).not.toHaveTitle(/error/i)
    await expect(page.locator('.MuiCard-root')).toHaveCount.call(expect, { minimum: 1 })
    // Verify at least 2 cards on the dashboard
    await expect(page.locator('.MuiCard-root').nth(1)).toBeVisible()
  })
})
