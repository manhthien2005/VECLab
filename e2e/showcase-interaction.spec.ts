import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test.beforeEach(async ({ page }) => {
  await page.goto('/#showcase')
  // Wait for the landing's client effects before the first carousel interaction.
  await expect(page.locator('.final-cta-section')).toHaveClass(/is-(pending|revealed)/)
})

test('shows the agreed experiments with loaded illustrations and no status or CTA footers', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  await expect(cards.locator('h3')).toHaveText(['Jar Test', 'Chiết tách axit–bazơ', 'Hấp phụ xanh methylene'])
  await expect(page.locator('.showcase-status-badge, .showcase-card-footer')).toHaveCount(0)
  for (const dot of await page.locator('.showcase-dot').all()) {
    await dot.click()
    const index = await dot.getAttribute('aria-label')
    const card = cards.nth(Number(index?.slice(-1)) - 1)
    await expect.poll(() => card.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('centers cards using next, previous and keyboard without moving the page vertically', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  const next = page.getByRole('button', { name: 'Thí nghiệm tiếp theo', exact: true })
  await next.click()
  await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
  await expect(next).toBeFocused()
  await expect.poll(() => cards.nth(1).evaluate((card) => {
    const track = card.parentElement!.getBoundingClientRect()
    const rect = card.getBoundingClientRect()
    return Math.abs(rect.left + rect.width / 2 - track.left - track.width / 2)
  })).toBeLessThan(3)
  await next.click()
  await expect(cards.nth(2)).toHaveAttribute('data-active', 'true')
  await expect(next).toBeEnabled()
  await next.click()
  await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
  await page.getByRole('button', { name: 'Thí nghiệm trước đó', exact: true }).click()
  await expect(cards.nth(2)).toHaveAttribute('data-active', 'true')
  await page.getByRole('button', { name: 'Thí nghiệm trước đó', exact: true }).click()
  await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
  for (let step = 0; step < 6; step++) {
    await page.getByRole('button', { name: 'Thí nghiệm trước đó', exact: true }).click()
    await expect(cards.nth(((1 - step - 1) % 3 + 3) % 3)).toHaveAttribute('data-active', 'true')
  }
  await cards.nth(1).locator('a').focus()
  const top = await page.evaluate(() => scrollY)
  await page.keyboard.press('ArrowLeft')
  await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
  await expect(cards.nth(0).locator('a')).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(top)
})

test('whole cards keep adsorption planned and open the two current simulators', async ({ page }) => {
  await page.getByRole('button', { name: 'Chuyển đến thí nghiệm 3', exact: true }).click()
  await expect(page.locator('.showcase-card').nth(2)).toHaveAttribute('data-active', 'true')
  await page.locator('.showcase-card').nth(2).locator('summary').click()
  await expect(page.locator('.showcase-card').nth(2).locator('details')).toHaveAttribute('open', '')
  await expect(page.locator('.showcase-card').nth(2).getByText('Chưa triển khai bài thực hành.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Chuyển đến thí nghiệm 2', exact: true }).click()
  await expect(page.locator('.showcase-card').nth(1)).toHaveAttribute('data-active', 'true')
  await page.getByRole('link', { name: 'Mở thí nghiệm Chiết tách axit–bazơ', exact: true }).click()
  await expect(page).toHaveURL(/\/simulate\/acid-base-extraction/, { timeout: 15000 })
  await page.goto('/#showcase')
  await page.getByRole('button', { name: 'Chuyển đến thí nghiệm 1', exact: true }).click()
  await page.getByRole('link', { name: 'Mở thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/\/simulate\/jar-test/, { timeout: 15000 })
})

test('selects a side card before opening it and supports a horizontal swipe', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  const side = cards.nth(1)
  const box = await side.boundingBox()
  if (!box) throw new Error('Side card must be visible')
  const visibleRight = Math.min(box.x + box.width, page.viewportSize()!.width)
  await page.mouse.click(visibleRight - 12, box.y + box.height / 2)
  await expect(side).toHaveAttribute('data-active', 'true')
  await expect(side.locator('a')).toHaveAttribute('href', '/simulate/acid-base-extraction')
  await expect(side.locator('details')).toHaveCount(0)
  await expect.poll(() => side.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const track = el.parentElement!.getBoundingClientRect()
    return Math.abs(rect.left + rect.width / 2 - track.left - track.width / 2)
  })).toBeLessThan(3)
  const selected = await side.boundingBox()
  if (!selected) throw new Error('Selected card must be visible')
  const x = selected.x + selected.width / 2
  const y = selected.y + selected.height / 2
  await page.mouse.move(x + 50, y)
  await page.mouse.down()
  await page.mouse.move(x - 50, y, { steps: 8 })
  await page.mouse.up()
  await expect(cards.nth(2)).toHaveAttribute('data-active', 'true')
  await expect(page).toHaveURL(/#showcase$/)
})

test('uses rotation normally and brief opacity feedback with reduced motion', async ({ page }) => {
  const card = page.locator('.showcase-card').first()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(card).toHaveCSS('transition-duration', '0.68s, 0.38s')
  await page.getByRole('button', { name: 'Thí nghiệm tiếp theo', exact: true }).click()
  await expect.poll(() => card.evaluate((el) => el.getAnimations().some(animation => animation.effect?.getTiming().duration === 680))).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Chuyển đến thí nghiệm 3', exact: true }).click()
  const selected = page.locator('.showcase-card').nth(2)
  await expect(selected).toHaveCSS('transition-duration', '0s')
  await expect(selected).toHaveCSS('animation-duration', '0.18s')
})
