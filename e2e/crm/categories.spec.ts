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
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible({ timeout: 20_000 })
  })

  test('Add Category button is visible', async ({ page }) => {
    await page.goto('/categories')
    await expect(
      page.getByRole('button', { name: /new category/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('search field filters categories', async ({ page }) => {
    await page.goto('/categories')
    // TextField has only a placeholder, no label — locate by placeholder
    const search = page.locator('input[placeholder*="Search"]')
    await expect(search).toBeVisible({ timeout: 15_000 })
    await search.fill('test')
    await page.waitForTimeout(500)
    // No crash after searching
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('create category dialog opens on Add click', async ({ page }) => {
    await page.goto('/categories')
    await page.getByRole('button', { name: /new category/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
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
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible({ timeout: 20_000 })
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
