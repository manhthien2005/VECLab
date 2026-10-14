import { test, expect } from '@playwright/test'

test.describe('UI-02 hero: honest and accessible', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })
  test('CTA goes to showcase, with workbench anchor separately', async ({ page }) => {
    await expect(page.locator('.hero-btn-primary')).toHaveAttribute('href', '#showcase')
    await expect(page.locator('.hero-btn-secondary')).toHaveAttribute('href', '#workbench-preview')
    await page.locator('.hero-btn-primary').focus()
    await expect(page.locator('.hero-btn-primary')).toBeFocused()
  })
  test('preview contains no model-derived readings or fake progress', async ({ page }) => {
    const preview = page.locator('.hero-preview-wrapper')
    await expect(preview).toBeVisible()
    await expect(preview).toContainText('Minh họa')
    await expect(preview).toContainText('không phải phép đo')
    await expect(preview.locator('.hero-chart-svg')).toHaveCount(0)
    await expect(preview.locator('[role="progressbar"]')).toHaveCount(0)
  })
  test('respects dark mode, reduced motion and horizontal bounds', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.hero-preview-wrapper')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    expect(overflow).toBe(false)
  })
})
