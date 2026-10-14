import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test.describe('Guest IA', () => {
  test('header lists lab but not compare or account', async ({ page }) => {
    await page.goto('/')
    const menuToggle = page.getByRole('button', { name: 'Mở menu điều hướng' })
    if (await menuToggle.isVisible()) await menuToggle.click()

    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' })
    await expect(nav.getByRole('link', { name: 'Thí nghiệm' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Nguồn khoa học' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Trang chủ', exact: true })).toHaveAttribute('href', '/')
    await expect(nav.getByRole('link', { name: 'Lab dùng thử', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'So sánh' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Tài khoản' })).toHaveCount(0)
  })

  test('opens the guest lab without redirecting to sign-in', async ({ page }) => {
    await page.goto('/lab')
    await expect(page).not.toHaveURL(/sign-in/)
    await expect(page.getByRole('heading', { name: 'Lab dùng thử', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Lưu trên trình duyệt này', exact: true })).toBeVisible()
    await expect(page.locator('.learner-lab-storage')).toContainText('Chưa đăng nhập')
  })
})
