import type { Page } from '@playwright/test'

// ── Seed account credentials ──────────────────────────────────────────────────

export const ACCOUNTS = {
  admin:       { email: 'admin@uptou.com',        password: '123456aA@', role: 'Admin' },
  senior:      { email: 'senior@uptou.com',        password: '123456aA@', role: 'Senior Supervisor' },
  supervisor:  { email: 'supervisor@uptou.com',    password: '123456aA@', role: 'Supervisor' },
  contributor: { email: 'contributor@uptou.com',   password: '123456aA@', role: 'Contributor' },
} as const

// ── Client login ──────────────────────────────────────────────────────────────

export async function loginClient(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // Wait for redirect away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 })
}

// ── CRM login ─────────────────────────────────────────────────────────────────

export async function loginCrm(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // Wait for redirect to dashboard
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 })
}

// ── CRM logout ────────────────────────────────────────────────────────────────

export async function logoutCrm(page: Page) {
  // Click the user avatar / account button in the app bar
  const accountBtn = page.getByRole('button', { name: /account|logout|sign out/i }).last()
  await accountBtn.click()
  const logoutItem = page.getByRole('menuitem', { name: /logout|sign out/i })
  if (await logoutItem.isVisible())
    await logoutItem.click()
}
