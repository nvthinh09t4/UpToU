import { test, expect } from '@playwright/test'
import { ACCOUNTS, loginClient } from '../helpers/auth'

// ── Login page ────────────────────────────────────────────────────────────────

test.describe('Client / Login', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('wrong@example.com')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Error alert should appear
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8_000 })
  })

  test('shows validation error for empty email', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Email validation error
    await expect(page.locator('p.text-destructive').first()).toBeVisible()
  })

  test('successful login redirects away from /login', async ({ page }) => {
    await loginClient(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('register link is visible on login page', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.getByRole('link', { name: /create one|register|sign up/i })
    await expect(registerLink).toBeVisible()
  })
})

// ── Register page ─────────────────────────────────────────────────────────────

test.describe('Client / Register', () => {
  test('register page renders all fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel('First Name')).toBeVisible()
    await expect(page.getByLabel('Last Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.locator('p.text-destructive').first()).toBeVisible()
  })

  test('sign in link navigates to login', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})

// ── Authenticated: logout ─────────────────────────────────────────────────────

test.describe('Client / Logout', () => {
  test.beforeEach(async ({ page }) => {
    await loginClient(page, ACCOUNTS.supervisor.email, ACCOUNTS.supervisor.password)
  })

  test('user can log out via header menu', async ({ page }) => {
    await page.goto('/')
    // Wait for bootstrap + auth to complete — the user menu button appears
    const userBtn = page.getByRole('button', { name: /open user menu/i })
    await expect(userBtn).toBeVisible({ timeout: 30_000 })
    await userBtn.click()
    // Logout button is a plain button, not a menuitem
    const logoutBtn = page.getByRole('button', { name: /log.?out|sign out/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10_000 })
  })
})
