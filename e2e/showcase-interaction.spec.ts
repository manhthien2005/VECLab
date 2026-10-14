import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test.beforeEach(async ({ page }) => { await page.goto('/#showcase') })

test('shows the agreed experiments with loaded illustrations and no status or CTA footers', async ({ page }) => {
  const cards = page.locator('.showcase-card')
  await expect(cards.locator('h3')).toHaveText(['Điều chỉnh pH', 'Jar Test', 'Hấp phụ xanh methylene'])
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
  await expect(next).toBeDisabled()
  await page.getByRole('button', { name: 'Thí nghiệm trước đó', exact: true }).click()
  await expect(cards.nth(1)).toHaveAttribute('data-active', 'true')
  await cards.nth(1).locator('summary').focus()
  const top = await page.evaluate(() => scrollY)
  await page.keyboard.press('ArrowLeft')
  await expect(cards.nth(0)).toHaveAttribute('data-active', 'true')
  await expect(cards.nth(0).locator('a')).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(top)
})

test('whole cards open honest introductions or the existing pH simulator', async ({ page }) => {
  await page.getByRole('button', { name: 'Chuyển đến thí nghiệm 2', exact: true }).click()
  await page.locator('.showcase-card').nth(1).locator('summary').click()
  await expect(page.locator('.showcase-card').nth(1).locator('details')).toHaveAttribute('open', '')
  await expect(page.getByText('Bài thực hành đang được xây dựng, hiện chưa thể bắt đầu.', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Chuyển đến thí nghiệm 1', exact: true }).click()
  await page.getByRole('link', { name: 'Mở thí nghiệm Điều chỉnh pH', exact: true }).click()
  await expect(page).toHaveURL(/\/simulate\/acid-neutralization/, { timeout: 15000 })
})
