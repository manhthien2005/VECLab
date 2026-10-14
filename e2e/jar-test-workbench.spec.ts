import { expect, test, type Page } from '@playwright/test'

const ROUTE = '/simulate/jar-test'

async function begin(page: Page): Promise<string> {
  await page.goto(ROUTE)
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }).click()
  await expect(page).toHaveURL(/\/simulate\/jar-test\?attempt=[0-9a-f-]{36}$/)
  const id = new URL(page.url()).searchParams.get('attempt')
  if (!id) throw new Error('Start did not persist an attempt ID')
  await expect(page.getByText('Revision 0')).toBeVisible()
  return id
}

async function prepare(page: Page, cup: 'A' | 'B', ph: '7' | '9'): Promise<void> {
  await page.getByRole('button', { name: new RegExp('Cốc ' + cup + ',') }).click()
  await page.getByLabel('pH ban đầu của cốc').selectOption(ph)
  await page.getByRole('button', { name: 'Chuẩn bị cốc ' + cup }).click()
  await expect(page.getByRole('button', { name: new RegExp('Cốc ' + cup + ', đã chuẩn bị') })).toBeVisible()
}

async function dose(page: Page, cup: 'A' | 'B', increment: '50' | '100' | '150'): Promise<void> {
  await page.getByRole('button', { name: new RegExp('Cốc ' + cup + ',') }).click()
  await page.getByLabel('Liều tăng (mg/L)').selectOption(increment)
  await page.getByRole('button', { name: 'Thêm ' + increment + ' mg/L vào cốc ' + cup }).click()
}

async function runPhases(page: Page): Promise<void> {
  for (const [label, elapsed] of [
    ['Khuấy nhanh', 60],
    ['Khuấy chậm', 1260],
    ['Lắng', 3060],
  ] as const) {
    await page.getByRole('button', { name: 'Chạy pha ' + label, exact: false }).click()
    await expect(page.getByText('Thời gian mô phỏng: ' + elapsed + ' giây')).toBeVisible()
  }
}

test.describe('Jar Test 2D — persisted guest workbench', () => {
  test('complete two-cup model flow, saved values and immutable resume', async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    const id = await begin(page)
    await prepare(page, 'A', '7')
    await page.getByRole('button', { name: 'Đo mẫu ban đầu' }).click()
    await expect(page.getByTestId('jar-initial-ntu')).toHaveText('125 NTU')
    await dose(page, 'A', '50')
    await dose(page, 'A', '100')
    await expect(page.getByTestId('jar-dose')).toHaveText('150 mg/L')
    await prepare(page, 'B', '9')
    await dose(page, 'B', '150')

    await page.screenshot({ path: testInfo.outputPath('jar-desktop-setup.png'), fullPage: true })
    await runPhases(page)

    await page.getByRole('button', { name: /^Cốc A,/ }).click()
    await page.getByRole('button', { name: 'Đo độ đục cuối cốc A' }).click()
    await expect(page.getByTestId('jar-selected-reading')).toContainText('49,2125 NTU')
    await page.getByRole('button', { name: /^Cốc B,/ }).click()
    await page.getByRole('button', { name: 'Đo độ đục cuối cốc B' }).click()
    await expect(page.getByTestId('jar-selected-reading')).toContainText('16,5125 NTU')

    // Expected removal/score/reference are never projected into learner UI.
    await expect(page.getByRole('row', { name: /Cốc A/ })).toContainText('49,2125')
    await expect(page.getByRole('row', { name: /Cốc B/ })).toContainText('16,5125')
    await expect(page.getByText(/đáp án tối ưu|điểm số|kết quả đúng/i)).toHaveCount(0)
    await page.getByLabel('Phần trăm giảm đục tự tính (%)').fill('86.79')
    await page.getByRole('button', { name: 'Ghi đáp số cốc B' }).click()
    await expect(page.getByText('Đáp số đã lưu: 86.79 %')).toBeVisible()
    await expect(page.getByTestId('jar-submitted-cup')).toHaveText('Chưa chọn')
    await page.getByRole('button', { name: 'Chọn cốc B làm phương án nộp' }).click()
    await expect(page.getByTestId('jar-submitted-cup')).toHaveText('Cốc B')

    await page.reload()
    await expect(page).toHaveURL(new RegExp('attempt=' + id))
    await expect(page.getByText('Thời gian mô phỏng: 3060 giây')).toBeVisible()
    await expect(page.getByRole('row', { name: /Cốc A/ })).toContainText('150')
    await expect(page.getByRole('row', { name: /Cốc B/ })).toContainText('16,5125')
    await expect(page.getByTestId('jar-submitted-cup')).toHaveText('Cốc B')

    await page.screenshot({ path: testInfo.outputPath('jar-measured-before-completion.png'), fullPage: true })
    await page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test' }).click()
    await expect(page.getByRole('heading', { name: 'Đã hoàn thành và lưu lượt' })).toBeVisible()
    const revision = await page.getByText(/^Revision \d+$/).textContent()
    await page.reload()
    await expect(page.getByText(revision ?? 'missing revision')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Đã hoàn thành và lưu lượt' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test' })).toHaveCount(0)
    await page.screenshot({ path: testInfo.outputPath('jar-completed.png'), fullPage: true })
  })

  test('early invalid reading and incomplete submission retain N/A', async ({ page }) => {
    await begin(page)
    await prepare(page, 'A', '9')
    await page.getByRole('button', { name: 'Đo độ đục cuối cốc A' }).click()
    await expect(page.getByTestId('jar-selected-reading')).toContainText('N/A')
    await expect(page.getByTestId('jar-selected-reading')).toContainText('quy trình chưa hoàn tất')
    await expect(page.getByRole('row', { name: /Cốc A/ })).toContainText('N/A')
    await page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test' }).click()
    await expect(page.getByRole('heading', { name: 'Đã hoàn thành và lưu lượt' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row', { name: /Cốc A/ })).toContainText('N/A')
  })

  test('invalid, missing or repeated attempt URL never creates replacement', async ({ page }) => {
    await page.goto(ROUTE + '?attempt=broken')
    await expect(page.getByRole('heading', { name: 'Không tìm thấy lượt thí nghiệm' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' })).toHaveCount(0)
    await page.goto(ROUTE + '?attempt=11111111-1111-4111-8111-111111111111')
    await expect(page.getByRole('heading', { name: 'Không tìm thấy lượt thí nghiệm' })).toBeVisible()
    await page.goto(ROUTE + '?attempt=one&attempt=two')
    await expect(page.getByRole('heading', { name: 'Không tìm thấy lượt thí nghiệm' })).toBeVisible()
    await page.goto(ROUTE)
    await expect(page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' })).toBeVisible()
  })

  test('keyboard-only control and selection use the same domain flow', async ({ page }) => {
    await page.goto(ROUTE)
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/attempt=/)
    const vesselB = page.getByRole('button', { name: /^Cốc B,/ })
    await vesselB.focus()
    await page.keyboard.press('Enter')
    await expect(vesselB).toHaveAttribute('aria-pressed', 'true')
    const ph = page.getByLabel('pH ban đầu của cốc')
    await ph.focus()
    await page.keyboard.press('End')
    await expect(ph).toHaveValue('9')
    const prepareB = page.getByRole('button', { name: 'Chuẩn bị cốc B' })
    await prepareB.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /^Cốc B, đã chuẩn bị/ })).toBeVisible()
    const measure = page.getByRole('button', { name: 'Đo mẫu ban đầu' })
    await measure.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('jar-initial-ntu')).toHaveText('125 NTU')
    const doseSelect = page.getByLabel('Liều tăng (mg/L)')
    await doseSelect.focus()
    await page.keyboard.press('Home')
    await expect(doseSelect).toHaveValue('50')
    const doseButton = page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc B' })
    await doseButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('jar-dose')).toHaveText('50 mg/L')
    const complete = page.getByRole('button', { name: 'Hoàn thành và lưu lượt Jar Test' })
    await complete.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Đã hoàn thành và lưu lượt' })).toBeVisible()
  })

  test('reduced motion does not change chemistry or require waiting', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await begin(page)
    await prepare(page, 'A', '9')
    await page.getByRole('button', { name: 'Đo mẫu ban đầu' }).click()
    await dose(page, 'A', '150')
    await runPhases(page)
    await page.getByRole('button', { name: 'Đo độ đục cuối cốc A' }).click()
    await expect(page.getByTestId('jar-selected-reading')).toContainText('16,5125 NTU')
    await page.getByLabel('Bỏ qua hoạt ảnh minh họa').check()
    await expect(page.getByTestId('jar-selected-reading')).toContainText('16,5125 NTU')
  })

  test('rapid double click does not create duplicate attempt or increment', async ({ page }) => {
    await page.goto(ROUTE)
    await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }).dblclick()
    await expect(page).toHaveURL(/attempt=/)
    await expect(page.getByText('Revision 0')).toBeVisible()
    await prepare(page, 'A', '7')
    await page.getByRole('button', { name: 'Đo mẫu ban đầu' }).click()
    const button = page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc A' })
    await button.dblclick()
    await expect(page.getByTestId('jar-dose')).toHaveText('50 mg/L')
    await page.reload()
    await expect(page.getByTestId('jar-dose')).toHaveText('50 mg/L')
  })

  test('two tabs: stale revision never silently rebases a dose', async ({ context, page }) => {
    const id = await begin(page)
    await prepare(page, 'A', '7')
    await page.getByRole('button', { name: 'Đo mẫu ban đầu' }).click()
    const other = await context.newPage()
    try {
      await other.goto(ROUTE + '?attempt=' + id)
      await expect(other.getByTestId('jar-dose')).toHaveText('0 mg/L')
      await dose(page, 'A', '50')
      await expect(page.getByTestId('jar-dose')).toHaveText('50 mg/L')
      await other.getByLabel('Liều tăng (mg/L)').selectOption('100')
      await other.getByRole('button', { name: 'Thêm 100 mg/L vào cốc A' }).click()
      await expect(other.getByRole('alert')).toContainText('Lượt đã thay đổi ở tab khác')
      await expect(other.getByTestId('jar-dose')).toHaveText('0 mg/L')
      await other.getByRole('button', { name: 'Tải lại dữ liệu mới nhất' }).click()
      await expect(other.getByTestId('jar-dose')).toHaveText('50 mg/L')
      await other.getByRole('button', { name: 'Thêm 100 mg/L vào cốc A' }).click()
      await expect(other.getByTestId('jar-dose')).toHaveText('150 mg/L')
    } finally {
      await other.close()
    }
  })
})
