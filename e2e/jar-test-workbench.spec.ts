import { expect, test, type Page, type Locator } from '@playwright/test'

const ROUTE = '/simulate/jar-test'
test.use({ screenshot: 'off', trace: 'off' })

async function activate(target: Locator, keyboard = false) {
  if (keyboard) { await target.focus(); await target.press('Enter') } else await target.click()
}
async function pane(page: Page, label: string, keyboard = false) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await activate(nav.getByRole('button', { name: label, exact: true }), keyboard)
}
async function control(page: Page, id: string, keyboard = false) {
  await pane(page, 'Thao tác', keyboard)
  const group = page.getByTestId('jar-control-' + id)
  if (await group.getAttribute('open') === null) await activate(group.locator('summary'), keyboard)
}
async function begin(page: Page) {
  await page.goto(ROUTE)
  await expect(page.getByTestId('jar-public-goal')).toContainText('giảm độ đục ít nhất 80%')
  await expect(page.getByTestId('jar-public-goal')).toContainText('không phải ngưỡng chất lượng nước')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }).click()
  await expect(page).toHaveURL(/\/simulate\/jar-test\?attempt=[0-9a-f-]{36}$/)
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 0')
  const id = new URL(page.url()).searchParams.get('attempt')
  if (!id) throw new Error('Start did not persist an attempt ID')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  return id
}
async function choose(page: Page, cup: 'A' | 'B') {
  await pane(page, 'Mô phỏng')
  await page.getByRole('button', { name: new RegExp('^Cốc ' + cup + ',') }).click()
}
async function prepare(page: Page, cup: 'A' | 'B', ph: '7' | '9') {
  await choose(page, cup)
  await control(page, 'prepare')
  await page.getByLabel('pH ban đầu của cốc').selectOption(ph)
  await page.getByRole('button', { name: 'Chuẩn bị cốc ' + cup, exact: true }).click()
  await pane(page, 'Mô phỏng')
  await expect(page.getByRole('button', { name: new RegExp('^Cốc ' + cup + ',') })).toHaveAttribute('aria-label', new RegExp('đã chuẩn bị'))
}
async function initial(page: Page) {
  await pane(page, 'Sổ đo')
  await page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true }).click()
  await expect(page.getByTestId('jar-initial-ntu')).toHaveText('125 NTU')
  await expect(page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true })).toBeDisabled()
}
async function dose(page: Page, cup: 'A' | 'B', amount: '50' | '100' | '150') {
  await choose(page, cup)
  await control(page, 'dose')
  await page.getByLabel('Liều tăng (mg/L)').selectOption(amount)
  await page.getByRole('button', { name: 'Thêm ' + amount + ' mg/L vào cốc ' + cup }).click()
}
async function phases(page: Page) {
  for (const [label, elapsed] of [['Khuấy nhanh', 60], ['Khuấy chậm', 1260], ['Lắng', 3060]] as const) {
    await control(page, 'program')
    await page.getByRole('button', { name: 'Chạy pha ' + label, exact: false }).click()
    await pane(page, 'Mô phỏng')
    await expect(page.getByText('Thời gian mô phỏng: ' + elapsed + ' giây')).toBeVisible()
  }
}
async function measure(page: Page, cup: 'A' | 'B') {
  await choose(page, cup)
  await control(page, 'results')
  await page.getByRole('button', { name: 'Đo độ đục cuối cốc ' + cup }).click()
}
async function complete(page: Page) {
  await page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test' }).click()
  await pane(page, 'Sổ đo')
  await expect(page.getByRole('heading', { name: 'Đã hoàn thành và lưu lượt' })).toBeVisible()
}

test.describe('Jar Test — light workbench, persisted guest flow', () => {
  test('collapsible equipment and outer navigation preserve the saved run', async ({ page }) => {
    const id = await begin(page)
    const mobileNav = page.getByRole('navigation', { name: 'Khu vực workbench' })
    if (await mobileNav.isVisible()) {
      await mobileNav.getByRole('button', { name: 'Dụng cụ', exact: true }).click()
      await expect(page.getByText('Mẫu kaolin', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Thu gọn kệ mẫu và dụng cụ' }).click()
      await expect(page.getByText('Mẫu kaolin', { exact: true })).toBeHidden()
    } else {
      await page.getByRole('button', { name: 'Thu gọn kệ mẫu và dụng cụ' }).click()
      await expect(page.getByText('Mẫu kaolin', { exact: true })).toBeHidden()
      await page.getByRole('button', { name: 'Mở kệ mẫu và dụng cụ' }).click()
      await expect(page.getByText('Mẫu kaolin', { exact: true })).toBeVisible()
    }
    await page.getByRole('link', { name: 'Thí nghiệm', exact: true }).click()
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await page.goto(ROUTE + '?attempt=' + id)
    await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 0')
  })
  test('complete two-cup flow, real notebook history and immutable resume', async ({ page }) => {
    test.setTimeout(90_000)
    const id = await begin(page)
    await prepare(page, 'A', '7'); await initial(page)
    await dose(page, 'A', '50'); await dose(page, 'A', '100')
    await expect(page.getByTestId('jar-dose')).toHaveText('150 mg/L')
    await prepare(page, 'B', '9'); await dose(page, 'B', '150')
    await control(page, 'prepare')
    await expect(page.getByLabel('pH ban đầu của cốc')).toHaveValue('9')
    await phases(page)
    await measure(page, 'A'); await expect(page.getByTestId('jar-selected-reading')).toContainText('49,2125 NTU')
    await measure(page, 'B'); await expect(page.getByTestId('jar-selected-reading')).toContainText('16,5125 NTU')
    await expect(page.getByText(/đáp án tối ưu|điểm số|kết quả đúng/i)).toHaveCount(0)
    await page.getByLabel('Phần trăm giảm đục tự tính (%)').fill('86.79')
    await page.getByRole('button', { name: 'Ghi đáp số cốc B' }).click()
    await expect(page.getByText('Đáp số đã lưu: 86.79 %')).toBeVisible()
    await expect(page.getByTestId('jar-submitted-cup')).toHaveText('Chưa chọn')
    await page.getByRole('button', { name: 'Chọn cốc B làm phương án nộp' }).click()
    await expect(page.getByTestId('jar-submitted-cup')).toHaveText('Cốc B')
    await pane(page, 'Sổ đo')
    await expect(page.getByRole('row', { name: /Cốc A/ })).toContainText('49,2125')
    await expect(page.getByRole('row', { name: /Cốc B/ })).toContainText('16,5125')
    await page.getByRole('button', { name: 'Lịch sử thao tác', exact: true }).click()
    await expect(page.getByText('Chuẩn bị cốc', { exact: true })).toHaveCount(2)
    await expect(page.getByText('Cấp phèn', { exact: true })).toHaveCount(4) // three events plus contextual group heading
    await page.reload()
    await expect(page).toHaveURL(new RegExp('attempt=' + id))
    await pane(page, 'Sổ đo')
    await expect(page.getByRole('row', { name: /Cốc B/ })).toContainText('16,5125')
    await control(page, 'results')
    await expect(page.getByTestId('jar-submitted-cup')).toHaveText('Cốc B')
    await complete(page)
    const revision = await page.getByTestId('jar-revision').textContent()
    await page.reload(); await pane(page, 'Sổ đo')
    await expect(page.getByTestId('jar-revision')).toHaveText(revision ?? 'missing revision')
    await expect(page.getByRole('heading', { name: 'Đã hoàn thành và lưu lượt' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test' })).toBeDisabled()
  })
  test('early invalid reading remains N/A after incomplete submission', async ({ page }) => {
    await begin(page); await prepare(page, 'A', '9'); await measure(page, 'A')
    await expect(page.getByTestId('jar-selected-reading')).toContainText('N/A')
    await expect(page.getByTestId('jar-selected-reading')).toContainText('quy trình chưa hoàn tất')
    await complete(page); await page.reload(); await pane(page, 'Sổ đo')
    await expect(page.getByRole('row', { name: /Cốc A/ })).toContainText('N/A')
  })
  test('invalid, missing or repeated attempt URL never creates replacement', async ({ page }) => {
    for (const query of ['broken', '11111111-1111-4111-8111-111111111111', 'one&attempt=two']) {
      await page.goto(ROUTE + '?attempt=' + query)
      await expect(page.getByRole('heading', { name: 'Không tìm thấy lượt thí nghiệm' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' })).toHaveCount(0)
    }
    await page.goto(ROUTE)
    await expect(page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' })).toBeVisible()
  })
  test('keyboard-only selection, accordions and controls use the same domain flow', async ({ page }) => {
    await page.goto(ROUTE)
    await activate(page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }), true)
    await expect(page).toHaveURL(/attempt=/)
    const b = page.getByRole('button', { name: /^Cốc B,/ })
    await activate(b, true); await expect(b).toHaveAttribute('aria-pressed', 'true')
    await control(page, 'prepare', true)
    await page.getByLabel('pH ban đầu của cốc').focus(); await page.getByLabel('pH ban đầu của cốc').press('End')
    await expect(page.getByLabel('pH ban đầu của cốc')).toHaveValue('9')
    await activate(page.getByRole('button', { name: 'Chuẩn bị cốc B', exact: true }), true)
    await pane(page, 'Sổ đo', true); await activate(page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true }), true)
    await expect(page.getByTestId('jar-initial-ntu')).toHaveText('125 NTU')
    await control(page, 'dose', true)
    await page.getByLabel('Liều tăng (mg/L)').focus(); await page.getByLabel('Liều tăng (mg/L)').press('Home')
    await activate(page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc B' }), true)
    await expect(page.getByTestId('jar-dose')).toHaveText('50 mg/L')
    await activate(page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test' }), true)
    await pane(page, 'Sổ đo', true)
    await expect(page.getByRole('heading', { name: 'Đã hoàn thành và lưu lượt' })).toBeVisible()
  })
  test('reduced motion changes neither chemistry nor measured values', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await begin(page); await prepare(page, 'A', '9'); await initial(page); await dose(page, 'A', '150'); await phases(page)
    await measure(page, 'A'); await expect(page.getByTestId('jar-selected-reading')).toContainText('16,5125 NTU')
    await pane(page, 'Mô phỏng'); await page.getByLabel('Bỏ qua hoạt ảnh minh họa').check()
    await control(page, 'results'); await expect(page.getByTestId('jar-selected-reading')).toContainText('16,5125 NTU')
  })
  test('rapid double click never duplicates attempt or dose', async ({ page }) => {
    await page.goto(ROUTE); await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }).dblclick()
    await expect(page).toHaveURL(/attempt=/); await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 0')
    await prepare(page, 'A', '7'); await initial(page); await control(page, 'dose')
    await page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc A' }).dblclick()
    await expect(page.getByTestId('jar-dose')).toHaveText('50 mg/L')
    await page.reload(); await control(page, 'dose'); await expect(page.getByTestId('jar-dose')).toHaveText('50 mg/L')
  })
  test('two tabs: stale dose requires explicit reload, never silently rebased', async ({ context, page }) => {
    const id = await begin(page); await prepare(page, 'A', '7'); await initial(page)
    const other = await context.newPage()
    try {
      await other.goto(ROUTE + '?attempt=' + id); await control(other, 'dose')
      await expect(other.getByTestId('jar-dose')).toHaveText('0 mg/L')
      await dose(page, 'A', '50')
      await other.getByLabel('Liều tăng (mg/L)').selectOption('100')
      await other.getByRole('button', { name: 'Thêm 100 mg/L vào cốc A' }).click()
      await expect(other.getByRole('region', { name: 'Bàn thí nghiệm Jar Test' }).getByRole('alert')).toContainText('Lượt đã thay đổi ở tab khác')
      await expect(other.getByTestId('jar-dose')).toHaveText('0 mg/L')
      await other.getByRole('button', { name: 'Tải lại dữ liệu mới nhất' }).click()
      await expect(other.getByTestId('jar-dose')).toHaveText('50 mg/L')
      await other.getByRole('button', { name: 'Thêm 100 mg/L vào cốc A' }).click()
      await expect(other.getByTestId('jar-dose')).toHaveText('150 mg/L')
    } finally { await other.close() }
  })
})
