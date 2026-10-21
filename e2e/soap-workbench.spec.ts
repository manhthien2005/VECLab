import { expect, test, type Page } from '@playwright/test'

async function pane(page: Page, name: 'Thao tác' | 'Sổ đo') {
  const nav = page.getByRole('navigation', { name: 'Khu vực workbench', exact: true })
  if (await nav.isVisible()) await nav.getByRole('button', { name, exact: true }).click()
}

async function select(page: Page, vessel: string) {
  await pane(page, 'Thao tác')
  await page.getByLabel('Cốc đang chọn', { exact: true }).selectOption(vessel)
}

async function action(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click()
  await expect(page.getByRole('status', { includeHidden: true }).filter({ hasText: 'Đã lưu trên thiết bị' })).toHaveCount(1)
}

test('soap recipe, measurements and report survive reload and My Lab navigation', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|Minified React error #4(18|23|25)/i.test(message.text())) errors.push(message.text())
  })
  await page.goto('/simulate/cold-process-soap')
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
  const attemptUrl = page.url()
  await pane(page, 'Sổ đo')
  await expect(page.getByText('Chưa có mẫu thử.', { exact: true })).toBeVisible()

  // Oil choice comes from the saved projection, including after a reload.
  await select(page, 'O')
  for (const oil of ['coconut', 'palm', 'olive']) {
    await page.getByLabel('Loại dầu', { exact: true }).selectOption(oil)
    await expect(page.getByLabel('Loại dầu', { exact: true })).toHaveValue(oil)
  }
  await page.reload()
  await select(page, 'O')
  await expect(page.getByLabel('Loại dầu', { exact: true })).toHaveValue('olive')
  await page.getByLabel('Dầu (mL)', { exact: true }).fill('549.45')
  await action(page, 'Rót dầu')
  await expect(page.getByLabel('Loại dầu', { exact: true })).toBeDisabled()

  await select(page, 'W')
  await page.getByLabel('Nước (mL)', { exact: true }).fill('175')
  await action(page, 'Rót nước')
  await page.getByLabel('NaOH (g)', { exact: true }).fill('64.6')
  await action(page, 'Rót kiềm (NaOH)')
  await action(page, 'Nguội kiềm')
  await select(page, 'M')
  await page.getByLabel('Kiềm (mL)', { exact: true }).fill('205.33')
  await action(page, 'Rót kiềm')
  await page.getByLabel('Dầu (mL)', { exact: true }).fill('549.45')
  await action(page, 'Rót dầu')
  await action(page, 'Khuấy máy')
  await action(page, 'Chờ dung dịch đặc lại')
  await page.reload()
  await select(page, 'D')
  for (const name of ['Đổ khuôn', 'Chờ 24 giờ', 'Tháo khuôn', 'Đợi 4 tuần', 'Đo pH và cân']) await action(page, name)

  await pane(page, 'Sổ đo')
  const sample = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Mẫu 1', exact: true }) })
  await expect(sample).toContainText('pH 9,4')
  await expect(sample).toContainText('606,6 g')
  await expect(sample).toContainText('Đạt')
  const measured = await sample.innerText()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await pane(page, 'Sổ đo')
  await expect(sample).toHaveText(measured.replace(/\s+/g, ' '), { useInnerText: true })

  await select(page, 'D')
  await page.getByRole('button', { name: 'Hoàn thành thí nghiệm', exact: true }).click()
  const report = page.getByRole('dialog', { name: 'Kết quả thí nghiệm xà phòng', exact: true })
  await expect(report.getByRole('heading', { name: 'Thí nghiệm đạt', exact: true })).toBeVisible()
  const table = report.getByRole('table', { name: 'Mẫu 1 · Ô liu · Đạt', exact: true })
  const results = await table.innerText()
  await page.keyboard.press('Escape')
  await expect(report).not.toBeVisible()
  await page.goto('/lab')
  const lab = page.getByRole('region', { name: /^Xà phòng hóa/ })
  await expect(lab).toContainText('Đã hoàn thành')
  await lab.getByRole('link', { name: 'Xem báo cáo', exact: true }).click()
  await expect(page).toHaveURL(attemptUrl + '&view=report')
  await expect(report).toBeVisible()
  expect(await table.innerText()).toBe(results)
  expect(errors).toEqual([])
})

test('wrong pouring order records the hazard and allows a failure report', async ({ page }) => {
  await page.goto('/simulate/cold-process-soap')
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
  await select(page, 'W')
  await page.getByLabel('NaOH (g)', { exact: true }).fill('20')
  await action(page, 'Rót kiềm (NaOH)')
  await page.getByLabel('Nước (mL)', { exact: true }).fill('100')
  await action(page, 'Rót nước')
  await expect(page.getByRole('button', { name: 'Rót nước', exact: true })).toBeDisabled()
  await page.reload()
  await pane(page, 'Thao tác')
  await page.getByRole('button', { name: 'Hoàn thành thí nghiệm', exact: true }).focus()
  await page.keyboard.press('Enter')
  const report = page.getByRole('dialog', { name: 'Kết quả thí nghiệm xà phòng', exact: true })
  await expect(report.getByRole('heading', { name: 'Thí nghiệm thất bại', exact: true })).toBeVisible()
  await expect(report).toContainText('Không có bánh thành phẩm.')
  await expect(report.getByRole('table')).toHaveCount(0)
})
