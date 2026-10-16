import { expect, test } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('extraction guide plays both captioned demonstrations on request and credits its equipment photos', async ({ page }) => {
  await page.goto('/experiments/acid-base-extraction/guide')
  await expect(page.getByRole('heading', { name: 'Nhận biết các bình trên bàn thực hành', exact: true })).toBeVisible()
  const captures = page.getByRole('img', { name: /^Bảng thao tác trên VECLab:/ })
  await expect(captures).toHaveCount(8)
  for (const image of await captures.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect.poll(() => image.evaluate(element => {
      const img = element as HTMLImageElement
      return img.complete && img.naturalWidth > 0
    })).toBe(true)
  }
  for (const [summary, label] of [
    ['Xem video ngắn: chuyển mẫu S vào phễu F', 'Video chuyển mẫu S vào phễu F'],
    ['Xem video ngắn: trộn, xả áp và phân lớp', 'Video trộn, xả áp và phân lớp'],
  ] as const) {
    const movie = page.getByLabel(label, { exact: true })
    await expect(movie).toBeHidden()
    await page.getByText(summary, { exact: true }).click()
    await expect(movie).toBeVisible()
    await expect(movie).toHaveAttribute('controls', '')
    await expect(movie).toHaveAttribute('preload', 'none')
    expect(await movie.evaluate(element => (element as HTMLVideoElement).autoplay)).toBe(false)
    expect(await movie.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true)
    await movie.evaluate(async element => { await (element as HTMLVideoElement).play() })
    await expect.poll(() => movie.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0)
    await expect.poll(() => movie.evaluate(element => (element as HTMLVideoElement).textTracks[0]?.cues?.length ?? 0)).toBeGreaterThan(0)
    expect(await movie.evaluate(element => (element as HTMLVideoElement).duration)).toBeGreaterThan(5)
    await movie.evaluate(element => (element as HTMLVideoElement).pause())
  }
  await page.getByText('Nguồn ảnh và tư liệu hướng dẫn', { exact: true }).click()
  await expect(page.getByRole('link', { name: 'CC BY-SA 3.0', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
