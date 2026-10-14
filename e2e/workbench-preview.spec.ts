import { test, expect } from '@playwright/test'

test.describe('UI-02 workbench: volume-only illustration', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/') })
  test('labels demonstration and leaves pH unmeasured', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    await expect(frame).toContainText('Minh họa thao tác')
    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('Chưa đo')
    await expect(frame.locator('.wp-volume-value')).toContainText('25,00 mL')
    await expect(frame.locator('.wp-chart-svg')).toHaveCount(0)
    await expect(frame.locator('.wp-reagent-fixed')).toContainText('NaOH 0,0100 M')
  })
  test('adds local volume without API requests, then resets', async ({ page }) => {
    const frame = page.locator('.workbench-frame')
    const requests: string[] = []
    page.on('request', (req) => { if (req.url().includes('/api/')) requests.push(req.url()) })
    const add = frame.getByRole('button', { name: 'Xem thao tác thêm 1 mL' })
    await add.click()
    await expect(frame.locator('.wp-volume-value')).toContainText('26,00 mL')
    await expect(frame.locator('.wp-telemetry-value-lg')).toHaveText('Chưa đo')
    await expect(frame.locator('.wp-feedback-toast')).toContainText('Đã minh họa thêm 1 mL')
    await expect(frame.locator('.wp-toast-link')).toHaveAttribute('href', '/simulate/acid-neutralization')
    await add.click()
    await expect(frame.locator('.wp-volume-value')).toContainText('27,00 mL')
    await frame.getByRole('button', { name: 'Đặt lại minh họa' }).click()
    await expect(frame.locator('.wp-volume-value')).toContainText('25,00 mL')
    await expect(frame.locator('.wp-feedback-toast')).toHaveCount(0)
    expect(requests).toHaveLength(0)
  })
  test('works with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Xem thao tác thêm 1 mL' }).click()
    await expect(page.locator('.wp-volume-value')).toContainText('26,00 mL')
  })
})

/** Test actual CSS colors, not the presence of a class or a hover transition. */
function buttonContrast(color: string, background: string): number {
  const rgb = (value: string): [number, number, number] => {
    const match = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/)
    if (!match) throw new Error('Expected opaque computed RGB, got ' + value)
    return [Number(match[1]), Number(match[2]), Number(match[3])]
  }
  const luminance = (value: string) => {
    const [r, g, b] = rgb(value)
    const linear = (v: number) => {
      const n = v / 255
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
  }
  const a = luminance(color)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

test('UI02-F2: demo button remains at least 4.5:1 in normal/hover/focus/active/after-click', async ({ page }) => {
  await page.goto('/')
  const add = page.getByRole('button', { name: 'Xem thao tác thêm 1 mL' })
  const reset = page.getByRole('button', { name: 'Đặt lại minh họa' })
  const assertContrast = async (state: string) => {
    const styles = await add.evaluate((el) => {
      const style = getComputedStyle(el)
      return {
        color: style.color,
        background: style.backgroundColor,
        backgroundImage: style.backgroundImage,
      }
    })
    expect(styles.backgroundImage, state + ': no gradient/transparent image fallback').toBe('none')
    expect(buttonContrast(styles.color, styles.background), state).toBeGreaterThanOrEqual(4.5)
  }

  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value }, theme)
    await page.mouse.move(0, 0)
    await assertContrast(theme + ' normal')

    await add.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(add).toBeFocused()
    expect(await add.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
    await assertContrast(theme + ' keyboard focus')

    await add.hover()
    await assertContrast(theme + ' hover')
    await page.mouse.down()
    await assertContrast(theme + ' active')
    await page.mouse.up()
    await expect(page.locator('.wp-volume-value')).toContainText('26,00 mL')
    await assertContrast(theme + ' after click')
    await expect(page.locator('.wp-telemetry-value-lg')).toHaveText('Chưa đo')

    await reset.click()
    await expect(page.locator('.wp-volume-value')).toContainText('25,00 mL')
  }
})
