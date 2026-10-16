import { expect, test, type Page } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })
async function pane(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await nav.getByRole('button', { name, exact: true }).click()
}
async function group(page: Page, id: string) {
  await pane(page, 'Thao tác')
  const details = page.getByTestId('extraction-control-' + id)
  if (await details.getAttribute('open') === null) await details.locator('summary').click()
}
async function select(page: Page, id: string) {
  await pane(page, 'Thao tác')
  await page.getByLabel('Bình đang thao tác', { exact: true }).selectOption(id)
}
async function add(page: Page, id: string, reagent: string, ml: number) {
  await select(page, id); await group(page, 'prepare')
  await page.getByLabel('Dung dịch', { exact: true }).selectOption(reagent)
  await page.getByLabel('Thể tích dung dịch (mL)', { exact: true }).fill(String(ml))
  await page.getByRole('button', { name: `Thêm ${ml} mL vào ${id}`, exact: true }).click()
}
async function transfer(page: Page, from: string, to: string, phase: string, ml: number) {
  await select(page, from); await group(page, 'transfer')
  await page.getByLabel('Bình nhận', { exact: true }).selectOption(to)
  await page.getByLabel('Phần dịch cần chuyển', { exact: true }).selectOption(phase)
  await page.getByLabel('Thể tích cần chuyển (mL)', { exact: true }).fill(String(ml))
  await page.getByRole('button', { name: `Chuyển ${ml} mL → ${to}`, exact: true }).click()
}
async function open(page: Page) {
  await page.goto('/simulate/acid-base-extraction')
  await expect(page.getByRole('button', { name: 'Nộp bài', exact: true })).toBeEnabled()
}
const scene = (page: Page) => page.getByTestId('extraction-scene')
const art = (page: Page, id: string) => scene(page).locator(`[data-vessel-art="${id}"]`)

test('graduations and both liquid levels show the committed transfer, including skip and restore', async ({ page }, testInfo) => {
  await open(page); await pane(page, 'Mô phỏng')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '40')
  // S is cylindrical: the 250 mL scale spans y=221 to y=54.
  expect(Number(await art(page, 'S').locator('[data-meniscus=total]').getAttribute('data-level-y'))).toBeCloseTo(194.28, 2)
  await expect(art(page, 'S').locator('[data-graduation="50"]')).toHaveCount(1)
  await transfer(page, 'S', 'F', 'all', 20); await pane(page, 'Mô phỏng')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '20')
  await expect(art(page, 'F')).toHaveAttribute('data-volume-ml', '20')
  await expect(page.getByTestId('extraction-volume-change')).toContainText('S: 40 → 20 mL')
  await expect(page.getByTestId('extraction-volume-change')).toContainText('F: 0 → 20 mL')
  for (const [label, time] of [['start', 0], ['middle', 1100], ['end', 2200]] as const) {
    await scene(page).evaluate((node, ms) => node.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = ms }), time)
    const sourceScale = await art(page, 'S').locator('[data-phase=organic]').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).d)
    const targetScale = await art(page, 'F').locator('[data-phase=organic]').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).d)
    if (label === 'start') { expect(sourceScale).toBeCloseTo(1); expect(targetScale).toBeCloseTo(0) }
    else if (label === 'end') { expect(sourceScale).toBeCloseTo(.5); expect(targetScale).toBeCloseTo(1) }
    else {
      expect(sourceScale).toBeGreaterThan(.5); expect(sourceScale).toBeLessThan(1); expect(targetScale).toBeGreaterThan(0); expect(targetScale).toBeLessThan(1)
      const screenMatrix = await art(page, 'S').locator('[data-phase=organic]').evaluate(node => (node as SVGGraphicsElement).getScreenCTM()!.b)
      expect(screenMatrix).toBeCloseTo(0, 2) // The liquid remains horizontal while the glass tilts.
      const glassBox = await art(page, 'S').locator('[data-motion] > path').first().boundingBox()
      expect(glassBox!.y).toBeGreaterThanOrEqual((await scene(page).boundingBox())!.y)
    }
    if (process.env.VECLAB_CHECK_FRAMES) await scene(page).screenshot({ path: testInfo.outputPath('transfer-' + label + '.png') })
  }
  const ids = await page.locator('svg [id]').evaluateAll(nodes => nodes.map(node => node.id))
  expect(new Set(ids).size).toBe(ids.length)
  await page.getByRole('button', { name: 'Xem trạng thái cuối', exact: true }).click()
  await expect(scene(page)).toHaveAttribute('data-operation', 'idle')
  expect(Number(await art(page, 'S').locator('[data-meniscus=total]').getAttribute('data-level-y'))).toBeCloseTo(207.64, 2)
  await page.reload(); await pane(page, 'Mô phỏng')
  await expect(scene(page)).toHaveAttribute('data-operation', 'idle')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '20')
  await expect(page.getByTestId('extraction-vessel-F')).toContainText('20 mL')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

test('a hidden tab pauses a cue and a new attempt starts with the initial sample', async ({ page }) => {
  await open(page); await add(page, 'S', 'water', 5); await pane(page, 'Mô phỏng')
  await expect(scene(page)).toHaveAttribute('data-operation', 'add_reagent')
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.getByRole('region', { name: 'Khu vực thực hành chiết tách', exact: true })).toHaveAttribute('data-paused', 'true')
  await page.waitForTimeout(2800)
  await expect(scene(page)).toHaveAttribute('data-operation', 'add_reagent')
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'visibilityState')
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(scene(page)).toHaveAttribute('data-operation', 'idle')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '45')
  await pane(page, 'Sổ đo'); await expect(page.getByText('Bản lưu 1', { exact: true })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/simulate/acid-base-extraction'); await pane(page, 'Mô phỏng')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '40')
  await expect(scene(page)).toHaveAttribute('data-operation', 'idle')
})

test('two-phase separation keeps phase volumes and uses the correct outlet for each collection', async ({ page }, testInfo) => {
  await open(page); await transfer(page, 'S', 'F', 'all', 40)
  await add(page, 'F', 'base', 20); await group(page, 'program')
  for (const name of ['Trộn', 'Xả áp', 'Để phân lớp']) await page.getByRole('button', { name, exact: true }).click()
  await pane(page, 'Mô phỏng')
  await expect(art(page, 'F').locator('[data-phase=aqueous]')).toHaveAttribute('data-volume-ml', '20')
  await expect(art(page, 'F').locator('[data-phase=organic]')).toHaveAttribute('data-volume-ml', '40')
  await expect(page.getByTestId('extraction-current-ph')).toHaveText('Chưa đo')
  if (process.env.VECLAB_CHECK_FRAMES) {
    await scene(page).evaluate(node => node.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 2200 }))
    await page.getByRole('region', { name: 'Khu vực thực hành chiết tách', exact: true }).screenshot({ path: testInfo.outputPath('separated-stage.png') })
  }
  await transfer(page, 'F', 'R1', 'aqueous', 10); await pane(page, 'Mô phỏng')
  await expect(scene(page).locator('[data-transfer-method]')).toHaveAttribute('data-transfer-method', 'stopcock')
  await expect(art(page, 'F')).toHaveAttribute('data-volume-ml', '50')
  await expect(art(page, 'R1')).toHaveAttribute('data-volume-ml', '10')
  await transfer(page, 'F', 'R2', 'organic', 10); await pane(page, 'Mô phỏng')
  await expect(scene(page).locator('[data-transfer-method]')).toHaveAttribute('data-transfer-method', 'pour')
  await expect(art(page, 'F')).toHaveAttribute('data-volume-ml', '40')
  await expect(art(page, 'R2')).toHaveAttribute('data-volume-ml', '10')
})

test('new cues replace old ones and a live reduced-motion change settles to the saved state', async ({ page, isMobile }) => {
  await open(page); await add(page, 'S', 'water', 5)
  if (isMobile) await page.waitForTimeout(2800) // No scene has been shown since the accepted action.
  await pane(page, 'Mô phỏng')
  await expect(scene(page)).toHaveAttribute('data-operation', 'add_reagent')
  const first = await scene(page).getAttribute('data-cue-key')
  await add(page, 'S', 'water', 7); await pane(page, 'Mô phỏng')
  await expect(scene(page)).not.toHaveAttribute('data-cue-key', first!)
  await expect(page.getByTestId('extraction-volume-change')).toContainText('S: 45 → 52 mL')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(scene(page)).toHaveAttribute('data-operation', 'idle')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '52')
  expect(await scene(page).evaluate(node => node.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(scene(page)).toHaveAttribute('data-operation', 'idle')
  await pane(page, 'Sổ đo'); await expect(page.getByText('Bản lưu 2', { exact: true })).toBeVisible()
  await page.reload(); await pane(page, 'Mô phỏng')
  await expect(scene(page)).toHaveAttribute('data-operation', 'idle')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '52')
})

test('filtering explains retained filtrate, then drying and measuring show only saved observations', async ({ page }, testInfo) => {
  await open(page); await transfer(page, 'S', 'F', 'all', 40); await add(page, 'F', 'base', 20)
  await group(page, 'program')
  for (const name of ['Trộn', 'Xả áp', 'Để phân lớp']) await page.getByRole('button', { name, exact: true }).click()
  await transfer(page, 'F', 'S', 'aqueous', 20); await add(page, 'S', 'acid', 30)
  await group(page, 'transfer'); await page.getByLabel('Bình nhận', { exact: true }).selectOption('R1')
  await page.getByRole('button', { name: 'Lọc chất rắn → R1', exact: true }).click(); await pane(page, 'Mô phỏng')
  await expect(scene(page).getByTestId('extraction-filter-scene')).toBeVisible()
  await expect(scene(page)).toContainText('Dịch lọc giữ ở S')
  await expect(art(page, 'S')).toHaveAttribute('data-volume-ml', '49.5')
  await expect(art(page, 'R1')).toHaveAttribute('data-volume-ml', '0.5')
  if (process.env.VECLAB_CHECK_FRAMES) await scene(page).screenshot({ path: testInfo.outputPath('filter-scene.png') })
  await select(page, 'R1'); await group(page, 'transfer')
  await page.getByRole('button', { name: 'Làm khô', exact: true }).click(); await pane(page, 'Mô phỏng')
  await expect(art(page, 'R1')).toHaveAttribute('data-volume-ml', '0')
  await expect(art(page, 'R1').locator('[data-solid]')).toBeVisible()
  await group(page, 'results'); await page.getByRole('button', { name: 'Đo pH', exact: true }).click(); await pane(page, 'Mô phỏng')
  await expect(page.getByTestId('extraction-current-ph')).toHaveText('N/A')
  await group(page, 'results'); await page.getByRole('button', { name: 'Cân mẫu', exact: true }).click(); await pane(page, 'Mô phỏng')
  await expect(page.getByTestId('extraction-current-mass')).toHaveText(/\d[\d\s,.]* mg/)
  const reading = await page.getByTestId('extraction-current-mass').innerText()
  await expect(scene(page).getByTestId('extraction-instrument-reading')).toHaveText(reading)
  if (process.env.VECLAB_CHECK_FRAMES) await scene(page).screenshot({ path: testInfo.outputPath('measurement-scene.png') })
  await expect(scene(page)).not.toContainText('Thu hồi')
  await expect(scene(page)).not.toContainText('Độ tinh khiết')
})
