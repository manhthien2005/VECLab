import { expect, test } from '@playwright/test'

test('a saved report reopens from the water-treatment lab', async ({ page }) => {
  await page.goto('/simulate/water-treatment')
  await page.getByRole('button', { name: 'Bắt đầu lượt xử lý nước', exact: true }).click()
  await page.getByRole('button', { name: 'Hoàn thành và lưu lượt', exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Báo cáo xử lý nước', exact: true })).toBeVisible()

  await page.goto('/experiments/water-treatment/my-lab')
  await page.getByRole('link', { name: 'Xem báo cáo', exact: true }).click()
  await expect(page).toHaveURL(/\/simulate\/water-treatment\?attempt=.+&report=1$/)
  await expect(page.getByRole('dialog', { name: 'Báo cáo xử lý nước', exact: true })).toBeVisible()
})

test('a changed or reset sample must be stirred again before calculation', async ({ page }) => {
  await page.goto('/simulate/water-treatment')
  await page.getByRole('button', { name: 'Bắt đầu lượt xử lý nước', exact: true }).click()
  const sample = page.getByRole('region', { name: 'Bàn 1 — Pha mẫu nước nhiễm kim loại', exact: true })
  const calculate = sample.getByRole('button', { name: 'Tính toán', exact: true })

  await expect(calculate).toBeDisabled()
  await sample.getByTestId('sample-add-fe').click()
  await sample.getByRole('button', { name: 'Bật khuấy', exact: true }).click()
  await sample.getByRole('button', { name: 'Dừng khuấy', exact: true }).click()
  await expect(calculate).toBeEnabled()

  await sample.getByTestId('sample-add-zn').click()
  await expect(calculate).toBeDisabled()
  await sample.getByRole('button', { name: 'Bật khuấy', exact: true }).click()
  await sample.getByTestId('sample-add-fe').click()
  await sample.getByRole('button', { name: 'Dừng khuấy', exact: true }).click()
  await expect(calculate).toBeDisabled()
  await sample.getByRole('button', { name: 'Bật khuấy', exact: true }).click()
  await sample.getByRole('button', { name: 'Dừng khuấy', exact: true }).click()
  await expect(calculate).toBeEnabled()
  await sample.getByRole('button', { name: 'Đặt lại bàn pha mẫu', exact: true }).click()
  await sample.getByTestId('sample-add-fe').click()
  await expect(calculate).toBeDisabled()
  await sample.getByRole('button', { name: 'Bật khuấy', exact: true }).click()
  await sample.getByRole('button', { name: 'Dừng khuấy', exact: true }).click()
  await expect(calculate).toBeEnabled()
})

// This exercises the current real PHREEQC runtime; it requires the same executable
// as sample preparation in the app. It does not validate the chemistry model.
test('calculation unlocks treatment and discharge reagent buttons remain event driven', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/simulate/water-treatment')
  await page.getByRole('button', { name: 'Bắt đầu lượt xử lý nước', exact: true }).click()
  const sample = page.getByRole('region', { name: 'Bàn 1 — Pha mẫu nước nhiễm kim loại', exact: true })
  await sample.getByTestId('sample-add-fe').click()
  await sample.getByRole('button', { name: 'Bật khuấy', exact: true }).click()
  await sample.getByRole('button', { name: 'Dừng khuấy', exact: true }).click()
  await sample.getByRole('button', { name: 'Tính toán', exact: true }).click()

  const treatment = page.getByRole('region', { name: 'Bàn 2 — Xử lý nước bằng hydroxide', exact: true })
  await expect(treatment).toBeVisible()
  await expect(sample.getByRole('button', { name: 'Tính toán', exact: true })).toBeDisabled()
  await expect(treatment.getByTestId('wt-settle')).toBeDisabled()
  await treatment.getByTestId('wt-add-naoh').click()
  await treatment.getByTestId('wt-toggle-stir').click()
  await treatment.getByTestId('wt-toggle-stir').click()
  await expect(treatment.getByTestId('wt-settle')).toBeEnabled()
  await treatment.getByTestId('wt-settle').click()
  await treatment.getByTestId('wt-filter').click()
  await treatment.getByTestId('wt-lock-ban2').click()

  const discharge = page.getByRole('region', { name: 'Bàn 3 — Cân bằng pH & thải ra môi trường', exact: true })
  const pendingPH = discharge.getByText('pH chưa đo', { exact: true }).locator('..')
  const initial = (await pendingPH.textContent())!
  await discharge.getByTitle('Nhỏ NaOH', { exact: true }).click()
  await expect(pendingPH).not.toHaveText(initial)
  await discharge.getByTitle('Nhỏ HCl', { exact: true }).click()
  await expect(pendingPH).toHaveText(initial)
  await expect(discharge.getByRole('button', { name: 'Đo pH', exact: true })).toBeDisabled()
  expect(errors).toEqual([])
})
