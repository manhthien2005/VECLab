import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })
test.beforeEach(async ({ page }) => { await page.goto('/#workbench-preview') })

test('introduces the planned workbench without interactive controls or invented results', async ({ page }) => {
  const section = page.locator('#workbench-preview')
  await expect(section.getByRole('heading', { name: 'Thực hành trên workbench', exact: true })).toBeVisible()
  await expect(section.getByText('Minh họa giao diện', { exact: true })).toBeVisible()
  await expect(section.locator('button, input, select, textarea, a, [tabindex="0"]')).toHaveCount(0)
  await expect(section.locator('.wb-concept-steps li')).toHaveText(['Chuẩn bị mẫu', '2Chọn điều kiện', '3Khuấy và lắng', '4Đo và ghi kết quả'])
  await expect(section.getByRole('cell', { name: 'Chưa đo', exact: true })).toHaveCount(2)
  await expect(section.getByRole('cell', { name: 'Chưa có', exact: true })).toHaveCount(2)
  await expect.poll(() => section.locator('.wb-concept-apparatus img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
})

test('keeps the frame, notes and fields readable in light and dark layouts', async ({ page }) => {
  const section = page.locator('#workbench-preview')
  const dark = page.getByRole('button', { name: 'Chuyển sang giao diện tối', exact: true })
  for (const mode of ['light', 'dark']) {
    if (mode === 'dark') await dark.click()
    await expect(section.locator('.wb-concept-note')).toHaveCount(3)
    for (const item of await section.locator('.wb-concept-note, .wb-concept-frame, .wb-concept-fields').all()) {
      await expect(item).toBeVisible()
      const box = await item.boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const overflowing = await section.locator('.wb-concept-fields dd, .wb-concept-note').evaluateAll(elements => elements.some(el => el.scrollWidth > el.clientWidth + 1))
    expect(overflowing).toBe(false)
  }
})
