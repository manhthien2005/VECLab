import { test, expect } from '@playwright/test'

test.describe('UI-02 landing content and responsive smoke', () => {
  for (const width of [390, 768, 1440]) {
    test('landing remains readable at ' + width + 'px', async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Thực hành')
      await expect(page.getByRole('heading', { name: 'Ba bài thực hành' })).toBeAttached()
      await expect(page.getByRole('heading', { name: 'Mô hình, điều kiện và tài liệu' })).toBeAttached()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      expect(overflow).toBe(false)
    })
  }

  test('home avoids obsolete chemistry advertising and preserves evidence link', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main')
    await expect(main).not.toContainText('Kết tủa Cu²⁺')
    await expect(main).not.toContainText('Phân loại nhựa')
    await expect(main).not.toContainText('19 nguồn kiểm chứng')
    await expect(main).not.toContainText('Ksp')
    await expect(main.getByRole('link', { name: 'Xem cơ sở mô phỏng' })).toHaveAttribute('href', '/evidence')
  })

  test('closing CTA returns to live/preview lesson selector', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.final-cta-btn')).toHaveAttribute('href', '#showcase')
  })

  test('footer is model-neutral and still offers evidence link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.app-footer')).toContainText('Kết quả phụ thuộc mô hình')
    await expect(page.locator('.app-footer').getByRole('link', { name: 'Nguồn và giới hạn' }))
      .toHaveAttribute('href', '/evidence')
  })
})
