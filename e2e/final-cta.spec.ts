import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('offers a readable, keyboard-accessible entrance to the actual lab', async ({ page }) => {
  await page.goto('/')
  const section = page.locator('.final-cta-section')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('heading', { name: 'Sẵn sàng vào lab?', exact: true })).toBeVisible()
  const cta = section.getByRole('link', { name: 'Vào lab thực hành', exact: true })
  await expect(cta).toHaveAttribute('href', '/simulate/acid-neutralization')
  for (const mode of ['light', 'dark']) {
    if (mode === 'dark') await page.getByRole('button', { name: 'Chuyển sang giao diện tối', exact: true }).click()
    await section.scrollIntoViewIfNeeded()
    const contrast = await cta.evaluate((el) => {
      const color = getComputedStyle(el)
      const luminance = (rgb: string) => rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(n => n / 255).map(n => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i]!, 0)
      const [a, b] = [luminance(color.color), luminance(color.backgroundColor)].sort((x, y) => y - x)
      return (a! + 0.05) / (b! + 0.05)
    })
    expect(contrast).toBeGreaterThanOrEqual(4.5)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await cta.focus()
  await expect(cta).toBeFocused()
  const image = section.locator('.final-cta-image')
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
  await expect(image).toHaveCSS('transition-duration', '0.48s')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(image).toHaveCSS('transition-duration', '0s')
  await cta.press('Enter')
  await expect(page).toHaveURL(/\/simulate\/acid-neutralization$/, { timeout: 15000 })
})
