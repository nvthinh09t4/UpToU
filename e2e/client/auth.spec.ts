import { test, expect } from '@playwright/test'
import { ACCOUNTS, loginClient } from '../helpers/auth'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '../.auth/client-user.json')

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
  test.use({ storageState: AUTH_FILE })

  test('user can log out via header menu', async ({ page }) => {
    await page.goto('/')
    // Open user menu
    const userBtn = page.getByRole('button', { name: /account|user|menu/i }).last()
    if (await userBtn.isVisible()) {
      await userBtn.click()
      const logoutItem = page.getByRole('menuitem', { name: /sign out|logout/i })
      if (await logoutItem.isVisible()) {
        await logoutItem.click()
        await expect(page).toHaveURL(/\/(login|$)/)
      }
    } else {
      // Fallback: sign-out link
      const signOutLink = page.getByRole('link', { name: /sign out|logout/i })
      await expect(signOutLink).toBeVisible()
    }
  })
})
