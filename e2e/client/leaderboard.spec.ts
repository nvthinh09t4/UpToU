import { test, expect } from '@playwright/test'

test.describe('Client / Leaderboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard')
  })

  test('leaderboard page loads without error', async ({ page }) => {
    await expect(page).not.toHaveTitle(/error/i)
    await expect(page).toHaveURL(/\/leaderboard/)
  })

  test('displays leaderboard heading', async ({ page }) => {
    // The h1 says "Top Readers"; the badge span contains "Leaderboard"
    await expect(
      page.getByRole('heading', { name: /top readers/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('time period filter tabs are visible', async ({ page }) => {
    await expect(page.getByText(/This Week/i)).toBeVisible()
    await expect(page.getByText(/This Month/i)).toBeVisible()
    await expect(page.getByText(/All Time/i)).toBeVisible()
  })

  test('switching time periods works', async ({ page }) => {
    await page.getByText(/This Month/i).click()
    // No error after switching tabs
    await expect(page).not.toHaveTitle(/error/i)

    await page.getByText(/All Time/i).click()
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('rank tiers section is visible', async ({ page }) => {
    await expect(page.getByText(/Bronze|Silver|Gold|Herald|Guardian/i).first()).toBeVisible()
  })
})
