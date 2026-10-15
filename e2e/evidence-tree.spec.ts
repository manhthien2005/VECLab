import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('keeps the evidence tree readable and links to its actual sources', async ({ page }) => {
  await page.goto('/#evidence')
  const section = page.locator('#evidence')
  await expect(section.getByRole('heading', { name: 'Mỗi kết quả đều có căn cứ', exact: true })).toBeVisible()
  await expect(section.locator('.evidence-tree-node h3')).toHaveText(['Mô hình và giới hạn', 'Cách tính kết quả', 'Tài liệu tham khảo'])
  await expect(section.locator('.book-stack-container')).toHaveCount(0)
  await expect(section).not.toContainText('19 nguồn kiểm chứng')
  await expect(section).not.toContainText('Cu²⁺')
  for (const node of await section.locator('.evidence-tree-node').all()) {
    const box = await node.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    expect(await node.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const link = section.getByRole('link', { name: 'Xem nguồn khoa học', exact: true })
  await link.focus()
  await expect(link).toBeFocused()
  await link.press('Enter')
  await expect(page).toHaveURL(/\/evidence$/, { timeout: 15000 })
})
