import { expect, test, type Page } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

async function pane(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await nav.getByRole('button', { name, exact: true }).click()
}

test('Jar distinguishes empty cups from the fixed liquid sample and pouring lowers the source while raising the receiver', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/simulate/jar-test')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/attempt=/)
  await pane(page, 'Mô phỏng')
  await expect(page.getByTestId('jar-volume-A')).toHaveText('Cốc trống · 0 mL')
  await expect(page.getByTestId('jar-volume-B')).toHaveText('Cốc trống · 0 mL')
  await pane(page, 'Thao tác')
  const prepare = page.getByTestId('jar-control-prepare')
  if (await prepare.getAttribute('open') === null) await prepare.locator('summary').click()
  await page.getByRole('button', { name: 'Chuẩn bị cốc A', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 1')
  await pane(page, 'Mô phỏng')
  await expect(page.getByTestId('jar-volume-A')).toHaveText('500 mL mẫu nước đục')
  await expect(page.getByTestId('jar-volume-B')).toHaveText('Cốc trống · 0 mL')
  const rack = page.locator('[data-animation="on"]')
  if (process.env.JAR_WATER_REVIEW) {
    await rack.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 800 }))
    await rack.screenshot({ path: testInfo.outputPath('jar-pouring.png') })
  }
  const frames = await rack.evaluate(element => {
    const animations = element.getAnimations({ subtree: true })
    const source = element.querySelector('[data-pour-source]')!
    const surface = element.querySelector('[data-liquid-surface]')!
    const sample = () => ({ sourceHeight: Math.abs(new DOMMatrixReadOnly(getComputedStyle(source).transform).m22) * 30, waterY: surface.getBoundingClientRect().y })
    animations.forEach(animation => { animation.pause(); animation.currentTime = 200 })
    const start = sample()
    animations.forEach(animation => { animation.currentTime = 1000 })
    const middle = sample()
    animations.forEach(animation => { animation.currentTime = 1800 })
    const end = sample()
    animations.forEach(animation => animation.play())
    return { start, middle, end }
  })
  expect(frames.middle.sourceHeight).toBeLessThan(frames.start.sourceHeight)
  expect(frames.end.sourceHeight).toBeLessThan(.1)
  expect(frames.middle.waterY).toBeLessThan(frames.start.waterY)
  expect(frames.end.waterY).toBeLessThan(frames.middle.waterY)
  await expect(page.getByTestId('jar-stage-final-ntu')).toHaveText('Chưa đo')
  await page.reload()
  await pane(page, 'Mô phỏng')
  await expect(page.getByTestId('jar-volume-A')).toHaveText('500 mL mẫu nước đục')
  await expect(rack.locator('[data-pour-source]')).toHaveCount(0)
  await expect(page.getByTestId('jar-particles-A').locator('[data-particle]')).toHaveCount(12)
  const prepared = page.getByRole('group', { name: 'Chọn cốc thao tác' }).getByRole('button', { name: /Cốc A, đã chuẩn bị/ })
  const surfaceY = Number(await prepared.locator('[data-liquid-surface]').getAttribute('cy'))
  const halfLiterTickY = Number(await prepared.locator('[data-volume-tick="500"]').getAttribute('y1'))
  expect(surfaceY).toBe(halfLiterTickY)
  const preparedArt = await prepared.locator('svg').boundingBox()
  const emptyArt = await page.getByRole('group', { name: 'Chọn cốc thao tác' }).getByRole('button', { name: /Cốc B, chưa chuẩn bị/ }).locator('svg').boundingBox()
  expect(Math.abs(preparedArt!.height - emptyArt!.height)).toBeLessThan(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByTestId('jar-volume-A')).toHaveText('500 mL mẫu nước đục')
  expect(Number(await prepared.locator('[data-liquid-surface]').getAttribute('cy'))).toBe(surfaceY)
  if (process.env.JAR_WATER_REVIEW) await rack.screenshot({ path: testInfo.outputPath('jar-filled.png') })
})
