import { test, expect } from '@playwright/test'

test('floating header stays fixed, centers desktop navigation and offers sign-in', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const header = page.locator('.app-header')
  await expect(header).toHaveCSS('position', 'fixed')
  await expect(header.getByRole('link', { name: 'Đăng nhập — chưa đăng nhập', exact: true }))
    .toHaveAttribute('href', '/sign-in')
  const geometry = await header.evaluate((node) => {
    const bounds = node.getBoundingClientRect()
    const nav = node.querySelector('.app-nav')!.getBoundingClientRect()
    return { top: bounds.top, left: bounds.left, center: (nav.left + nav.right) / 2 }
  })
  expect(geometry.top).toBeGreaterThan(0)
  expect(geometry.left).toBeGreaterThan(0)
  expect(Math.abs(geometry.center - 720)).toBeLessThanOrEqual(2)
  await page.locator('.app-footer').scrollIntoViewIfNeeded()
  expect((await header.boundingBox())!.y).toBeCloseTo(geometry.top, 1)
})

test('mobile menu closes with Escape and returns focus to its button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Mở menu điều hướng', exact: true })
  await toggle.click()
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })
    .getByRole('link', { name: 'Thí nghiệm', exact: true })).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

for (const width of [320, 390, 768, 1440]) {
  test('header and footer fit at ' + width + 'px with enlarged text', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    const header = page.locator('.app-header')
    const geometry = await header.evaluate((node) => {
      const bounds = node.getBoundingClientRect()
      const brand = node.querySelector('.brand')!.getBoundingClientRect()
      const nav = node.querySelector('.header-navigation')!.getBoundingClientRect()
      const actions = node.querySelector('.header-actions')!.getBoundingClientRect()
      return {
        fits: bounds.left >= 0 && bounds.right <= innerWidth && node.scrollWidth <= node.clientWidth + 1,
        brandOverlapsNav: brand.right > nav.left + 1,
        navOverlapsActions: nav.right > actions.left + 1,
      }
    })
    expect(geometry).toEqual({ fits: true, brandOverlapsNav: false, navOverlapsActions: false })
    if (width <= 1120) {
      await page.getByRole('button', { name: 'Mở menu điều hướng', exact: true }).click()
      const menuOverflow = await page.locator('.app-nav').evaluate((menu) => menu.scrollWidth > menu.clientWidth + 1)
      expect(menuOverflow).toBe(false)
      await page.keyboard.press('Escape')
    }
    await page.locator('.app-footer').scrollIntoViewIfNeeded()
    await expect(page.locator('.footer-nav').getByRole('link', { name: 'Nguồn khoa học', exact: true }))
      .toHaveAttribute('href', '/evidence')
    await expect(page.locator('.app-footer')).not.toContainText('Khoa học hôm nay')
    const overflow = await page.locator('.app-footer').evaluate((footer) =>
      [footer, ...footer.querySelectorAll('a, p, h2')].filter((node) => {
        const rect = node.getBoundingClientRect()
        return rect.right > innerWidth + 1 || rect.left < -1 || node.scrollWidth > node.clientWidth + 1
      }).map((node) => node.tagName + '.' + node.className))
    expect(overflow).toEqual([])
  })
}
