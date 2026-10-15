import { expect, test, type Page } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })
async function pane(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await nav.getByRole('button', { name, exact: true }).click()
}
async function group(page: Page, id: string) {
  await pane(page, 'Thao tác')
  const section = page.getByTestId('jar-control-' + id)
  if (await section.getAttribute('open') === null) await section.locator('summary').click()
}
async function choose(page: Page, id: string) {
  await pane(page, 'Thao tác')
  await page.getByLabel('Cốc đang thao tác', { exact: true }).selectOption(id)
}
async function begin(page: Page) {
  await page.goto('/simulate/jar-test')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 0')
}

test('measuring one cup keeps the other cups usable before and after the shared program', async ({ page }) => {
  test.setTimeout(90000)
  await begin(page)
  // The fallback reproduces the incumbent flow before the dedicated step is added.
  if (await page.getByTestId('jar-control-baseline').count()) await group(page, 'baseline')
  else await pane(page, 'Sổ đo')
  await page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true }).click()
  for (const [id, ph, dose] of [['A', '7', '50'], ['B', '9', '150'], ['C', '9', '250']]) {
    await choose(page, id!)
    await group(page, 'prepare')
    await page.getByLabel('pH ban đầu của cốc').selectOption(ph!)
    await page.getByRole('button', { name: 'Chuẩn bị cốc ' + id, exact: true }).click()
    await expect(page.getByTestId('jar-dose')).toHaveText('0 mg/L')
    await group(page, 'dose')
    await page.getByLabel('Liều tăng (mg/L)').selectOption(dose!)
    await page.getByRole('button', { name: `Thêm ${dose} mg/L vào cốc ${id}`, exact: true }).click()
    if (id === 'A') {
      await group(page, 'results')
      await page.getByRole('button', { name: 'Đo độ đục cuối cốc A', exact: true }).click()
      await expect(page.getByTestId('jar-selected-reading')).toContainText('N/A')
    }
  }
  for (const label of ['Khuấy nhanh', 'Khuấy chậm', 'Lắng']) {
    await group(page, 'program')
    await page.getByRole('button', { name: 'Chạy pha ' + label, exact: false }).click()
    const confirmation = page.getByRole('dialog', { name: 'Chạy chương trình chung', exact: true })
    if (await confirmation.isVisible()) await confirmation.getByRole('button', { name: 'Bắt đầu khuấy cả mẻ', exact: true }).click()
  }
  for (const [id, answer] of [['A', '51.29'], ['B', '86.79'], ['C', '80']]) {
    await choose(page, id!)
    await group(page, 'results')
    const measure = page.getByRole('button', { name: 'Đo độ đục cuối cốc ' + id, exact: true })
    await expect(measure).toBeEnabled()
    await measure.click()
    await expect(page.getByTestId('jar-selected-reading')).not.toContainText('N/A')
    await page.getByLabel('Phần trăm giảm đục tự tính (%)').fill(answer!)
    await page.getByRole('button', { name: 'Ghi đáp số cốc ' + id, exact: true }).click()
  }
  await choose(page, 'B'); await group(page, 'results')
  await page.getByRole('button', { name: 'Chọn cốc B làm phương án nộp', exact: true }).click()
  await page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test', exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click()
  const report = page.getByRole('dialog', { name: 'Báo cáo Jar Test', exact: true })
  await expect(report.getByRole('heading', { name: 'Đạt mục tiêu bài thực hành', exact: true })).toBeVisible()
  await expect(report.getByRole('table', { name: 'Kết quả từng cốc', exact: true }).getByRole('row')).toHaveCount(4)
  await expect(report.getByRole('figure', { name: /^Hiệu suất cốc / })).toHaveCount(3)
  await expect(report.getByRole('region', { name: 'Nhận xét từ các cốc đã đo', exact: true })).toContainText('cốc B dùng ít hơn 100 mg/L')
  await expect(report.getByRole('region', { name: 'Độ đục trước và sau xử lý', exact: true })).toContainText('không quá 25')
  await expect(report).toContainText('bạn nộp 80%, đối chiếu từ số đo là 78,06%')
  expect(await report.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true)
  const persisted = await report.getByRole('table', { name: 'Kết quả từng cốc', exact: true }).textContent()
  await page.reload()
  await page.getByRole('button', { name: 'Báo cáo Jar Test', exact: true }).click()
  await expect(report.getByRole('table', { name: 'Kết quả từng cốc', exact: true })).toHaveText(persisted!)
  await report.getByRole('button', { name: 'Xem sổ đo', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Dữ liệu đã ghi', exact: true })).toContainText('3/3')
  const history = page.getByRole('region', { name: 'Sổ đo Jar Test', exact: true }).locator('details')
  await history.locator('summary').click()
  await expect(history.getByRole('listitem')).toHaveCount(6)
  await expect(history.getByRole('button', { name: 'Cũ hơn', exact: true })).toBeEnabled()
})

test('initial measurement is a visible dedicated step and the notebook has no measurement action', async ({ page }) => {
  await begin(page)
  await group(page, 'baseline')
  await expect(page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true })).toBeVisible()
  await pane(page, 'Sổ đo')
  await expect(page.getByRole('region', { name: 'Sổ đo Jar Test', exact: true }).getByRole('button', { name: 'Đo mẫu ban đầu', exact: true })).toHaveCount(0)
  await expect(page.getByTestId('jar-initial-ntu')).toHaveText('Chưa đo')
  await group(page, 'program')
  await expect(page.getByRole('button', { name: /Chạy pha Khuấy nhanh/ })).toBeDisabled()
})

test('incomplete report names missing steps and never invents a zero reading', async ({ page }) => {
  await begin(page)
  await group(page, 'prepare')
  await page.getByRole('button', { name: 'Chuẩn bị cốc A', exact: true }).click()
  await group(page, 'results')
  await page.getByRole('button', { name: 'Đo độ đục cuối cốc A', exact: true }).click()
  await page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test', exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click()
  const report = page.getByRole('dialog', { name: 'Báo cáo Jar Test', exact: true })
  const missing = report.getByRole('region', { name: 'Thông tin còn thiếu trong báo cáo', exact: true })
  await expect(missing).toContainText('Bước 1')
  await expect(missing).toContainText('Bước 5 · Cốc A')
  await expect(missing).toContainText('Bước 6 · Cốc A')
  await expect(report.getByRole('img', { name: 'Cốc A: N/A; mục tiêu 80%', exact: true })).toBeVisible()
  await expect(report).toContainText('thao tác #2')
  await expect(report).not.toContainText('0 NTU')
})

test('guide explains inputs, outputs, terminology and the shared batch with readable layout', async ({ page }) => {
  await page.goto('/experiments/jar-test/guide')
  for (const name of ['Đầu vào của bài', 'Đầu ra cần ghi', 'Mục đích & kết quả cần đạt', 'Thuật ngữ cần biết', 'Quy trình trên workbench']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('không quá 25 NTU')
  await expect(page.getByRole('main')).toContainText('Chọn cốc A không làm chương trình chỉ chạy riêng A.')
  await expect(page.locator('#jar-procedure + p')).toContainText('đo và ghi từng cốc riêng')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
