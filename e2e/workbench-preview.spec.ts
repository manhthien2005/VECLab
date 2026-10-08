import { test, expect } from '@playwright/test'

test.describe('Workbench Preview lab cycle (local illustration only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const frame = page.locator('.workbench-frame')
    await expect(frame).toBeVisible()
    await frame.scrollIntoViewIfNeeded()
  })

  test('renders the four-beat cycle with locked NaOH and benchmark sample volume', async ({ page }) => {
    const frame = page.locator('.workbench-frame')

    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('4,8')
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('25,00 mL')
    await expect(frame.locator('.wp-status-pill')).toContainText('Minh họa')
    await expect(frame.locator('.wb-progress-step-text')).toHaveText('Bước 2 / 4')

    const steps = frame.locator('.wb-timeline-item')
    await expect(steps).toHaveCount(4)
    await expect(steps.nth(0)).toContainText('Chuẩn bị mẫu')
    await expect(steps.nth(1)).toContainText('Thêm từng giọt')
    await expect(steps.nth(2)).toContainText('Đọc pH')
    await expect(steps.nth(3)).toContainText('Xem đường cong')

    await expect(frame.locator('.wp-reagent-fixed')).toContainText('NaOH 0,0100 M')
    await expect(frame.locator('#preview-reagent-select')).toHaveCount(0)
    await expect(frame.locator('#preview-volume-input')).toHaveCount(0)
  })

  test('performs local-only add, shows feedback, and keeps pH fixed', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const addBtn = frame.getByRole('button', { name: 'Thêm và đo 1,00 mL' })

    const apiRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        apiRequests.push(req.url())
      }
    })

    await addBtn.click()

    await expect(frame.locator('.wp-apparatus-frame')).toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang thêm và đo')
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('26,00 mL')
    await expect(frame.locator('.wp-volume-value')).toHaveClass(/is-volume-pulse/)
    await expect(frame.locator('.wb-step-active')).toHaveClass(/is-addition-active/)

    await expect(frame.locator('.wb-step-active .wb-step-index')).toHaveText('Bước 2')
    await expect(frame.locator('.wb-timeline-item').nth(2)).toHaveClass(/wb-step-pending/)

    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('4,8')

    const toast = frame.locator('.wp-feedback-toast')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('mô phỏng cục bộ')
    const toastLink = toast.locator('a')
    await expect(toastLink).toHaveAttribute('href', '/simulate/acid-neutralization')

    expect(apiRequests).toHaveLength(0)
  })

  test('rapid repeated clicks keep a single timer lifecycle and monotonic volume', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const addBtn = frame.getByRole('button', { name: 'Thêm và đo 1,00 mL' })

    await addBtn.click()
    await page.waitForTimeout(100)
    await addBtn.click()
    await page.waitForTimeout(100)
    await addBtn.click()

    await expect(frame.locator('.wp-telemetry-meta')).toContainText('28,00 mL')
    await expect(frame.locator('.wp-apparatus-frame')).toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang thêm và đo')

    await page.waitForTimeout(700)
    await expect(frame.locator('.wp-apparatus-frame')).not.toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-status-pill')).toContainText('Minh họa')
  })

  test('reset cancels pulse/toast and restores the benchmark sample volume', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const addBtn = frame.getByRole('button', { name: 'Thêm và đo 1,00 mL' })
    const resetBtn = frame.getByRole('button', { name: 'Đặt lại' })

    await addBtn.click()
    await expect(frame.locator('.wp-feedback-toast')).toBeVisible()
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('26,00 mL')

    await resetBtn.click()

    await expect(frame.locator('.wp-telemetry-meta')).toContainText('25,00 mL')
    await expect(frame.locator('.wp-status-pill')).toContainText('Minh họa')
    await expect(frame.locator('.wp-apparatus-frame')).not.toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-volume-value')).not.toHaveClass(/is-volume-pulse/)
    await expect(frame.locator('.wb-step-active')).not.toHaveClass(/is-addition-active/)
    await expect(frame.locator('.wp-feedback-toast')).not.toBeVisible()

    await page.waitForTimeout(1500)
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('25,00 mL')
    await expect(frame.locator('.wp-feedback-toast')).not.toBeVisible()
    await expect(frame.locator('.wp-status-pill')).toContainText('Minh họa')
  })

  test('shows the titration chart against V_NaOH, not a time-series tab set', async ({ page }) => {
    const frame = page.locator('.workbench-frame')

    await expect(frame.getByRole('tablist')).toHaveCount(0)
    await expect(frame.locator('.wp-chart-svg')).toHaveAttribute(
      'aria-label',
      /Biểu đồ pH theo thể tích NaOH/,
    )
  })

  test.describe('Reduced motion behavior', () => {
    test.use({ reducedMotion: 'reduce' })

    test('operates cleanly under prefers-reduced-motion', async ({ page }) => {
      const frame = page.locator('.workbench-frame')
      const addBtn = frame.getByRole('button', { name: 'Thêm và đo 1,00 mL' })

      await addBtn.click()
      await expect(frame.locator('.wp-telemetry-meta')).toContainText('26,00 mL')
      await expect(frame.locator('.wp-feedback-toast')).toBeVisible()
    })
  })
})
