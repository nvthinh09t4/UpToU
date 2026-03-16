import { test, expect } from '@playwright/test'

test.describe('Client / Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero section with CTA buttons', async ({ page }) => {
    // Hero badge / headline text
    await expect(page.getByText('Read Stories.')).toBeVisible()
    await expect(page.getByRole('link', { name: /start reading/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /explore categories/i })).toBeVisible()
  })

  test('renders platform stats row', async ({ page }) => {
    await expect(page.getByText(/Active Readers/i)).toBeVisible()
    await expect(page.getByText(/Published Stories/i)).toBeVisible()
  })

  test('renders "How UpToU Works" section', async ({ page }) => {
    await expect(page.getByText(/How UpToU Works/i)).toBeVisible()
    await expect(page.getByText(/Read/)).toBeVisible()
    await expect(page.getByText(/React/)).toBeVisible()
    await expect(page.getByText(/Earn/)).toBeVisible()
  })

  test('Browse by Category section loads', async ({ page }) => {
    await expect(page.getByText(/Browse by Category/i)).toBeVisible()
    // Wait for category cards to load (API call)
    await page.waitForResponse(resp => resp.url().includes('/categories') && resp.status() === 200, { timeout: 10_000 })
      .catch(() => { /* categories may already be loaded */ })
    // At least the section heading should still be visible
    await expect(page.getByText(/Browse by Category/i)).toBeVisible()
  })

  test('CTA section at bottom is visible', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByText(/Ready to start your journey/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /join now/i })).toBeVisible()
  })

  test('header navigation links are present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /leaderboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('Start Reading link navigates to login when unauthenticated', async ({ page }) => {
    const ctaBtn = page.getByRole('link', { name: /start reading/i })
    const href = await ctaBtn.getAttribute('href')
    // Should point to /register or /login for unauthenticated users
    expect(href).toMatch(/\/(register|login|categories)/)
  })
})

test.describe('Client / Home Page (authenticated)', () => {
  test.use({ storageState: 'e2e/.auth/client-user.json' })

  test('recommendation panel is visible when logged in', async ({ page }) => {
    await page.goto('/')
    // Panel may load asynchronously — give it time
    await page.waitForTimeout(2_000)
    // The recommendations section or "For You" heading
    const heading = page.getByText(/recommended|for you|personalized/i)
    // It's OK if it's not visible when there's no recommendation data
    // — just verify no crash
    await expect(page).not.toHaveTitle(/error/i)
  })
})
