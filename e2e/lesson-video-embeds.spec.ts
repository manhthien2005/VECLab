import { expect, test } from '@playwright/test'

const lessons = [
  { route: 'cold-process-soap', section: 'soap-videos', youtube: 'u1WPpGTqC0o', lesson: 'xa-phong-hoa-intro-v1.mp4', cover: 'soap-cover.webp' },
  { route: 'water-treatment', section: 'water-treatment-videos', youtube: 'xK7vcq-jzPU', lesson: 'water-treatment-intro-v1.mp4', cover: 'water-treatment-lesson-cover.webp' },
  { route: 'jar-test', section: 'jar-videos', youtube: 'fpwHE6tpT5g', lesson: 'jar-test-intro-v1.mp4', cover: 'jar-test-lesson-cover.webp' },
  { route: 'acid-base-extraction', section: 'extraction-videos', youtube: 'kUnZ-o2pt4M', lesson: 'acid-bazo-extraction-intro-v1.mp4', cover: 'acid-base-extraction-lesson-cover.webp' },
  { route: 'plastic-density-separation', section: 'plastic-videos', youtube: 'RJ-m-Y5uuXY', lesson: 'Plastic-separation-intro-v1.mp4', cover: 'plastic-theory-overview-cover.jpg' },
] as const

for (const lesson of lessons) {
  test(`${lesson.route}: loads the correct player only after play and removes it on selection`, async ({ page }) => {
    // Isolate external playback from the app contract; live YouTube playback is a separate manual check.
    const mediaRequests: string[] = []
    await page.route('https://www.youtube-nocookie.com/**', route => {
      mediaRequests.push(route.request().url())
      return route.fulfill({ contentType: 'text/html', body: '<html lang="vi"><body>External player boundary</body></html>' })
    })
    await page.route('**/storage/v1/object/public/lesson-videos/**', route => {
      mediaRequests.push(route.request().url())
      return route.abort()
    })
    await page.goto(`/experiments/${lesson.route}`)
    const section = page.locator(`#${lesson.section}`)
    await expect(section).toBeVisible()
    await expect(section.locator('video, iframe')).toHaveCount(0)
    await expect(section.locator('button[aria-label^="Phát video"] img')).toHaveAttribute('src', new RegExp(lesson.cover.replaceAll('.', '\\.')))
    expect(mediaRequests).toHaveLength(0)

    await section.getByRole('button', { name: 'Chọn video: Thao tác thực hành trên VECLab', exact: true }).click()
    await expect(section.locator('video, iframe')).toHaveCount(0)
    expect(mediaRequests).toHaveLength(0)
    const play = section.getByRole('button', { name: /^Phát video/ })
    await play.focus()
    await page.keyboard.press('Enter')
    const iframe = section.locator('iframe')
    await expect(iframe).toHaveAttribute('src', `https://www.youtube-nocookie.com/embed/${lesson.youtube}?autoplay=1&playsinline=1&rel=0&hl=vi`)
    await expect(iframe).toHaveAttribute('allowfullscreen', '')
    await expect(iframe).toBeFocused()
    await expect(section.locator('video')).toHaveCount(0)
    await expect(section.getByRole('link', { name: 'Mở trên YouTube' })).toHaveAttribute('href', `https://www.youtube.com/watch?v=${lesson.youtube}`)
    const box = await iframe.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(200)
    expect(box!.height).toBeGreaterThanOrEqual(200)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)

    await section.getByRole('button', { name: 'Chọn video: Bài học', exact: true }).click()
    await expect(section.locator('video, iframe')).toHaveCount(0)
    await section.getByRole('button', { name: /^Phát video/ }).click()
    await expect(section.locator('video')).toHaveAttribute('src', `https://rnreqrlrxhykbkjqbuil.supabase.co/storage/v1/object/public/lesson-videos/${lesson.lesson}`)
    await expect(section.getByRole('alert')).toBeVisible()
    await section.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await expect.poll(() => mediaRequests.filter(url => url.endsWith(lesson.lesson)).length).toBeGreaterThanOrEqual(2)
    await section.getByRole('button', { name: 'Chọn video: Thao tác thực hành trên VECLab', exact: true }).click()
    await expect(section.getByRole('alert')).toHaveCount(0)
    await expect(section.locator('video, iframe')).toHaveCount(0)
  })
}
