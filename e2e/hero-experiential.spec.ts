import { test, expect } from '@playwright/test'

test.describe('UI-02 hero: honest and accessible', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })
  test('CTA goes to showcase, with workbench anchor separately', async ({ page }) => {
    await expect(page.locator('.hero-btn-primary')).toHaveAttribute('href', '#showcase')
    await expect(page.locator('.hero-btn-secondary')).toHaveAttribute('href', '#workbench-preview')
    await page.locator('.hero-btn-primary').focus()
    await expect(page.locator('.hero-btn-primary')).toBeFocused()
  })
  test('preview contains no model-derived readings or fake progress', async ({ page }) => {
    const preview = page.locator('.hero-preview-wrapper')
    await expect(preview).toBeVisible()
    await expect(preview).toContainText('Minh họa')
    await expect(preview).toContainText('không phải phép đo')
    await expect(preview.locator('.hero-chart-svg')).toHaveCount(0)
    await expect(preview.locator('[role="progressbar"]')).toHaveCount(0)
  })
  test('respects dark mode, reduced motion and horizontal bounds', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.hero-preview-wrapper')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    expect(overflow).toBe(false)
  })
})

/** Compare computed heading ink with both opaque stops of the hero ground. */
function opaqueRgbValues(cssValue: string): [number, number, number][] {
  return Array.from(
    cssValue.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g),
  ).filter((match) => match[4] === undefined || Number(match[4]) === 1)
    .map((match) => [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number])
}

function contrastRatio(first: [number, number, number], second: [number, number, number]): number {
  const linear = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance = ([r, g, b]: [number, number, number]) =>
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

async function expectReadableHero(page: import('@playwright/test').Page, label: string) {
  const colors = await page.locator('.hero').evaluate((hero) => {
    const heading = hero.querySelector<HTMLElement>('.hero-headline')
    if (!heading) throw new Error('Hero heading missing')
    return {
      foreground: getComputedStyle(heading).color,
      ground: getComputedStyle(hero).backgroundImage,
    }
  })
  const text = opaqueRgbValues(colors.foreground)[0]
  const groundStops = opaqueRgbValues(colors.ground).slice(-2)
  expect(text, label + ': missing computed heading color').toBeDefined()
  expect(groundStops, label + ': expected two opaque hero gradient stops').toHaveLength(2)
  for (const stop of groundStops) {
    expect(contrastRatio(text!, stop), label + ': hero heading lacks contrast').toBeGreaterThanOrEqual(4.5)
  }
}

test('UI02-F1: automatic system dark with empty storage keeps hero readable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => window.localStorage.removeItem('veclab-theme'))
  await page.goto('/')
  expect(await page.locator('html').getAttribute('data-theme')).toBeNull()
  await expectReadableHero(page, 'automatic dark')
})

test('UI02-F1: explicit light/dark remains readable on a dark OS', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value }, theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await expectReadableHero(page, 'explicit ' + theme)
  }
})
