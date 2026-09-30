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
    await expect(selectRouteBtn).not.toBeVisible()

    // Step 2: Calibrate pH meter
    const calibrateBtn = page.getByRole('button', { name: 'Hiệu chuẩn máy đo pH' })
    await expect(calibrateBtn).toBeVisible()
    await calibrateBtn.click()
    await expect(calibrateBtn).not.toBeVisible()

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
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    // Step 5: Wait for stable reading
    const waitBtn = page.getByRole('button', { name: 'Chờ số đọc ổn định' })
    await expect(waitBtn).toBeEnabled()
    await waitBtn.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    // Step 6: Measure pH
    const measureBtn = page.getByRole('button', { name: 'Đo giá trị pH' })
    await expect(measureBtn).toBeEnabled()
    await measureBtn.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

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
    const selectRouteBtn = page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' })
    await selectRouteBtn.click()
    await expect(selectRouteBtn).not.toBeVisible()
    const calibrateBtn = page.getByRole('button', { name: 'Hiệu chuẩn máy đo pH' })
    await calibrateBtn.click()
    await expect(calibrateBtn).not.toBeVisible()

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
    await expect(page).toHaveURL(/attempt=/)
    const initialUrl = page.url()

    const selectRouteBtn = page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' })
    await selectRouteBtn.click()
    await expect(selectRouteBtn).not.toBeVisible()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    // Trigger restart
    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    const restartBtn = page.getByRole('button', { name: 'Làm lại cùng cấu hình' })
    await restartBtn.click()

    // Fresh attempt created
    await expect(page).not.toHaveURL(initialUrl)
    await expect(page).toHaveURL(/attempt=/)
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

  test('10. Theme switching preserves attemptId, chemistry state, telemetry, and chart points (WB-R7)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Start Guided run and establish 1 real measurement
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()
    const selectRouteBtn = page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' })
    await selectRouteBtn.click()
    await expect(selectRouteBtn).not.toBeVisible()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const calibrateBtn = page.getByRole('button', { name: 'Hiệu chuẩn máy đo pH' })
    await expect(calibrateBtn).toBeEnabled()
    await calibrateBtn.click()
    await expect(calibrateBtn).not.toBeVisible()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const addBaseBtn = page.getByRole('button', { name: /Thêm .* NaOH/ })
    await addBaseBtn.click()
    await expect(page.locator('[data-testid="telemetry-naoh-volume"]')).toContainText('1,00 mL')

    const mixBtn = page.getByRole('button', { name: 'Khuấy dung dịch' })
    await expect(mixBtn).toBeEnabled()
    await mixBtn.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const waitBtn = page.getByRole('button', { name: 'Chờ số đọc ổn định' })
    await expect(waitBtn).toBeEnabled()
    await waitBtn.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const measureBtn = page.getByRole('button', { name: 'Đo giá trị pH' })
    await expect(measureBtn).toBeEnabled()
    await measureBtn.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()
    await expect(page.locator('.telemetry-status-pill')).toContainText('Ổn định')
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1)

    // Capture baseline values
    await expect(page).toHaveURL(/attempt=/)
    const originalUrl = page.url()
    const originalAttemptId = new URL(originalUrl).searchParams.get('attempt')
    expect(originalAttemptId).toBeTruthy()

    const volumeCell = page.locator('[data-testid="telemetry-naoh-volume"]')
    const phCell = page.locator('[data-testid="telemetry-ph-value"]')
    await expect(volumeCell).toContainText('1,00 mL')
    const originalPhText = await phCell.innerText()

    // Toggle Light -> Dark
    const themeBtn = page.locator('.theme-toggle')
    await themeBtn.click()

    // Assert all state remains identical in Dark theme
    expect(new URL(page.url()).searchParams.get('attempt')).toBe(originalAttemptId)
    await expect(page.locator('.wb-context-mode')).toContainText('GUIDED')
    await expect(volumeCell).toContainText('1,00 mL')
    await expect(phCell).toHaveText(originalPhText)
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /Thêm .* NaOH/ })).toBeEnabled()

    // Toggle Dark -> Light
    await themeBtn.click()

    // Assert all state remains identical in Light theme
    expect(new URL(page.url()).searchParams.get('attempt')).toBe(originalAttemptId)
    await expect(page.locator('.wb-context-mode')).toContainText('GUIDED')
    await expect(volumeCell).toContainText('1,00 mL')
    await expect(phCell).toHaveText(originalPhText)
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /Thêm .* NaOH/ })).toBeEnabled()
  })

  test('11. Direct browser refresh resumes active attempt state and measurements (WB-R7)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Start Guided run and record 1 measurement
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()
    const selectRouteBtn = page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' })
    await selectRouteBtn.click()
    await expect(selectRouteBtn).not.toBeVisible()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const calibrateBtn = page.getByRole('button', { name: 'Hiệu chuẩn máy đo pH' })
    await expect(calibrateBtn).toBeEnabled()
    await calibrateBtn.click()
    await expect(calibrateBtn).not.toBeVisible()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const addBaseBtn = page.getByRole('button', { name: /Thêm .* NaOH/ })
    await addBaseBtn.click()
    await expect(page.locator('[data-testid="telemetry-naoh-volume"]')).toContainText('1,00 mL')

    const mixBtn11 = page.getByRole('button', { name: 'Khuấy dung dịch' })
    await expect(mixBtn11).toBeEnabled()
    await mixBtn11.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const waitBtn11 = page.getByRole('button', { name: 'Chờ số đọc ổn định' })
    await expect(waitBtn11).toBeEnabled()
    await waitBtn11.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()

    const measureBtn11 = page.getByRole('button', { name: 'Đo giá trị pH' })
    await expect(measureBtn11).toBeEnabled()
    await measureBtn11.click()
    await expect(page.locator('.wb-stage-indicator')).not.toBeVisible()
    await expect(page.locator('.telemetry-status-pill')).toContainText('Ổn định')
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1)

    await expect(page).toHaveURL(/attempt=/)
    const attemptId = new URL(page.url()).searchParams.get('attempt')
    expect(attemptId).toBeTruthy()

    // Perform direct browser refresh
    await page.reload()

    // Verify resumption of the exact attempt
    await expect(page).toHaveURL(new RegExp(`attempt=${attemptId}`))
    await expect(page.locator('.wb-context-mode')).toContainText('GUIDED')
    await expect(page.locator('[data-testid="telemetry-naoh-volume"]')).toContainText('1,00 mL')
    await expect(page.locator('.telemetry-status-pill')).toContainText('Ổn định')
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1)
  })

  test('12. Setup boundary verification rejects out-of-envelope parameters (WB-R7)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    const volInput = page.locator('input[type="number"]').first()
    const concInput = page.locator('input[type="number"]').nth(1)
    const startBtn = page.getByRole('button', { name: 'Bắt đầu thí nghiệm' })

    // Boundary: Volume immediately below 25.0 mL rejected
    await volInput.fill('24.9')
    await expect(startBtn).toBeDisabled()

    // Boundary: Volume at 25.0 mL accepted
    await volInput.fill('25.0')
    await expect(startBtn).toBeEnabled()

    // Boundary: Volume at 50.0 mL accepted
    await volInput.fill('50.0')
    await expect(startBtn).toBeEnabled()

    // Boundary: Volume immediately above 50.0 mL rejected
    await volInput.fill('50.1')
    await expect(startBtn).toBeDisabled()

    // Restore valid volume
    await volInput.fill('25.0')

    // Boundary: Concentration below 0.005 M rejected
    await concInput.fill('0.004')
    await expect(startBtn).toBeDisabled()

    // Boundary: Concentration at 0.005 M accepted
    await concInput.fill('0.005')
    await expect(startBtn).toBeEnabled()

    // Boundary: Concentration at 0.020 M accepted
    await concInput.fill('0.020')
    await expect(startBtn).toBeEnabled()

    // Boundary: Concentration above 0.020 M rejected
    await concInput.fill('0.021')
    await expect(startBtn).toBeDisabled()
  })

  test('13. Equivalence crossing does not complete run and volume cap is enforced (WB-R7)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Use EXPLORE mode for rapid automated dosing
    await page.locator('label', { hasText: 'EXPLORE' }).click()
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()

    // Select 5.00 mL aliquot
    await page.getByRole('radio', { name: '5,00 mL' }).click()
    const heroBtn = page.locator('.wb-btn-hero')

    // Dose 1: 5.0 mL
    await heroBtn.click()
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1, { timeout: 10000 })

    // Dose 2: 10.0 mL
    await heroBtn.click()
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(2, { timeout: 10000 })

    // Dose 3: 15.0 mL
    await heroBtn.click()
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(3, { timeout: 10000 })

    // Dose 4: 20.0 mL
    await heroBtn.click()
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(4, { timeout: 10000 })

    // Dose 5: 25.0 mL (Equivalence point!)
    await heroBtn.click()
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(5, { timeout: 10000 })

    // Verify crossing equivalence MUST NOT auto-complete the attempt
    await expect(page.locator('.wb-context-mode')).toContainText('EXPLORE')
    await expect(page.locator('.wb-completion-card')).not.toBeVisible()

    // Dose 6: 30.0 mL (Authorized benchmark cap = 30.0 mL)
    await heroBtn.click()
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(6, { timeout: 10000 })
    await expect(page.locator('[data-testid="telemetry-naoh-volume"]')).toContainText('30,00 mL')

    // At 30.0 mL cap, button is disabled with limit message
    await expect(heroBtn).toBeDisabled()
    await expect(page.locator('.wb-explore-actions [role="alert"]')).toContainText('Thể tích vượt giới hạn')
  })

  test('14. Undo reverts route selection when available (WB-R7)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()
    const selectRouteBtn = page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' })
    await selectRouteBtn.click()
    await expect(selectRouteBtn).not.toBeVisible()

    // Undo is available before base is added
    const undoBtn = page.getByRole('button', { name: 'Hoàn tác' })
    await expect(undoBtn).toBeEnabled()
    await undoBtn.click()

    // Route button reappears
    await expect(page.getByRole('button', { name: 'Chọn dung dịch chuẩn NaOH' })).toBeVisible()
  })

  test('15. Explicit completion displays summary card with report link (WB-R7)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/simulate/acid-neutralization')

    // Start Explore and perform 1 measurement
    await page.locator('label', { hasText: 'EXPLORE' }).click()
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm' }).click()

    const heroBtn = page.locator('.wb-btn-hero')
    await heroBtn.click()
    await expect(page.locator('.live-chart-point-dot')).toHaveCount(1, { timeout: 10000 })

    // Complete button is now enabled
    const completeBtn = page.getByRole('button', { name: 'Hoàn thành thí nghiệm' })
    await expect(completeBtn).toBeEnabled()
    await completeBtn.click()

    // Completion card is rendered
    await expect(page.locator('.wb-completion-card')).toBeVisible()
    const reportLink = page.locator('.wb-completion-actions a')
    await expect(reportLink).toHaveAttribute('href', /\/reports\//)

    // Primary action is now disabled
    await expect(heroBtn).toBeDisabled()
  })
})
