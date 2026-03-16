import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH = path.join(__dirname, '../.auth/crm-admin.json')

test.describe('CRM / Dashboard', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('dashboard page loads without error', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('greeting message is displayed', async ({ page }) => {
    await page.goto('/')
    // Wait for data to load — greeting only appears after dashboard stats query resolves
    await expect(
      page.getByText(/good morning|good afternoon|good evening/i)
    ).toBeVisible({ timeout: 20_000 })
  })

  test('KPI stat cards are present', async ({ page }) => {
    await page.goto('/')
    // Wait for stat cards to render after data loads
    const statCard = page.locator('.MuiCard-root').first()
    await expect(statCard).toBeVisible({ timeout: 20_000 })
  })

  test('sidebar navigation items are visible', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    // Sidebar uses ListItemButton (role=button), not <a> links
    await expect(page.getByRole('button', { name: /stories/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /categories/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /users/i })).toBeVisible()
  })

  test('recent users or recent stories list renders', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(4_000)
    await expect(page).not.toHaveTitle(/error/i)
    // Dashboard has at least 2 MUI cards after data loads
    await expect(page.locator('.MuiCard-root').nth(1)).toBeVisible({ timeout: 20_000 })
  })
})
