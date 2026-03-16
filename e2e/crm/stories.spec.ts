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
    await page.waitForTimeout(3_000)
    // MUI DataGrid renders a role=grid
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible({ timeout: 8_000 })
  })

  test('search field is present', async ({ page }) => {
    await page.goto('/stories')
    const searchInput = page.getByRole('textbox', { name: /search/i })
    await expect(searchInput).toBeVisible()
  })

  test('Add Story button is visible for admin', async ({ page }) => {
    await page.goto('/stories')
    await expect(
      page.getByRole('button', { name: /add story|new story|create/i })
    ).toBeVisible()
  })

  test('status tabs are present', async ({ page }) => {
    await page.goto('/stories')
    // Tabs: All / Pending / Published / Rejected
    await expect(page.getByText(/pending|published|all/i)).toBeVisible()
  })

  test('import and export buttons are present', async ({ page }) => {
    await page.goto('/stories')
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible()
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
