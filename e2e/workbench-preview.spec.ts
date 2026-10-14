import { test, expect } from '@playwright/test'

test.describe('UI-02 workbench: volume-only illustration', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })
  test('labels demonstration and leaves pH unmeasured', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    await expect(frame).toContainText('Minh họa thao tác')
    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('Chưa đo')
    await expect(frame.locator('.wp-volume-value')).toContainText('25,00 mL')
    await expect(frame.locator('.wp-chart-svg')).toHaveCount(0)
    await expect(frame.locator('.wp-reagent-fixed')).toContainText('NaOH 0,0100 M')
  })
  test('adds local volume without API requests, then resets', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const requests: string[] = []
    page.on('request', (req) => { if (req.url().includes('/api/')) requests.push(req.url()) })
    const add = frame.getByRole('button', { name: 'Xem thao tác thêm 1 mL' })
    await add.click()
    await expect(frame.locator('.wp-volume-value')).toContainText('26,00 mL')
    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('Chưa đo')
    await expect(frame.locator('.wp-feedback-toast')).toContainText('Đã minh họa thêm 1 mL')
    await expect(frame.locator('.wp-toast-link')).toHaveAttribute('href', '/simulate/acid-neutralization')
    await add.click()
    await expect(frame.locator('.wp-volume-value')).toContainText('27,00 mL')
    await frame.getByRole('button', { name: 'Đặt lại minh họa' }).click()
    await expect(frame.locator('.wp-volume-value')).toContainText('25,00 mL')
    await expect(frame.locator('.wp-feedback-toast')).toHaveCount(0)
    expect(requests).toHaveLength(0)
  })
  test('works with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Xem thao tác thêm 1 mL' }).click()
    await expect(page.locator('.wp-volume-value')).toContainText('26,00 mL')
  })
})
