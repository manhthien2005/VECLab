import { expect, test, type Page } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

async function pane(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await nav.getByRole('button', { name, exact: true }).click()
}
async function group(page: Page, id: string) {
  await pane(page, 'Thao tác')
  const target = page.getByTestId('extraction-control-' + id)
  if (await target.getAttribute('open') === null) await target.locator('summary').click()
}
async function select(page: Page, id: string) {
  await pane(page, 'Thao tác')
  await page.getByLabel('Bình đang thao tác', { exact: true }).selectOption(id)
}
async function transfer(page: Page, from: string, to: string, phase: string, amount: string) {
  await select(page, from); await group(page, 'transfer')
  await page.getByLabel('Bình nhận', { exact: true }).selectOption(to)
  await page.getByLabel('Phần dịch cần chuyển', { exact: true }).selectOption(phase)
  await page.getByLabel('Thể tích cần chuyển (mL)', { exact: true }).fill(amount)
  await page.getByRole('button', { name: `Chuyển ${amount} mL → ${to}`, exact: true }).click()
}

test('Jar has stirring feedback by default without an animation-off control or real-time wait', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/simulate/jar-test')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/attempt=/)
  await pane(page, 'Mô phỏng')
  await expect(page.getByLabel('Bỏ qua hoạt ảnh minh họa')).toHaveCount(0)
  await pane(page, 'Thao tác')
  const baseline = page.getByTestId('jar-control-baseline')
  if (await baseline.getAttribute('open') === null) await baseline.locator('summary').click()
  await page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 1')
  const prepare = page.getByTestId('jar-control-prepare')
  if (await prepare.getAttribute('open') === null) await prepare.locator('summary').click()
  await page.getByRole('button', { name: 'Chuẩn bị cốc A', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 2')
  const dose = page.getByTestId('jar-control-dose')
  if (await dose.getAttribute('open') === null) await dose.locator('summary').click()
  await page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc A', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 3')
  const program = page.getByTestId('jar-control-program')
  if (await program.getAttribute('open') === null) await program.locator('summary').click()
  await page.getByRole('button', { name: 'Chạy pha Khuấy nhanh', exact: false }).click()
  await page.getByRole('dialog', { name: 'Chạy chương trình chung' }).getByRole('button', { name: 'Bắt đầu khuấy cả mẻ', exact: true }).click()
  await pane(page, 'Mô phỏng')
  await expect(page.getByText('Thời gian mô phỏng: 60 giây', { exact: true })).toBeVisible()
  await expect.poll(() => page.getByTestId('jar-paddle-A').evaluate(el => getComputedStyle(el).animationName)).not.toBe('none')
})

for (const reduced of [false, true]) test('extraction transfer explains both vessels and preserves committed data, reduced=' + reduced, async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await page.goto('/simulate/acid-base-extraction')
  await expect(page).toHaveURL(/attempt=/)
  await transfer(page, 'S', 'F', 'all', '40')
  if (isMobile) await page.waitForTimeout(3000) // The explanation must survive time spent in controls.
  await pane(page, 'Mô phỏng')
  const scene = page.getByTestId('extraction-transfer-scene')
  await expect(scene).toBeVisible()
  await expect(scene.locator('[data-vessel="S"]')).toHaveCount(1)
  await expect(scene.locator('[data-vessel="F"]')).toHaveCount(1)
  await expect(page.getByTestId('extraction-current-mass')).toHaveText('Chưa đo')
  const stream = page.getByTestId('extraction-liquid-stream')
  if (reduced) expect(await scene.locator('[data-vessel="S"]').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  {
    await scene.scrollIntoViewIfNeeded()
    await expect.poll(() => stream.evaluate(el => getComputedStyle(el).animationName)).not.toBe('none')
    const levels = await scene.evaluate(element => {
      const animations = element.getAnimations({ subtree: true })
      animations.forEach(animation => { animation.pause(); animation.currentTime = 0 })
      const source = element.querySelector('[data-vessel="S"] [data-phase="organic"]')!
      const receiver = element.querySelector('[data-vessel="F"] [data-phase="organic"]')!
      const scale = (node: Element) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m22
      const before = { source: scale(source), receiver: scale(receiver) }
      animations.forEach(animation => { animation.currentTime = 1000 })
      const during = { source: scale(source), receiver: scale(receiver) }
      animations.forEach(animation => animation.play())
      return { before, during }
    })
    expect(levels.before.source).toBe(1)
    expect(levels.before.receiver).toBe(0)
    expect(levels.during.source).toBeLessThan(levels.before.source)
    expect(levels.during.receiver).toBeGreaterThan(levels.before.receiver)
  }
  // A new operation interrupts the visual explanation without adding another chemical action.
  await select(page, 'F'); await group(page, 'prepare')
  await page.getByLabel('Dung dịch', { exact: true }).selectOption('base')
  await page.getByLabel('Thể tích dung dịch (mL)', { exact: true }).fill('20')
  await page.getByRole('button', { name: 'Thêm 20 mL vào F', exact: true }).click()
  await pane(page, 'Mô phỏng')
  await expect(page.getByTestId('extraction-add-stream')).toBeVisible()
  await expect(scene).toHaveCount(0)
  await group(page, 'program')
  for (const label of ['Trộn', 'Xả áp', 'Để phân lớp']) await page.getByRole('button', { name: label, exact: true }).click()
  await transfer(page, 'F', 'S', 'aqueous', '10')
  await pane(page, 'Mô phỏng')
  await expect(scene).toBeVisible()
  await expect(scene).toContainText('F → S')
  await pane(page, 'Sổ đo')
  await expect(page.getByText('Bản lưu 6', { exact: true })).toBeVisible()
  await page.reload(); await pane(page, 'Mô phỏng')
  await expect(scene).toHaveCount(0)
  await expect(page.getByTestId('extraction-current-mass')).toHaveText('Chưa đo')
  await select(page, 'F')
  await expect(page.getByTestId('extraction-control-prepare')).toContainText('200 mL dung tích')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
