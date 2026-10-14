import { test, expect } from '@playwright/test'

test.describe('UI-02 lesson showcase', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })
  test('shows three honest lessons; only pH has launch link', async ({ page }) => {
    const cards = page.locator('.showcase-card')
    await expect(cards).toHaveCount(3)
    await expect(cards.nth(0)).toContainText('Điều chỉnh pH')
    await expect(cards.nth(0)).toContainText('Bản hiện có')
    await expect(cards.nth(0).locator('.showcase-cta-link')).toHaveAttribute('href', '/simulate/acid-neutralization')
    await expect(cards.nth(1)).toContainText('Jar Test')
    await expect(cards.nth(1)).toContainText('Đang phát triển')
    await expect(cards.nth(2)).toContainText('Hấp phụ xanh methylene')
    await expect(cards.nth(2)).toContainText('Đang phát triển')
    await expect(cards.nth(1).locator('a')).toHaveCount(0)
    await expect(cards.nth(2).locator('a')).toHaveCount(0)
  })
  test('supports carousel keyboard navigation and reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const next = page.getByRole('button', { name: 'Thí nghiệm tiếp theo' })
    await expect(next).toBeVisible()
    await next.click()
    await expect(page.locator('.showcase-card').nth(1)).toHaveAttribute('data-active', 'true')
    await expect(next).toBeFocused()
    const dots = page.locator('.showcase-dot')
    await expect(dots).toHaveCount(3)
    expect((await dots.first().boundingBox())?.width).toBeGreaterThanOrEqual(44)
  })
  test('does not overflow the document on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    expect(overflow).toBe(false)
  })
})

/** Measure actual text fragments against the clipped card instead of treating the
 * 1-2px glyph ink beyond a line box (scrollHeight) as text clipping. */
for (const width of [390, 768, 1279, 1440]) {
  test('UI02-F3: badge and complete methylene title at ' + width + 'px, including 200% text', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const card = page.locator('.showcase-card').nth(2)
    const badge = card.locator('.showcase-status-badge')
    const title = card.locator('.showcase-card-title')

    const inspect = async (phase: string) => {
      await card.scrollIntoViewIfNeeded()
      await expect(title).toHaveText('Hấp phụ xanh methylene')
      const geometry = await card.evaluate((node) => {
        const badgeNode = node.querySelector<HTMLElement>('.showcase-status-badge')
        const titleNode = node.querySelector<HTMLElement>('.showcase-card-title')
        if (!badgeNode || !titleNode) throw new Error('Badge/title missing')

        const cardRect = node.getBoundingClientRect()
        const badgeRect = badgeNode.getBoundingClientRect()
        const titleRect = titleNode.getBoundingClientRect()
        const cardStyle = getComputedStyle(node)
        const range = document.createRange()
        range.selectNodeContents(titleNode)
        const textFragments = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0)
        // The card has overflow:hidden; its content box is safely inside the clip.
        const contentBounds = {
          left: cardRect.left + parseFloat(cardStyle.paddingLeft),
          right: cardRect.right - parseFloat(cardStyle.paddingRight),
          top: cardRect.top + parseFloat(cardStyle.paddingTop),
          bottom: cardRect.bottom - parseFloat(cardStyle.paddingBottom),
        }
        const precision = 1 / window.devicePixelRatio
        return {
          badgePosition: getComputedStyle(badgeNode).position,
          verticalGap: titleRect.top - badgeRect.bottom,
          badgeOverflow: badgeNode.scrollWidth - badgeNode.clientWidth,
          titleOverflow: titleNode.scrollWidth - titleNode.clientWidth,
          textFragmentCount: textFragments.length,
          // Require every rendered text fragment to fit within the card's
          // clipped ancestor rather than trusting element visibility alone.
          textClipped: textFragments.some((rect) =>
            rect.left < contentBounds.left - precision ||
            rect.right > contentBounds.right + precision ||
            rect.top < contentBounds.top - precision ||
            rect.bottom > contentBounds.bottom + precision),
        }
      })
      expect(geometry.badgePosition, phase + ': badge must be in normal flow').toBe('static')
      expect(geometry.verticalGap, phase + ': badge overlaps the title').toBeGreaterThanOrEqual(0)
      expect(geometry.badgeOverflow, phase + ': badge clips text').toBeLessThanOrEqual(1)
      expect(geometry.titleOverflow, phase + ': heading overflows horizontally').toBeLessThanOrEqual(1)
      expect(geometry.textFragmentCount, phase + ': no text fragments').toBeGreaterThan(0)
      expect(geometry.textClipped, phase + ': title intersects the clipped card edge').toBe(false)
    }

    await expect(badge).toContainText('Đang phát triển')
    await inspect('regular font at ' + width)
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await inspect('200% font at ' + width)
  })
}
