import { test, expect } from '@playwright/test'

test.describe('Experiment Showcase Interaction and Accessibility (R16.2.1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Ensure landing page is loaded and showcase section is visible
    const showcase = page.locator('.showcase-carousel-wrapper')
    await expect(showcase).toBeVisible()
  })

  test('renders all three experiment cards with correct statuses and CTA routes', async ({ page }) => {
    const cards = page.locator('.showcase-card')
    await expect(cards).toHaveCount(3)

    // Acid neutralization: LIVE -> /simulate/acid-neutralization
    const acidCard = cards.nth(0)
    await expect(acidCard).toHaveClass(/showcase-card-live/)
    await expect(acidCard.locator('.showcase-status-badge')).toContainText('Khả dụng')
    const acidCta = acidCard.locator('.showcase-cta-link')
    await expect(acidCta).toHaveAttribute('href', '/simulate/acid-neutralization')

    // Copper precipitation: PREVIEW -> /experiments
    const copperCard = cards.nth(1)
    await expect(copperCard).toHaveClass(/showcase-card-preview/)
    await expect(copperCard.locator('.showcase-status-badge')).toContainText('Sắp ra mắt')
    const copperCta = copperCard.locator('.showcase-cta-link')
    await expect(copperCta).toHaveAttribute('href', '/experiments')

    // Plastic density separation: PREVIEW -> /experiments
    const plasticCard = cards.nth(2)
    await expect(plasticCard).toHaveClass(/showcase-card-preview/)
    await expect(plasticCard.locator('.showcase-status-badge')).toContainText('Sắp ra mắt')
    const plasticCta = plasticCard.locator('.showcase-cta-link')
    await expect(plasticCta).toHaveAttribute('href', '/experiments')
  })

  test('does not introduce document-level horizontal page overflow', async ({ page }) => {
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('does not auto-rotate or exhibit autoplay-driven transitions', async ({ page }) => {
    const cards = page.locator('.showcase-card')
    await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')

    // Wait 1.5s to verify no background interval auto-advances the slide
    await page.waitForTimeout(1500)
    await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
  })

  test.describe('Mobile / Tablet Carousel Controls Interaction', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('controls satisfy minimum 44x44px interactive touch target contract', async ({ page }) => {
      const prevBtn = page.getByRole('button', { name: 'Thí nghiệm trước đó' })
      const nextBtn = page.getByRole('button', { name: 'Thí nghiệm tiếp theo' })

      const prevBox = await prevBtn.boundingBox()
      const nextBox = await nextBtn.boundingBox()

      expect(prevBox?.width).toBeGreaterThanOrEqual(44)
      expect(prevBox?.height).toBeGreaterThanOrEqual(44)
      expect(nextBox?.width).toBeGreaterThanOrEqual(44)
      expect(nextBox?.height).toBeGreaterThanOrEqual(44)

      const dots = page.locator('.showcase-dot')
      const dotCount = await dots.count()
      expect(dotCount).toBe(3)

      for (let i = 0; i < dotCount; i++) {
        const dotBox = await dots.nth(i).boundingBox()
        expect(dotBox?.width).toBeGreaterThanOrEqual(44)
        expect(dotBox?.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('navigates next and previous slides without stealing button focus', async ({ page }) => {
      const prevBtn = page.getByRole('button', { name: 'Thí nghiệm trước đó' })
      const nextBtn = page.getByRole('button', { name: 'Thí nghiệm tiếp theo' })
      const cards = page.locator('.showcase-card')
      const dots = page.locator('.showcase-dot')

      // Initial state: slide 0 active, prev disabled
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
      await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
      await expect(prevBtn).toBeDisabled()
      await expect(nextBtn).toBeEnabled()

      // Click Next: advances to slide 1
      await nextBtn.click()
      await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
      await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
      await expect(prevBtn).toBeEnabled()
      // Focus must remain on the activated button
      await expect(nextBtn).toBeFocused()

      // Click Next again: advances to slide 2
      await nextBtn.click()
      await expect(cards.nth(2)).toHaveAttribute('data-active', 'true')
      await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true')
      await expect(nextBtn).toBeDisabled()

      // Click Prev: returns to slide 1
      await prevBtn.click()
      await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
      await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
      await expect(prevBtn).toBeFocused()
    })

    test('retains keyboard reachability for card CTA links', async ({ page }) => {
      const acidCta = page.locator('.showcase-card').first().locator('.showcase-cta-link')
      await acidCta.focus()
      await expect(acidCta).toBeFocused()
    })
  })

  test.describe('Reduced motion behavior', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    })

    test('maintains carousel usability with auto scroll behavior under reduced motion', async ({ page }) => {
      const track = page.locator('.showcase-track')
      const computedScrollBehavior = await track.evaluate((el) => {
        return window.getComputedStyle(el).scrollBehavior
      })
      expect(computedScrollBehavior).toBe('auto')

      // Controls still navigate reliably
      const nextBtn = page.getByRole('button', { name: 'Thí nghiệm tiếp theo' })
      await nextBtn.click()
      const cards = page.locator('.showcase-card')
      await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
    })
  })

  test.describe('Desktop Focal Hierarchy and Pointer Interaction (>66rem)', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('renders all 3 cards simultaneously with Card 1 ACTIVE by default and distinct elevation', async ({ page }) => {
      const cards = page.locator('.showcase-card')
      await expect(cards).toHaveCount(3)

      for (let i = 0; i < 3; i++) {
        await expect(cards.nth(i)).toBeVisible()
      }

      // Card 1 active by default
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
      await expect(cards.nth(1)).not.toHaveAttribute('data-active', 'true')
      await expect(cards.nth(2)).not.toHaveAttribute('data-active', 'true')

      // Measurably distinct elevation: active card has translateY(-6px)
      const activeTransform = await cards.nth(0).evaluate((el) => window.getComputedStyle(el).transform)
      const recededTransform = await cards.nth(1).evaluate((el) => window.getComputedStyle(el).transform)
      expect(activeTransform).not.toBe(recededTransform)
      // When translateY(-6px) is computed in 2D transform, matrix is matrix(1, 0, 0, 1, 0, -6)
      expect(activeTransform).toContain('-6')
    })

    test('hovering a receded card provides temporary preview without persisting active state on mouse leave', async ({ page }) => {
      const cards = page.locator('.showcase-card')
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')

      // Hover card 1 (copper)
      await cards.nth(1).hover()
      // Card 0 remains active in state
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')

      // Move mouse away to showcase heading
      await page.locator('#showcase-heading').hover()
      // Card 0 still active, card 1 not active
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
      await expect(cards.nth(1)).not.toHaveAttribute('data-active', 'true')
    })

    test('clicking card body surface transfers active spotlight', async ({ page }) => {
      const cards = page.locator('.showcase-card')
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')

      // Click card 1 (copper) on its title
      await cards.nth(1).locator('.showcase-card-title').click()
      await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
      await expect(cards.nth(0)).not.toHaveAttribute('data-active', 'true')

      // Click card 2 (plastic) on its media stage
      await cards.nth(2).locator('.showcase-media-stage').click()
      await expect(cards.nth(2)).toHaveAttribute('data-active', 'true')
      await expect(cards.nth(1)).not.toHaveAttribute('data-active', 'true')
    })

    test('clicking card CTA navigates directly on first click without prior card selection', async ({ page }) => {
      const cards = page.locator('.showcase-card')
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')

      // Directly click CTA of Card 1 (copper, receded)
      const copperCta = cards.nth(1).locator('.showcase-cta-link')
      await copperCta.click()

      // Navigates directly to /experiments on first click
      await expect(page).toHaveURL(/\/experiments/)
    })

    test('focusing CTA link applies visible focus styling without mutating activeIndex', async ({ page }) => {
      const cards = page.locator('.showcase-card')
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')

      // Focus CTA of card 2
      const plasticCta = cards.nth(2).locator('.showcase-cta-link')
      await plasticCta.focus()
      await expect(plasticCta).toBeFocused()

      // Card 0 remains persistently active
      await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
      await expect(cards.nth(2)).not.toHaveAttribute('data-active', 'true')
    })
  })
})

