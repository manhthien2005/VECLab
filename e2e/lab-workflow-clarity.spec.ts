import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })
async function pane(page: Page, name: string) {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench' })
  if (await nav.isVisible()) await nav.getByRole('button', { name, exact: true }).click()
}
async function group(page: Page, scenario: 'jar' | 'extraction', id: string) {
  await pane(page, 'Thao tác')
  const details = page.getByTestId(scenario + '-control-' + id)
  if (await details.getAttribute('open') === null) await details.locator('summary').click()
  return details
}
async function blocked(button: Locator, reason: RegExp) {
  await expect(button).toBeDisabled()
  await expect(button).toHaveAccessibleDescription(reason)
  await expect(button).toHaveAttribute('aria-describedby', /\S+/)
  const ids = (await button.getAttribute('aria-describedby'))!.split(' ')
  expect(await button.page().locator('[id]').filter({ hasText: reason }).evaluateAll((nodes, describedIds) => nodes.some(node => describedIds.includes(node.id) && node.getBoundingClientRect().height > 0), ids)).toBe(true)
}
async function extraction(page: Page) {
  await page.goto('/simulate/acid-base-extraction')
  await expect(page.getByRole('button', { name: 'Nộp bài', exact: true })).toBeEnabled()
  await expect(page).toHaveURL(/attempt=/)
}
async function add(page: Page, id: string, amount: number) {
  await pane(page, 'Thao tác'); await page.getByLabel('Bình đang thao tác', { exact: true }).selectOption(id)
  await group(page, 'extraction', 'prepare')
  await page.getByLabel('Dung dịch', { exact: true }).selectOption('water')
  await page.getByLabel('Thể tích dung dịch (mL)', { exact: true }).fill(String(amount))
  await page.getByRole('button', { name: `Thêm ${amount} mL vào ${id}`, exact: true }).click()
}

test('Jar explains blocked steps and identifies every cup that still needs dosing', async ({ page }) => {
  await page.goto('/simulate/jar-test')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/attempt=/)
  await group(page, 'jar', 'dose')
  await blocked(page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc A', exact: true }), /Chuẩn bị cốc A/)
  await group(page, 'jar', 'baseline'); await page.getByRole('button', { name: 'Đo mẫu ban đầu', exact: true }).click()
  await expect(page.getByTestId('jar-initial-ntu')).toHaveText('125 NTU')
  await group(page, 'jar', 'prepare'); await page.getByRole('button', { name: 'Chuẩn bị cốc A', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc A', exact: true }).click()
  await page.getByLabel('Cốc đang thao tác', { exact: true }).selectOption('B')
  await page.getByRole('button', { name: 'Chuẩn bị cốc B', exact: true }).click()
  const program = await group(page, 'jar', 'program')
  await blocked(program.getByRole('button', { name: /^Chạy pha Khuấy nhanh/ }), /cốc B/)
  await program.getByRole('button', { name: 'Cấp phèn cho cốc B', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc B', exact: true }).click()
  await group(page, 'jar', 'program'); await page.getByRole('button', { name: /^Chạy pha Khuấy nhanh/ }).click()
  await page.getByRole('dialog', { name: 'Chạy chương trình chung', exact: true }).getByRole('button', { name: 'Bắt đầu khuấy cả mẻ', exact: true }).click()
  await group(page, 'jar', 'dose')
  await blocked(page.getByRole('button', { name: 'Thêm 50 mg/L vào cốc B', exact: true }), /đã bắt đầu|đã khóa/i)
  const results = await group(page, 'jar', 'results')
  await expect(results).toContainText('Đo lúc này')
  await expect(page.getByRole('button', { name: 'Đo độ đục cuối cốc B', exact: true })).toBeEnabled()
  await blocked(page.getByRole('button', { name: 'Ghi đáp số cốc B', exact: true }), /Nhập.*đáp số/)
})

test('extraction shows why each apparatus action is blocked and how to recover', async ({ page }) => {
  await extraction(page); await pane(page, 'Thao tác')
  await page.getByLabel('Bình đang thao tác', { exact: true }).selectOption('F')
  await group(page, 'extraction', 'program')
  await blocked(page.getByRole('button', { name: 'Trộn', exact: true }), /chưa có dịch/i)
  await group(page, 'extraction', 'transfer')
  await blocked(page.getByRole('button', { name: 'Lọc chất rắn → R1', exact: true }), /Chưa có chất rắn/)
  await blocked(page.getByRole('button', { name: 'Cô dung môi', exact: true }), /Chưa có dung môi hữu cơ/)
  await blocked(page.getByRole('button', { name: 'Làm khô', exact: true }), /chưa có mẫu/i)
  await add(page, 'F', 20)
  await group(page, 'extraction', 'program')
  await blocked(page.getByRole('button', { name: 'Để phân lớp', exact: true }), /Xả áp/)
  await page.getByRole('button', { name: 'Xả áp', exact: true }).click()
  await page.getByRole('button', { name: 'Để phân lớp', exact: true }).click()
  await group(page, 'extraction', 'transfer')
  await blocked(page.getByRole('button', { name: 'Làm khô', exact: true }), /Lọc chất rắn|dịch lưu/)
  await group(page, 'extraction', 'results')
  await blocked(page.getByRole('button', { name: 'Lưu sản phẩm A', exact: true }), /Nhập.*thu hồi/)
  await page.getByLabel('Thu hồi tự tính (%)', { exact: true }).fill('1001')
  await blocked(page.getByRole('button', { name: 'Lưu sản phẩm A', exact: true }), /0.*1000/)
})

test('extraction refuses stale writes with a visible reload path and then continues normally', async ({ page, context }) => {
  await extraction(page)
  const second = await context.newPage(); await second.goto(page.url())
  await expect(second.getByRole('button', { name: 'Nộp bài', exact: true })).toBeEnabled()
  await add(page, 'S', 1)
  await expect(page.getByTestId('extraction-vessel-S')).toContainText('41 mL')
  await add(second, 'S', 5)
  await expect(second.getByRole('alert').filter({ hasText: 'tab khác' })).toBeVisible()
  await blocked(second.getByRole('button', { name: 'Thêm 5 mL vào S', exact: true }), /Tải lại|tab khác/)
  await second.getByRole('button', { name: 'Tải lại lượt', exact: true }).click()
  await expect(second.getByRole('button', { name: 'Nộp bài', exact: true })).toBeEnabled()
  await add(second, 'S', 5)
  await pane(second, 'Mô phỏng'); await expect(second.getByTestId('extraction-vessel-S')).toContainText('46 mL')
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click()
  const confirm = page.getByRole('dialog', { name: 'Xác nhận nộp bài chiết tách', exact: true })
  await confirm.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click()
  await blocked(confirm.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }), /Tải lại/)
  await confirm.getByRole('button', { name: 'Tải lại lượt', exact: true }).click()
  await expect(page.getByTestId('extraction-vessel-S')).toContainText('46 mL')
  await second.close()
})

test('a new extraction attempt clears vessel selection and unsaved product drafts', async ({ page }) => {
  await extraction(page); const oldUrl = page.url(); await pane(page, 'Thao tác')
  await page.getByLabel('Bình đang thao tác', { exact: true }).selectOption('R3')
  await group(page, 'extraction', 'results')
  await page.getByLabel('Bình sản phẩm', { exact: true }).selectOption('R2')
  await page.getByLabel('Thu hồi tự tính (%)', { exact: true }).fill('12.34')
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click()
  await page.getByRole('dialog', { name: 'Xác nhận nộp bài chiết tách', exact: true }).getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click()
  await page.getByRole('dialog', { name: 'Báo cáo chiết tách axit–bazơ', exact: true }).getByRole('link', { name: 'Làm lượt mới', exact: true }).click()
  await expect(page).not.toHaveURL(oldUrl); await expect(page).toHaveURL(/attempt=/)
  await pane(page, 'Thao tác'); await expect(page.getByLabel('Bình đang thao tác', { exact: true })).toHaveValue('S')
  await group(page, 'extraction', 'results')
  await expect(page.getByLabel('Bình sản phẩm', { exact: true })).toHaveValue('R1')
  await expect(page.getByLabel('Thu hồi tự tính (%)', { exact: true })).toHaveValue('')
})

test('extraction recovers an acknowledgement failure without duplicating the saved action or replaying its scene', async ({ page }) => {
  await extraction(page)
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put, get = IDBObjectStore.prototype.get
    let armed = true, failNextRead = false
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args)
      const record = args[0] as { revision?: number }
      if (armed && this.name === 'attempts' && record.revision === 1) {
        armed = false
        this.transaction.addEventListener('complete', () => { failNextRead = true }, { once: true })
      }
      return request
    }
    IDBObjectStore.prototype.get = function (...args) {
      if (failNextRead && this.name === 'attempts') { failNextRead = false; throw new DOMException('One read failed after commit', 'UnknownError') }
      return get.apply(this, args)
    }
  })
  await add(page, 'S', 5)
  const retry = page.getByRole('button', { name: 'Thử lại thao tác', exact: true })
  await expect(retry).toBeVisible()
  await blocked(page.getByRole('button', { name: 'Thêm 5 mL vào S', exact: true }), /Chưa xác nhận/)
  await retry.click(); await expect(retry).toHaveCount(0)
  await expect(page.getByTestId('extraction-vessel-S')).toContainText('45 mL')
  expect(await page.getByTestId('extraction-scene').getAttribute('data-operation')).toBe('idle')
  await pane(page, 'Sổ đo'); await expect(page.getByText('Bản lưu 1', { exact: true })).toBeVisible()
})

test('the theory link has a concise name in both workbenches', async ({ page }) => {
  for (const route of ['jar-test', 'acid-base-extraction']) {
    await page.goto('/simulate/' + route); await pane(page, 'Dụng cụ')
    const link = page.getByRole('link', { name: 'Lý thuyết & cách làm bài', exact: true })
    await expect(link).toBeVisible(); await expect(link).toHaveAttribute('target', '_blank')
  }
})
