import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

const titles = ['Jar Test', 'Xử lý nước nhiễm kim loại Fe, Zn và Pb', 'Chiết tách axit–bazơ', 'Xà phòng hóa', 'Phân loại nhựa nguyên sinh']
const routes = ['jar-test', 'water-treatment', 'acid-base-extraction', 'cold-process-soap', 'plastic-density-separation']

test.beforeEach(async ({ page }) => {
  await page.goto('/#showcase')
  await expect(page.locator('.final-cta-section')).toHaveClass(/is-(pending|revealed)/)
})

test('offers five working experiments with loaded art and no duplicate cards', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  await expect(page.getByRole('heading', { name: '5 thí nghiệm mô phỏng', exact: true })).toBeVisible()
  await expect(cards.locator('h3')).toHaveText(titles)
  await expect(page.locator('.showcase-card-state, .showcase-card-footer')).toHaveCount(0)
  for (let index = 0; index < titles.length; index++) {
    await page.getByRole('button', { name: `Chuyển đến thí nghiệm ${index + 1}`, exact: true }).click()
    await expect(cards.nth(index)).toHaveAttribute('data-active', 'true')
    await expect(cards.nth(index).locator('a')).toHaveAttribute('href', `/simulate/${routes[index]}`)
    await expect.poll(() => cards.nth(index).locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('wraps across five cards and keeps keyboard focus and scroll position', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  const next = page.getByRole('button', { name: 'Thí nghiệm tiếp theo', exact: true })
  for (let index = 1; index <= 5; index++) {
    await next.click()
    await expect(cards.nth(index % 5)).toHaveAttribute('data-active', 'true')
  }
  await expect(next).toBeFocused()
  await page.getByRole('button', { name: 'Thí nghiệm trước đó', exact: true }).click()
  await expect(cards.nth(4)).toHaveAttribute('data-active', 'true')
  await cards.nth(4).locator('a').focus()
  const top = await page.evaluate(() => scrollY)
  await page.keyboard.press('ArrowRight')
  await expect(cards.first()).toHaveAttribute('data-active', 'true')
  await expect(cards.first().locator('a')).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(top)
})

test('selects a neighbour before opening and supports horizontal swipe', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  const side = cards.nth(1)
  const box = await side.boundingBox()
  if (!box) throw new Error('Neighbour must have visible geometry')
  await page.mouse.click(Math.min(box.x + box.width, page.viewportSize()!.width) - 12, box.y + box.height / 2)
  await expect(side).toHaveAttribute('data-active', 'true')
  await expect(page).toHaveURL(/#showcase$/)
  await expect.poll(() => side.evaluate(el => {
    const card = el.getBoundingClientRect()
    const track = el.parentElement!.getBoundingClientRect()
    return Math.abs(card.left + card.width / 2 - track.left - track.width / 2)
  })).toBeLessThan(3)
  const center = await side.boundingBox()
  if (!center) throw new Error('Selected card must have geometry')
  const x = center.x + center.width / 2
  const y = center.y + center.height / 2
  await page.mouse.move(x + 50, y)
  await page.mouse.down()
  await page.mouse.move(x - 50, y, { steps: 8 })
  await page.mouse.up()
  await expect(cards.nth(2)).toHaveAttribute('data-active', 'true')
  await expect(page).toHaveURL(/#showcase$/)
})

test('keeps rear cards inert and settles rapid changes without overlap', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  await expect(cards.locator('a')).toHaveCount(5)
  await expect(page.locator('.showcase-card[inert]')).toHaveCount(2)
  const next = page.getByRole('button', { name: 'Thí nghiệm tiếp theo', exact: true })
  for (let step = 0; step < 7; step++) await next.click()
  const selected = cards.nth(2)
  await expect(selected).toHaveAttribute('data-active', 'true')
  await expect.poll(() => selected.evaluate(el => {
    const card = el.getBoundingClientRect()
    const track = el.parentElement!.getBoundingClientRect()
    return Math.abs(card.left + card.width / 2 - track.left - track.width / 2)
  })).toBeLessThan(3)
  if (page.viewportSize()!.width >= 900) {
    await expect.poll(() => page.locator('.showcase-track').evaluate(track => {
      const center = track.querySelector('[data-position="center"]')!.getBoundingClientRect()
      const right = track.querySelector('[data-position="right"]')!.getBoundingClientRect()
      return right.left - center.right
    })).toBeGreaterThan(8)
  }
})

test('honours a live reduced-motion change while retaining the selected experiment', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Thí nghiệm tiếp theo', exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
  await expect(cards.nth(1)).toHaveCSS('transition-duration', '0s')
  await expect(cards.nth(1)).toHaveCSS('animation-duration', '0.18s')
  await page.getByRole('button', { name: 'Chuyển đến thí nghiệm 5', exact: true }).click()
  await expect(cards.nth(4)).toHaveAttribute('data-active', 'true')
  await expect(cards.nth(4).locator('a')).toHaveAttribute('href', '/simulate/plastic-density-separation')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(cards.nth(4)).toHaveCSS('transition-duration', '0.42s, 0.24s')
})
