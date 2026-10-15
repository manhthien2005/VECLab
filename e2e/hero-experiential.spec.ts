import { test, expect } from '@playwright/test'

test.describe('Hero Experiential Staging and Pointer Depth (R17.2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('.hero')
    await expect(hero).toBeVisible()
  })

  test('Hero illustrates the current Jar lesson without fabricated readings', async ({ page }) => {
    const preview = page.locator('.hero-preview-wrapper')
    await expect(preview).toBeVisible()

    await expect(preview.locator('.telemetry-badge-ph')).toContainText('125 NTU')
    await expect(preview.locator('.device-mode-badge')).toContainText('Minh họa giao diện')
    await expect(preview.locator('.hero-jar-conditions')).toContainText('50–250 mg/L')
    await expect(preview.locator('.hero-status-state')).toContainText('Giảm độ đục ít nhất 80%')
    await expect(preview.getByRole('progressbar')).toHaveCount(0)
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
    await expect(primaryCta).toHaveAttribute('href', '/simulate/jar-test')

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
      await expect(stage).toHaveAttribute('data-hydrated', 'true')

      const initialBox = await stage.boundingBox()
      expect(initialBox).not.toBeNull()

      if (initialBox) {
        // Move pointer to lower-right area of stage
        await page.mouse.move(initialBox.x + initialBox.width * 0.75, initialBox.y + initialBox.height * 0.75)
        await expect(stage).toHaveAttribute('data-pointer-active', 'true')

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
        await expect(stage).toHaveAttribute('data-pointer-active', 'false')
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
      await expect(stage).toHaveAttribute('data-hydrated', 'true')

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
      await expect(stage).toHaveAttribute('data-hydrated', 'true')

      const box = await stage.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8)
        await page.waitForTimeout(100)

        const pointerX = await stage.evaluate((el) => getComputedStyle(el).getPropertyValue('--hero-pointer-x').trim())
        expect(Number(pointerX || '0')).toBe(0)
      }

      await expect(page.locator('.hero-jar-conditions')).toBeVisible()
    })
  })
})
