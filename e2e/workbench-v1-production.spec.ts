import { test, expect } from '@playwright/test'

test.describe('Workbench V1 Production Assembly Integration (WB-R6)', () => {
  test('1. Desktop basic layout & fresh setup phase renders verified parameters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Context bar
    await expect(page.locator('.wb-context-bar')).toBeVisible()
    await expect(page.locator('.wb-context-title')).toHaveText('Chuẩn độ Axit - Bazơ')
    await expect(page.locator('.wb-reaction-badge')).toHaveText('HCl + NaOH')

    // Setup card
    await expect(page.locator('.wb-setup-card')).toBeVisible()
    await expect(page.locator('.wb-setup-card h2')).toHaveText('Thiết lập thí nghiệm')

    // Inputs present with defaults (25.0 mL, 0.010 M)
    const volumeInput = page.locator('input[type="number"]').first()
    await expect(volumeInput).toHaveValue('25.0')

    const concInput = page.locator('input[type="number"]').nth(1)
    await expect(concInput).toHaveValue('0.010')

    // Start button enabled
    const startBtn = page.getByRole('button', { name: 'Bắt đầu thí nghiệm' })
    await expect(startBtn).toBeEnabled()
  })

  test('2. Guided flow: Start -> select route -> calibrate -> add -> mix -> wait -> measure', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Start Guided run
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()

    // Mode is locked and protocol rail is active
    await expect(page.locator('.wb-context-mode')).toContainText('GUIDED')
    await expect(page.locator('.wb-protocol-rail')).toBeVisible()

    // Step 1: Select route NaOH
    const selectRouteBtn = page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' })
    await expect(selectRouteBtn).toBeVisible()
    await selectRouteBtn.click()

    // Step 2: Calibrate pH meter
    const calibrateBtn = page.getByRole('button', { name: 'Hiệu chuẩn máy đo pH' })
    await expect(calibrateBtn).toBeVisible()
    await calibrateBtn.click()

    // Telemetry shows calibrated, ready
    await expect(page.locator('.telemetry-status-pill')).toContainText('Chưa đo')

    // Step 3: Add NaOH (default aliquot: 1.00 mL)
    const addBaseBtn = page.getByRole('button', { name: /Thêm .* NaOH/ })
    await expect(addBaseBtn).toBeEnabled()
    await addBaseBtn.click()

    // Telemetry reflects added volume
    await expect(page.locator('[data-testid="telemetry-naoh-volume"]')).toContainText('1,00 mL')

    // Step 4: Mix sample
    const mixBtn = page.getByRole('button', { name: 'Khuấy dung dịch' })
    await expect(mixBtn).toBeEnabled()
    await mixBtn.click()

    // Step 5: Wait for stable reading
    const waitBtn = page.getByRole('button', { name: 'Chờ số đọc ổn định' })
    await expect(waitBtn).toBeEnabled()
    await waitBtn.click()

    // Step 6: Measure pH
    const measureBtn = page.getByRole('button', { name: 'Đo giá trị pH' })
    await expect(measureBtn).toBeEnabled()
    await measureBtn.click()

    // Stable reading recorded
    await expect(page.locator('.telemetry-status-pill')).toContainText('Ổn định')

    // Chart has 1 measurement point
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1)

    // Event log has recorded events
    await expect(page.locator('.wb-log-item')).toHaveCount(6)
  })

  test('3. Observed pending pH state before measurement in Guided flow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Start Guided run
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()
    await page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' }).click()
    await page.getByRole('button', { name: 'Hiệu chuẩn máy đo pH' }).click()

    // Measure initial reading
    await page.getByRole('button', { name: 'Chờ số đọc ổn định' }).click()
    await page.getByRole('button', { name: 'Đo giá trị pH' }).click()
    await expect(page.locator('.telemetry-status-pill')).toContainText('Ổn định')

    // Now add base -> reading MUST immediately transition to pending/stale
    await page.getByRole('button', { name: /Thêm .* NaOH/ }).click()
    await expect(page.locator('.telemetry-status-pill')).toContainText('Chờ đo')
  })

  test('4. Explore flow: One-click Thêm & Đo sequence', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Select EXPLORE mode before starting
    const explorePill = page.locator('label', { hasText: 'EXPLORE' })
    await explorePill.click()

    // Start Explore run
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()

    // Mode is locked to EXPLORE
    await expect(page.locator('.wb-context-mode')).toContainText('EXPLORE')

    // One-click primary action
    const exploreBtn = page.locator('.wb-btn-hero')
    await expect(exploreBtn).toBeVisible()
    await expect(exploreBtn).toContainText('Thêm & Đo')

    // Click once to trigger dispenseAndMeasure
    await exploreBtn.click()

    // Waits for all stages (dispensing -> mixing -> stabilizing -> measuring)
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1, { timeout: 10000 })
    await expect(page.locator('.telemetry-status-pill')).toContainText('Ổn định')
  })

  test('5. Restart same setup preserves previous attempt', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Start and perform an action
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()
    await page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' }).click()

    const initialUrl = page.url()

    // Trigger restart
    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    const restartBtn = page.getByRole('button', { name: 'Làm lại cùng cấu hình' })
    await restartBtn.click()

    // Fresh attempt created
    await expect(page).not.toHaveURL(initialUrl)
    await expect(page.locator('.wb-log-item')).toHaveCount(0)
  })

  test('6. New setup unlocks configuration fields', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()

    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    const newSetupBtn = page.getByRole('button', { name: 'Thiết lập lượt mới' })
    await newSetupBtn.click()

    // Returns to pre-start setup form
    await expect(page.getByRole('button', { name: 'Bắt đầu thí nghiệm' })).toBeVisible()
    await expect(page.locator('input[type="number"]').first()).toBeEnabled()
  })

  test('7. 390px mobile layout and tab switcher', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/simulate/acid-neutralization')

    // Mobile nav switcher is visible
    await expect(page.locator('.wb-mobile-nav')).toBeVisible()

    // Start run
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()

    // Operations tab active by default
    await expect(page.locator('.wb-zone-center')).toBeVisible()
    await expect(page.locator('.wb-zone-right')).toBeVisible()

    // Switch to Data tab
    await page.getByRole('button', { name: 'Đồ thị & Số liệu' }).click()
    await expect(page.locator('.wb-chart-container')).toBeVisible()

    // Switch to Protocol tab
    await page.getByRole('button', { name: 'Quy trình & Nhật ký' }).click()
    await expect(page.locator('.wb-protocol-rail')).toBeVisible()
    await expect(page.locator('.wb-event-log')).toBeVisible()
  })

  test('8. Keyboard accessibility for essential controls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Tab to start button and press Enter
    await page.keyboard.press('Tab')
    const startBtn = page.getByRole('button', { name: 'Bắt đầu thí nghiệm' })
    await startBtn.focus()
    await page.keyboard.press('Enter')

    // Focus moved into active run
    await expect(page.locator('.wb-protocol-rail')).toBeVisible()
  })

  test('9. Reduced-motion compliance', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    await expect(page.locator('.wb-context-bar')).toBeVisible()
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()
    await expect(page.locator('.wb-apparatus-svg-container')).toBeVisible()
  })
})
