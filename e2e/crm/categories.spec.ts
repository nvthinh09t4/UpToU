import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH = path.join(__dirname, '../.auth/crm-admin.json')

test.describe('CRM / Categories Page', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('categories page loads at /categories', async ({ page }) => {
    await page.goto('/categories')
    await expect(page).toHaveURL(/\/categories/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('categories data grid renders', async ({ page }) => {
    await page.goto('/categories')
    await page.waitForTimeout(3_000)
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible({ timeout: 8_000 })
  })

  test('Add Category button is visible', async ({ page }) => {
    await page.goto('/categories')
    await expect(
      page.getByRole('button', { name: /add category|new category/i })
    ).toBeVisible()
  })

  test('search field filters categories', async ({ page }) => {
    await page.goto('/categories')
    await page.waitForTimeout(2_000)
    const search = page.getByRole('textbox', { name: /search/i })
    await expect(search).toBeVisible()
    await search.fill('test')
    await page.waitForTimeout(500)
    // No crash after searching
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('create category dialog opens on Add click', async ({ page }) => {
    await page.goto('/categories')
    await page.getByRole('button', { name: /add category|new category/i }).click()
    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()
    // Close dialog
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

// ── Users page ────────────────────────────────────────────────────────────────

test.describe('CRM / Users Page', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('users page loads at /users', async ({ page }) => {
    await page.goto('/users')
    await expect(page).toHaveURL(/\/users/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('users data grid renders', async ({ page }) => {
    await page.goto('/users')
    await page.waitForTimeout(3_000)
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible({ timeout: 8_000 })
  })
})

// ── Roles page ────────────────────────────────────────────────────────────────

test.describe('CRM / Roles Page', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('roles page loads at /roles', async ({ page }) => {
    await page.goto('/roles')
    await expect(page).toHaveURL(/\/roles/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })
})

// ── Reports page ──────────────────────────────────────────────────────────────

test.describe('CRM / Reports Page', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('reports page loads at /reports', async ({ page }) => {
    await page.goto('/reports')
    await expect(page).toHaveURL(/\/reports/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })
})

// ── Rewards admin page ────────────────────────────────────────────────────────

test.describe('CRM / Rewards Admin Page', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('rewards admin page loads at /rewards', async ({ page }) => {
    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/rewards/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })
})
