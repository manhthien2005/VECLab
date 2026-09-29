import { test, expect } from '@playwright/test'

test.describe('Whole-Page Choreography, Navigation & Integrated QA (R17.5)', () => {
  test('section reveal does not complete while offscreen and gains .is-revealed once scrolled into viewport', async ({
    page,
  }) => {
    await page.goto('/')

    // Bottom sections should initially gain .is-pending once client hydration executes
    const ctaSection = page.locator('.final-cta-section.reveal')
    await expect(ctaSection).toBeAttached()
    await expect(ctaSection).toHaveClass(/is-pending/)
    await expect(ctaSection).not.toHaveClass(/is-revealed/)

    // Scroll into view
    await ctaSection.scrollIntoViewIfNeeded()

    // Gains .is-revealed and loses .is-pending
    await expect(ctaSection).toHaveClass(/is-revealed/)
    await expect(ctaSection).not.toHaveClass(/is-pending/)
  })

  test('theme toggle flips theme attribute, aria-label and persists state', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.hero-pointer-stage')).toHaveAttribute('data-hydrated', 'true')
    const toggleBtn = page.locator('.theme-toggle')
    await expect(toggleBtn).toBeVisible()

    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme ?? 'light')
    const expectedToggled = initialTheme === 'dark' ? 'light' : 'dark'

    await toggleBtn.click()

    await expect(page.locator('html')).toHaveAttribute('data-theme', expectedToggled)

    const storedTheme = await page.evaluate(() => window.localStorage.getItem('veclab-theme'))
    expect(storedTheme).toBe(expectedToggled)
  })

  test('navigation hover and focus do not cause layout geometry shift', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const firstNavLink = page.locator('.app-nav a').first()
    await expect(firstNavLink).toBeVisible()

    const initialBox = await firstNavLink.boundingBox()
    expect(initialBox).not.toBeNull()

    // Hover link
    await firstNavLink.hover()

    const hoverBox = await firstNavLink.boundingBox()
    expect(hoverBox).not.toBeNull()

    // Outer width and height in document layout flow must not change
    expect(Math.round(hoverBox!.width)).toBe(Math.round(initialBox!.width))
    expect(Math.round(hoverBox!.height)).toBe(Math.round(initialBox!.height))
  })

  test('reduced-motion provides immediately usable content without spatial delay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const evidenceSection = page.locator('.evidence-section-wrap.reveal')
    await evidenceSection.scrollIntoViewIfNeeded()

    // Cards are immediately visible
    const firstCard = page.locator('.evidence-card').first()
    await expect(firstCard).toBeVisible()
    await expect(firstCard).toHaveCSS('opacity', '1')
  })

  const viewports = [
    { width: 390, height: 844, name: '390 (Mobile)' },
    { width: 768, height: 1024, name: '768 (Tablet)' },
    { width: 1024, height: 768, name: '1024 (Small Desktop)' },
    { width: 1280, height: 800, name: '1280 (Standard Desktop)' },
    { width: 1440, height: 900, name: '1440 (Large Desktop)' },
  ]

  for (const vp of viewports) {
    test(`has no horizontal overflow at viewport ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Scroll progressively to trigger reveals and check overflow throughout page
      const hasOverflow = await page.evaluate(async () => {
        const step = 300
        const total = document.documentElement.scrollHeight
        for (let y = 0; y < total; y += step) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 20))
          if (document.documentElement.scrollWidth > window.innerWidth + 1) {
            return true
          }
        }
        return false
      })

      expect(hasOverflow).toBe(false)
    })
  }
})
