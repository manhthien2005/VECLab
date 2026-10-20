import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

const lesson = '/experiments/plastic-density-separation'

test('plastic guide uses the lesson data, actual action labels and responsive equipment layout', async ({ page }) => {
  await page.goto(lesson + '/guide')
  await expect(page).toHaveTitle('Phân loại nhựa: lý thuyết & cách làm bài — VECLab')
  await expect(page.getByRole('navigation', { name: 'Đường dẫn điều hướng', exact: true }).getByRole('link', { name: 'Phân loại nhựa nguyên sinh', exact: true })).toHaveAttribute('href', lesson)
  const guide = page.getByRole('article', { name: 'Hướng dẫn thực hành phân loại nhựa nguyên sinh', exact: true })
  await guide.locator('summary').filter({ hasText: 'Xem sáu mẫu nhựa và khối lượng riêng' }).click()
  await expect(guide).toContainText('0,910 g/cm³')
  await expect(guide).toContainText('0,953 g/cm³')
  await expect(guide).toContainText('1,040 g/cm³')
  await guide.locator('summary').filter({ hasText: 'Xem kết quả tham khảo theo từng mức nồng độ' }).click()
  const ethanol = guide.getByTestId('outcome-ethanol_31')
  await expect(ethanol).toContainText('Nổi: PP')
  await expect(ethanol).toContainText('Chìm: HDPE')
  await expect(guide).toContainText('Nạp mẫu & ghi nhận bước làm ướt')
  await expect(guide).toContainText('Ghi nhận ly tâm phân đoạn & Cân mẫu')
  await expect(guide).toContainText('Hoàn tất lượt thực hành')
  await expect(guide).toContainText('không phải phép đo mới')
  const copy = await guide.innerText()
  for (const phrase of ['HDPE nổi ở 31%', 'telemetry', 'tối ưu nhất', 'do nhóm dự án VECLab thực hiện']) expect(copy).not.toContain(phrase)
  const equipment = page.getByTestId('plastic-equipment')
  const layout = await equipment.evaluate(element => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
    mobile: matchMedia('(max-width:600px)').matches,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }))
  expect(layout.columns).toBe(layout.mobile ? 1 : 3)
  expect(layout.overflow).toBe(false)
  await expect(page.getByRole('heading', { name: 'Tình huống thường gặp', exact: true })).toBeVisible()
})

test('guide keeps a valid attempt in return links and ignores invalid input', async ({ page }) => {
  const attempt = '123e4567-e89b-42d3-a456-426614174000'
  await page.goto(lesson + '/guide?attempt=' + attempt)
  await expect(page.getByRole('link', { name: 'Quay lại lượt đang làm', exact: true })).toHaveAttribute('href', '/simulate/plastic-density-separation?attempt=' + attempt)
  await expect(page.getByRole('link', { name: 'Tiếp tục lượt thực hành', exact: true })).toHaveAttribute('href', '/simulate/plastic-density-separation?attempt=' + attempt)
  await page.goto(lesson + '/guide?attempt=invalid')
  await expect(page.getByRole('link', { name: 'Bắt đầu thực hành', exact: true })).toHaveAttribute('href', '/simulate/plastic-density-separation')
})
