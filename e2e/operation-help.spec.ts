import { expect, test, type Page } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

async function pane(page: Page) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await nav.getByRole('button', { name: 'Thao tác', exact: true }).click()
}

async function group(page: Page, lesson: 'jar' | 'extraction', id: string) {
  await pane(page)
  const target = page.getByTestId(lesson + '-control-' + id)
  if (await target.getAttribute('open') === null) await target.locator('summary').click()
  return target
}

for (const lesson of [
  { path: 'jar-test', last: 'jar-step-submit', count: 8 },
  { path: 'acid-base-extraction', last: 'extraction-step-declare', count: 8 },
]) {
  test('guide exposes navigable step anchors: ' + lesson.path, async ({ page }) => {
    await page.goto('/experiments/' + lesson.path + '/guide')
    const contents = page.getByRole('navigation', { name: 'Tra nhanh các bước' })
    await expect(contents).toBeVisible()
    const links = contents.getByRole('link')
    await expect(links).toHaveCount(lesson.count)
    for (const link of await links.all()) {
      const href = await link.getAttribute('href')
      expect(href).toMatch(/^#[a-z-]+$/)
      await expect(page.locator(href!)).toHaveCount(1)
    }
    await contents.locator('a[href="#' + lesson.last + '"]').click()
    await expect(page).toHaveURL(new RegExp('#' + lesson.last + '$'))
    await expect(page.locator('#' + lesson.last)).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })
}

test('Jar help preserves the draft, selected cup and revision while reading a separate guide', async ({ page, context }) => {
  await page.goto('/simulate/jar-test')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
  const attempt = new URL(page.url()).searchParams.get('attempt')!
  const prepare = await group(page, 'jar', 'prepare')
  await prepare.getByLabel('pH ban đầu của cốc').selectOption('9')
  await prepare.getByRole('button', { name: 'Chuẩn bị cốc A', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 1')
  const results = await group(page, 'jar', 'results')
  await results.getByLabel('Phần trăm giảm đục tự tính (%)').fill('12.34')
  for (const [id, label, anchor] of [
    ['baseline', 'Cách đo mẫu ban đầu', 'jar-step-baseline'],
    ['prepare', 'Cách chuẩn bị cốc', 'jar-step-prepare'],
    ['dose', 'Cách cấp phèn', 'jar-step-dose'],
    ['program', 'Cách chạy cả mẻ', 'jar-step-program'],
    ['results', 'Cách đo và ghi kết quả', 'jar-step-measure'],
  ] as const) {
    const current = await group(page, 'jar', id)
    const trigger = current.getByRole('button', { name: label, exact: true })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.focus()
    await trigger.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(current).toHaveAttribute('open', '')
    const link = current.getByRole('link', { name: 'Đọc hướng dẫn đầy đủ — mở tab mới', exact: true })
    await expect(link).toHaveAttribute('href', '/experiments/jar-test/guide?attempt=' + attempt + '#' + anchor)
    if (id === 'results') {
      const opened = context.waitForEvent('page')
      await link.click()
      const guide = await opened
      await guide.waitForURL('**/guide?attempt=' + attempt + '#' + anchor)
      await expect(guide.locator('#' + anchor)).toBeInViewport()
      await guide.close()
      await expect(results.getByLabel('Phần trăm giảm đục tự tính (%)')).toHaveValue('12.34')
    }
    await trigger.focus()
    await trigger.press('Space')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
    await expect(link).toBeHidden()
  }
  await expect(page.getByLabel('Cốc đang thao tác', { exact: true })).toHaveValue('A')
  await expect(results.getByLabel('Phần trăm giảm đục tự tính (%)')).toHaveValue('12.34')
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 1')
})

test('extraction help keeps independent product drafts and opens the matching guide without saving an action', async ({ page, context }) => {
  await page.goto('/simulate/acid-base-extraction')
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
  const attempt = new URL(page.url()).searchParams.get('attempt')!
  const results = await group(page, 'extraction', 'results')
  await results.getByLabel('Thu hồi tự tính (%)', { exact: true }).fill('12.34')
  await results.getByLabel('Bình sản phẩm', { exact: true }).selectOption('R3')
  await results.getByLabel('Sản phẩm cần khai báo', { exact: true }).selectOption('B')
  await results.getByLabel('Thu hồi tự tính (%)', { exact: true }).fill('56.78')
  for (const [id, label, anchor] of [
    ['prepare', 'Cách cấp dung dịch', 'extraction-step-add'],
    ['program', 'Cách trộn và phân lớp', 'extraction-step-mix'],
    ['transfer', 'Cách chuyển dịch', 'extraction-step-transfer'],
    ['transfer', 'Cách thu chất rắn', 'extraction-step-isolate'],
    ['results', 'Cách đo pH và cân', 'extraction-step-measure'],
    ['results', 'Cách khai báo sản phẩm', 'extraction-step-declare'],
  ] as const) {
    const current = await group(page, 'extraction', id)
    const trigger = current.getByRole('button', { name: label, exact: true })
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(current).toHaveAttribute('open', '')
    const panelId = await trigger.getAttribute('aria-controls')
    const panel = current.locator('[id="' + panelId + '"]')
    const link = panel.getByRole('link', { name: 'Đọc hướng dẫn đầy đủ — mở tab mới', exact: true })
    await expect(link).toHaveAttribute('href', '/experiments/acid-base-extraction/guide?attempt=' + attempt + '#' + anchor)
    if (anchor === 'extraction-step-declare') {
      const opened = context.waitForEvent('page')
      await link.click()
      const guide = await opened
      await guide.waitForURL('**/guide?attempt=' + attempt + '#' + anchor)
      await expect(guide.locator('#' + anchor)).toBeInViewport()
      await guide.close()
    }
    await trigger.click()
    await expect(panel).toBeHidden()
  }
  await expect(results.getByLabel('Thu hồi tự tính (%)', { exact: true })).toHaveValue('56.78')
  await results.getByLabel('Sản phẩm cần khai báo', { exact: true }).selectOption('A')
  await expect(results.getByLabel('Thu hồi tự tính (%)', { exact: true })).toHaveValue('12.34')
  await expect(results.getByLabel('Bình sản phẩm', { exact: true })).toHaveValue('R3')
  await expect(page.getByLabel('Bình đang thao tác', { exact: true })).toHaveValue('S')
  await expect(page.getByText('Bản lưu 0', { exact: true })).toHaveCount(1)
})
