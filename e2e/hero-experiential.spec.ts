import { test, expect } from '@playwright/test'

test.describe('Hero Experiential Staging and Pointer Depth (R17.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('.hero')
    await expect(hero).toBeVisible()
  })

  test('Hero renders normally with static scientific literals and elements', async ({ page }) => {
    const preview = page.locator('.hero-preview-wrapper')
    await expect(preview).toBeVisible()

    // Fixed telemetry badge
    await expect(preview.locator('.telemetry-badge-ph')).toContainText('5,2')
    await expect(preview.locator('.telemetry-badge-temp-val')).toContainText('25,0 °C')

    // Chemical equation & progress
    await expect(preview.locator('.equation-text')).toContainText('HCl + NaOH → NaCl + H₂O')
    await expect(preview.locator('.device-progress-pct')).toContainText('60%')

    // Titration chart
    const chart = preview.locator('.hero-chart-svg')
    await expect(chart).toBeVisible()
    await expect(preview.locator('.hero-chart-callout-text')).toContainText('pH = 7,0')

    // Status card
    await expect(preview.locator('.hero-status-state')).toContainText('Dung dịch gần trung tính')
  })

  test('Initial Hero entrance does not cause document-level horizontal page overflow', async ({ page }) => {
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('Hero CTA remains immediately keyboard accessible and clickable', async ({ page }) => {
    const primaryCta = page.locator('.hero-btn-primary')
    await expect(primaryCta).toBeVisible()
    await expect(primaryCta).toHaveAttribute('href', '/simulate/acid-neutralization')

    // Verify keyboard focusability
    await primaryCta.focus()
    await expect(primaryCta).toBeFocused()
  })

  test('Hero renders correctly under dark theme', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark'
    })
    const preview = page.locator('.hero-preview-wrapper')
    await expect(preview).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test.describe('Desktop Fine-Pointer Depth Behavior', () => {
    test('fine-pointer movement updates stage CSS variables without changing layout dimensions', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Desktop fine-pointer only')

      const stage = page.locator('.hero-pointer-stage')
      await expect(stage).toBeVisible()

      const initialBox = await stage.boundingBox()
      expect(initialBox).not.toBeNull()

      if (initialBox) {
        // Move pointer to lower-right area of stage
        await page.mouse.move(initialBox.x + initialBox.width * 0.75, initialBox.y + initialBox.height * 0.75)
        await page.waitForTimeout(150)

        // Verify pointer CSS custom properties are updated
        const pointerX = await stage.evaluate((el) => getComputedStyle(el).getPropertyValue('--hero-pointer-x').trim())
        const pointerY = await stage.evaluate((el) => getComputedStyle(el).getPropertyValue('--hero-pointer-y').trim())
        expect(Number(pointerX)).toBeGreaterThan(0)
        expect(Number(pointerY)).toBeGreaterThan(0)

        // Verify layout dimensions did not change
        const movingBox = await stage.boundingBox()
        expect(movingBox?.width).toBe(initialBox.width)
        expect(movingBox?.height).toBe(initialBox.height)

        // Pointer leave returns stage variables toward neutral (0)
        await page.mouse.move(0, 0)
        await page.waitForTimeout(400)
        const neutralX = await stage.evaluate((el) => getComputedStyle(el).getPropertyValue('--hero-pointer-x').trim())
        const neutralY = await stage.evaluate((el) => getComputedStyle(el).getPropertyValue('--hero-pointer-y').trim())
        expect(Number(neutralX)).toBe(0)
        expect(Number(neutralY)).toBe(0)
      }
    })
  })

  test.describe('Mobile Viewport Behavior', () => {
    test('mobile viewport receives no pointer-depth CSS variable updates on touch', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile touch viewport only')

      const stage = page.locator('.hero-pointer-stage')
      await expect(stage).toBeVisible()

      const box = await stage.boundingBox()
      expect(box).not.toBeNull()

      if (box) {
        await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5)
        await page.waitForTimeout(100)

        const pointerX = await stage.evaluate((el) => getComputedStyle(el).getPropertyValue('--hero-pointer-x').trim())
        // On touch device without fine pointer, pointer-x remains unset or 0
        expect(Number(pointerX || '0')).toBe(0)
      }
    })
  })

  test.describe('Reduced Motion Preference', () => {
    test.use({ reducedMotion: 'reduce' })

    test('prefers-reduced-motion disables pointer depth and spatial movement', async ({ page }) => {
      const stage = page.locator('.hero-pointer-stage')
      await expect(stage).toBeVisible()

      const box = await stage.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8)
        await page.waitForTimeout(100)

        const pointerX = await stage.evaluate((el) => getComputedStyle(el).getPropertyValue('--hero-pointer-x').trim())
        expect(Number(pointerX || '0')).toBe(0)
      }

      // Chart curve stroke-dashoffset must be 0 immediately
      const chartLine = page.locator('.hero-chart-line')
      const dashOffset = await chartLine.evaluate((el) => getComputedStyle(el).strokeDashoffset)
      expect(dashOffset === '0px' || dashOffset === '0').toBe(true)
    })
  })
})
