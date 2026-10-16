import { expect, test } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('Jar guide provides a captioned demonstration that plays only on request', async ({ page }) => {
  await page.goto('/experiments/jar-test/guide#jar-step-prepare')
  const movie = page.getByLabel('Video minh họa chọn pH và chuẩn bị cốc A', { exact: true })
  await expect(movie).toBeHidden()
  await page.getByText('Xem video ngắn: chuẩn bị một cốc', { exact: true }).click()
  await expect(movie).toBeVisible()
  await expect(movie).toHaveAttribute('controls', '')
  await expect(movie).toHaveAttribute('preload', 'none')
  await expect(movie.locator('track')).toHaveAttribute('srclang', 'vi')
  expect(await movie.evaluate(element => (element as HTMLVideoElement).autoplay)).toBe(false)
  expect(await movie.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true)
  await movie.evaluate(async element => {
    const video = element as HTMLVideoElement
    await video.play()
  })
  await expect.poll(() => movie.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0)
  expect(await movie.evaluate(element => (element as HTMLVideoElement).duration)).toBeGreaterThan(5)
  await movie.evaluate(element => (element as HTMLVideoElement).pause())
  await page.getByText('Nguồn ảnh và tư liệu hướng dẫn', { exact: true }).click()
  await expect(page.getByRole('link', { name: 'CC BY-SA 3.0', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
