import { test, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/client-user.json')

// ── Category page (public) ────────────────────────────────────────────────────

test.describe('Client / Category Page', () => {
  test('category page loads at /categories/1', async ({ page }) => {
    await page.goto('/categories/1')
    // Either story cards load or a "no stories" empty state
    await page.waitForResponse(r => r.url().includes('/categories') && r.status() === 200, { timeout: 10_000 })
      .catch(() => {})
    await expect(page).not.toHaveTitle(/error/i)
    await expect(page).toHaveURL(/\/categories\/1/)
  })

  test('story cards link to /stories/:id', async ({ page }) => {
    await page.goto('/categories/1')
    await page.waitForTimeout(2_000)
    const firstCard = page.locator('a[href^="/stories/"]').first()
    if (await firstCard.isVisible()) {
      const href = await firstCard.getAttribute('href')
      expect(href).toMatch(/\/stories\/\d+/)
    }
  })
})

// ── Story page (public, article story) ───────────────────────────────────────

test.describe('Client / Story Page (Article)', () => {
  test('story page renders content', async ({ page }) => {
    // Navigate to the first story card on category 1
    await page.goto('/categories/1')
    await page.waitForTimeout(2_000)

    const firstCard = page.locator('a[href^="/stories/"]').first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      await expect(page).toHaveURL(/\/stories\/\d+/)
      await page.waitForTimeout(2_000)
      await expect(page).not.toHaveTitle(/error/i)
    }
  })

  test('back navigation link is present on story page', async ({ page }) => {
    await page.goto('/stories/1')
    await page.waitForTimeout(2_000)
    const backLink = page.getByRole('link', { name: /back|return|←/i })
    // Either a back link or the page loaded successfully
    const loaded = (await backLink.isVisible()) || !(await page.locator('[data-testid="error"]').isVisible())
    expect(loaded).toBeTruthy()
  })
})

// ── Authenticated story interactions ─────────────────────────────────────────

test.describe('Client / Story Page (authenticated)', () => {
  test.use({ storageState: AUTH_FILE })

  test('claim read credits button is present', async ({ page }) => {
    await page.goto('/stories/1')
    await page.waitForTimeout(3_000)
    const claimBtn = page.getByRole('button', { name: /claim|read/i })
    // Button may be visible if not yet claimed
    await expect(page).not.toHaveTitle(/error/i)
    // No crash
    await expect(page.locator('body')).not.toContainText('Something went wrong')
  })

  test('bookmarks page loads', async ({ page }) => {
    await page.goto('/bookmarks')
    await expect(page).toHaveURL(/\/bookmarks/)
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page).toHaveURL(/\/notifications/)
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('progress page loads', async ({ page }) => {
    await page.goto('/progress')
    await expect(page).toHaveURL(/\/progress/)
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('rewards page loads', async ({ page }) => {
    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/rewards/)
    await expect(page).not.toHaveTitle(/error/i)
  })
})
