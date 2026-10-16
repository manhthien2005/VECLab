import { expect, test, type Page } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

async function pane(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await nav.getByRole('button', { name, exact: true }).click()
}

async function group(page: Page, id: string) {
  await pane(page, 'Thao tác')
  const target = page.getByTestId('jar-control-' + id)
  if (await target.getAttribute('open') === null) await target.locator('summary').click()
}

async function begin(page: Page) {
  await page.goto('/simulate/jar-test')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/attempt=/)
  await group(page, 'baseline')
  await page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 1')
  await group(page, 'prepare')
  await page.getByRole('button', { name: 'Chuẩn bị cốc A', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 2')
}

async function phase(page: Page, name: string, revision: number) {
  await group(page, 'program')
  await page.getByRole('button', { name: 'Chạy pha ' + name, exact: false }).click()
  if (name === 'Khuấy nhanh') await page.getByRole('dialog', { name: 'Chạy chương trình chung' }).getByRole('button', { name: 'Bắt đầu khuấy cả mẻ', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu ' + revision)
}

test('Jar action explanation survives hidden mobile pane, finishes once and leaves saved measurements unchanged', async ({ page, isMobile }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await begin(page)
  if (isMobile) await page.waitForTimeout(2800)
  await pane(page, 'Mô phỏng')
  const cue = page.getByTestId('jar-action-explanation')
  await expect(cue).toBeVisible()
  await expect(cue).toContainText('Chuẩn bị cốc A')
  await expect(page.getByTestId('jar-stage-final-ntu')).toHaveText('Chưa đo')
  if (process.env.JAR_MOTION_REVIEW) {
    const rack = page.locator('[data-animation="on"]')
    await rack.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 950 }))
    await rack.screenshot({ path: testInfo.outputPath('jar-prepare.png') })
    await rack.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => animation.play()))
  }
  await expect(cue).toHaveCount(0, { timeout: 6000 })
  await pane(page, 'Sổ đo')
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 2')
  await pane(page, 'Mô phỏng')
  await expect(cue).toHaveCount(0)
  await page.reload()
  await pane(page, 'Mô phỏng')
  await expect(cue).toHaveCount(0)
  await expect(page.getByTestId('jar-stage-final-ntu')).toHaveText('Chưa đo')
})

test('Jar live reduced motion settles the same phase without spatial animation or a replay after restore', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await begin(page)
  await group(page, 'dose')
  await page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc A', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 3')
  await phase(page, 'Khuấy nhanh', 4)
  await pane(page, 'Mô phỏng')
  await expect.poll(() => page.getByTestId('jar-paddle-A').evaluate(el => getComputedStyle(el).animationName)).not.toBe('none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => page.getByTestId('jar-paddle-A').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  await phase(page, 'Khuấy chậm', 5)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await phase(page, 'Lắng', 6)
  await pane(page, 'Mô phỏng')
  if (process.env.JAR_MOTION_REVIEW) {
    const rack = page.locator('[data-animation="on"]')
    await rack.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 1200 }))
    await rack.screenshot({ path: testInfo.outputPath('jar-settling.png') })
    await rack.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => animation.play()))
  }
  await page.getByTestId('jar-action-explanation').waitFor({ state: 'hidden', timeout: 6000 })
  const particles = page.getByTestId('jar-particles-A')
  const geometry = () => particles.evaluate(el => [...el.querySelectorAll('[data-particle]')].map(node => getComputedStyle(node).transform))
  const finalGeometry = await geometry()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await geometry()).toEqual(finalGeometry)
  await page.reload()
  await pane(page, 'Mô phỏng')
  await expect(page.getByTestId('jar-action-explanation')).toHaveCount(0)
  expect(await geometry()).toEqual(finalGeometry)
  await expect.poll(() => particles.evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0)
  await expect(page.getByTestId('jar-stage-final-ntu')).toHaveText('Chưa đo')
  await pane(page, 'Sổ đo')
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 6')
})

test('Jar new accepted action replaces the explanation and selecting another cup cannot replay it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await begin(page)
  await group(page, 'dose')
  await page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc A', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 3')
  await pane(page, 'Mô phỏng')
  const cue = page.getByTestId('jar-action-explanation')
  await expect(cue).toContainText('Cấp phèn vào cốc A')
  await expect(cue).not.toContainText('Chuẩn bị cốc')
  await cue.evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
  await pane(page, 'Thao tác')
  await page.getByLabel('Cốc đang thao tác', { exact: true }).selectOption('B')
  await pane(page, 'Mô phỏng')
  await expect(cue).toContainText('Cấp phèn vào cốc A')
  await expect(page.getByTestId('jar-stage-final-ntu')).toHaveText('Chưa đo')
  await cue.evaluate(el => el.getAnimations().forEach(animation => animation.finish()))
  await expect(cue).toHaveCount(0)
  await pane(page, 'Thao tác')
  await page.getByLabel('Cốc đang thao tác', { exact: true }).selectOption('A')
  await pane(page, 'Mô phỏng')
  await expect(cue).toHaveCount(0)
  await pane(page, 'Sổ đo')
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 3')
})

test('Jar selecting the last cup brings its apparatus into view without changing the saved attempt', async ({ page }) => {
  await begin(page)
  await pane(page, 'Thao tác')
  await page.getByLabel('Cốc đang thao tác', { exact: true }).selectOption('F')
  await pane(page, 'Mô phỏng')
  const lastCup = page.getByRole('group', { name: 'Chọn cốc thao tác' }).getByRole('button', { name: 'Cốc F, chưa chuẩn bị, đang thao tác', exact: true })
  await expect(lastCup).toBeInViewport({ ratio: .8 })
  await expect(page.getByTestId('jar-stage-final-ntu')).toHaveText('Chưa đo')
  await pane(page, 'Sổ đo')
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 2')
})
