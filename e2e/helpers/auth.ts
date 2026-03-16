import type { Page } from '@playwright/test'

// ── Seed account credentials ──────────────────────────────────────────────────

export const ACCOUNTS = {
  admin:       { email: 'admintest@uptou.local',    password: '123456aA@', role: 'Admin' },
  senior:      { email: 'seniorsuper@uptou.local',  password: '123456aA@', role: 'Senior Supervisor' },
  supervisor:  { email: 'supervisor1@uptou.local',  password: '123456aA@', role: 'Supervisor' },
  contributor: { email: 'contributor1@uptou.local', password: '123456aA@', role: 'Contributor' },
} as const

// ── Client login ──────────────────────────────────────────────────────────────

export async function loginClient(page: Page, email: string, password: string) {
  await page.goto('/login')
  // Wait for React to mount — Vite cold-start can be slow on first run
  await page.waitForSelector('#email', { timeout: 90_000 })
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // Wait for redirect away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 })
}

// ── CRM login ─────────────────────────────────────────────────────────────────

export async function loginCrm(page: Page, email: string, password: string) {
  await page.goto('/login')
  // Wait for React + MUI to mount
  await page.waitForSelector('input[type="email"]', { timeout: 90_000 })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // Wait for redirect to dashboard
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 })
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
