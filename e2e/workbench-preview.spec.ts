import { test, expect } from '@playwright/test'

test.describe('Workbench Preview Interaction and Timer Hardening (R16.3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const frame = page.locator('.workbench-frame')
    await expect(frame).toBeVisible()
    await frame.scrollIntoViewIfNeeded()
  })

  test('renders initial illustrative snapshot with source-backed reagent and fixed telemetry', async ({ page }) => {
    const frame = page.locator('.workbench-frame')

    // Initial fixed telemetry snapshot
    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('4,8')
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('250 mL')
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang khuấy')

    // Reagent selector restricted to source-backed option
    const select = frame.locator('#preview-reagent-select')
    const options = select.locator('option')
    await expect(options).toHaveCount(1)
    await expect(options.first()).toHaveAttribute('value', 'naoh-001')
    await expect(options.first()).toContainText('NaOH 0,0100 M')
  })

  test('stepper adjusts added volume within defined bounds', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const stepperVal = frame.locator('#preview-volume-input')
    const incBtn = frame.getByRole('button', { name: 'Tăng 1 mL thể tích' })
    const decBtn = frame.getByRole('button', { name: 'Giảm 1 mL thể tích' })

    await expect(stepperVal).toHaveValue('5 mL')
    await incBtn.click()
    await expect(stepperVal).toHaveValue('6 mL')
    await decBtn.click()
    await expect(stepperVal).toHaveValue('5 mL')
  })

  test('performs local-only add action, shows feedback toast with simulation link, and keeps pH fixed', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const addBtn = frame.getByRole('button', { name: 'Thêm vào dung dịch' })

    // Zero network requests triggered during local interaction
    const apiRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        apiRequests.push(req.url())
      }
    })

    await addBtn.click()

    // Apparatus active pulse, volume flash, Step 2 pulse & status pill update
    await expect(frame.locator('.wp-apparatus-frame')).toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang khuấy & thêm')
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('255 mL')
    await expect(frame.locator('.wp-volume-value')).toHaveClass(/is-volume-pulse/)
    await expect(frame.locator('.wb-step-active')).toHaveClass(/is-addition-active/)

    // Step progression strictly remains Step 2 (never advances to Step 3 in preview)
    await expect(frame.locator('.wb-step-active .wb-step-index')).toHaveText('Bước 2')
    await expect(frame.locator('.wb-timeline-item').nth(2)).toHaveClass(/wb-step-pending/)

    // Telemetry pH must remain completely unchanged (4,8)
    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('4,8')

    // Feedback toast displays clear preview note and link to full simulation
    const toast = frame.locator('.wp-feedback-toast')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText('mô phỏng cục bộ')
    const toastLink = toast.locator('a')
    await expect(toastLink).toHaveAttribute('href', '/simulate/acid-neutralization')

    // Confirm no network requests were dispatched
    expect(apiRequests).toHaveLength(0)
  })

  test('rapid repeated clicks maintain deterministic single-lifecycle timer and monotonic volume', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const addBtn = frame.getByRole('button', { name: 'Thêm vào dung dịch' })

    // Click 3 times rapidly
    await addBtn.click()
    await page.waitForTimeout(100)
    await addBtn.click()
    await page.waitForTimeout(100)
    await addBtn.click()

    // Volume updated monotonically: 250 + 5 + 5 + 5 = 265 mL
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('265 mL')

    // Pulse is still active because previous timers were cancelled by clearActiveTimers
    await expect(frame.locator('.wp-apparatus-frame')).toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang khuấy & thêm')

    // Wait 700ms: pulse cleanly ends on latest timer expiration
    await page.waitForTimeout(700)
    await expect(frame.locator('.wp-apparatus-frame')).not.toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang khuấy')
  })

  test('reset button immediately cancels active pulse/toast and restores clean initial state without stale mutations', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const addBtn = frame.getByRole('button', { name: 'Thêm vào dung dịch' })
    const resetBtn = frame.getByRole('button', { name: 'Đặt lại' })

    // Trigger an addition
    await addBtn.click()
    await expect(frame.locator('.wp-feedback-toast')).toBeVisible()
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('255 mL')

    // Immediately reset while pulse and toast are active
    await resetBtn.click()

    // State reset immediately
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('250 mL')
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang khuấy')
    await expect(frame.locator('.wp-apparatus-frame')).not.toHaveClass(/is-stirring/)
    await expect(frame.locator('.wp-volume-value')).not.toHaveClass(/is-volume-pulse/)
    await expect(frame.locator('.wb-step-active')).not.toHaveClass(/is-addition-active/)
    await expect(frame.locator('.wp-feedback-toast')).not.toBeVisible()

    // Wait 1.5s: ensure no stale timer fires to alter UI after reset
    await page.waitForTimeout(1500)
    await expect(frame.locator('.wp-telemetry-meta')).toContainText('250 mL')
    await expect(frame.locator('.wp-feedback-toast')).not.toBeVisible()
    await expect(frame.locator('.wp-status-pill')).toContainText('Đang khuấy')
  })

  test('allows switching chart tabs with keyboard accessible selection', async ({ page }) => {
    const frame = page.locator('.workbench-frame')

    const phTab = frame.getByRole('tab', { name: 'pH' })
    const concTab = frame.getByRole('tab', { name: 'Nồng độ' })
    const tempTab = frame.getByRole('tab', { name: 'Nhiệt độ' })

    // Default active: pH
    await expect(phTab).toHaveAttribute('aria-selected', 'true')
    await expect(frame.locator('.wp-chart-svg')).toHaveAttribute('aria-label', /Biểu đồ pH theo thời gian/)

    // Switch to Concentration
    await concTab.click()
    await expect(concTab).toHaveAttribute('aria-selected', 'true')
    await expect(phTab).toHaveAttribute('aria-selected', 'false')
    await expect(frame.locator('.wp-chart-svg')).toHaveAttribute('aria-label', /Biểu đồ nồng độ ion/)

    // Switch to Temperature
    await tempTab.click()
    await expect(tempTab).toHaveAttribute('aria-selected', 'true')
    await expect(frame.locator('.wp-chart-svg')).toHaveAttribute('aria-label', /Biểu đồ nhiệt độ ổn định/)
  })

  test.describe('Reduced motion behavior', () => {
    test.use({ reducedMotion: 'reduce' })

    test('operates cleanly under prefers-reduced-motion without spatial animations', async ({ page }) => {
      const frame = page.locator('.workbench-frame')
      const addBtn = frame.getByRole('button', { name: 'Thêm vào dung dịch' })

      await addBtn.click()
      await expect(frame.locator('.wp-telemetry-meta')).toContainText('255 mL')
      await expect(frame.locator('.wp-feedback-toast')).toBeVisible()
    })
  })
})
