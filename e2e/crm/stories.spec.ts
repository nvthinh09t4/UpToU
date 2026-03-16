import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH    = path.join(__dirname, '../.auth/crm-admin.json')
const CONTRIB_AUTH  = path.join(__dirname, '../.auth/crm-contributor.json')

// ── Stories list ──────────────────────────────────────────────────────────────

test.describe('CRM / Stories Page', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('stories page loads at /stories', async ({ page }) => {
    await page.goto('/stories')
    await expect(page).toHaveURL(/\/stories/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('stories data grid or list is rendered', async ({ page }) => {
    await page.goto('/stories')
    // MUI DataGrid renders a role=grid
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible({ timeout: 20_000 })
  })

  test('search field is present', async ({ page }) => {
    await page.goto('/stories')
    // TextField has only a placeholder, no label — locate by placeholder
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible({ timeout: 15_000 })
  })

  test('New Story button is visible for admin', async ({ page }) => {
    await page.goto('/stories')
    await expect(
      page.getByRole('button', { name: /new story/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('status tabs are present', async ({ page }) => {
    await page.goto('/stories')
    // Tabs: "All Stories" and "Pending Review"
    await expect(page.getByText(/All Stories/i)).toBeVisible({ timeout: 15_000 })
  })

  test('import button is present', async ({ page }) => {
    await page.goto('/stories')
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible({ timeout: 15_000 })
  })
})

// ── Interactive story editor ──────────────────────────────────────────────────

test.describe('CRM / Interactive Story Editor', () => {
  test.use({ storageState: ADMIN_AUTH })

  test('editor page loads for a valid story ID', async ({ page }) => {
    // Navigate to node editor for the first interactive story (ID from seeder)
    await page.goto('/stories/1/nodes')
    await page.waitForTimeout(3_000)
    // Either the graph loads or we see a "not found" — no JS crash
    await expect(page).not.toHaveTitle(/error/i)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })
})

// ── Contributor role access ───────────────────────────────────────────────────

test.describe('CRM / Stories (contributor)', () => {
  test.use({ storageState: CONTRIB_AUTH })

  test('contributor can see stories list', async ({ page }) => {
    await page.goto('/stories')
    await expect(page).toHaveURL(/\/stories/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveTitle(/error/i)
  })
})
