import { test, expect } from '@playwright/test'

test.describe('Guest IA', () => {
  test('header lists lab but not compare or account', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('.app-nav')
    await expect(nav.getByRole('link', { name: 'Thí nghiệm' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Nguồn khoa học' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Phòng lab của tôi' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'So sánh' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Tài khoản' })).toHaveCount(0)
  })

  test('opens My Lab without redirecting to sign-in', async ({ page }) => {
    await page.goto('/lab')
    await expect(page).not.toHaveURL(/sign-in/)
    await expect(page.getByRole('heading', { name: 'Phòng lab của tôi' })).toBeVisible()
    await expect(page.getByText(/trình duyệt này/)).toBeVisible()
  })
})
