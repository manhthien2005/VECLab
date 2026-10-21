import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('offers five active lessons and opens extraction from the library', async ({ page }) => {
  await page.goto('/experiments')
  const cards = page.locator('.experiment-library-card')
  await expect(cards.locator('h2')).toHaveText(['Jar Test', 'Xử lý nước nhiễm kim loại Fe, Zn và Pb', 'Chiết tách axit–bazơ', 'Xà phòng hóa', 'Phân loại nhựa nguyên sinh'])
  await expect(cards.locator('a[href^="/simulate/"]')).toHaveCount(5)
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded()
    await expect.poll(() => card.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
  const extraction = cards.nth(2)
  await extraction.locator('summary').click()
  await expect(extraction).toContainText('Phễu chiết, bình thu, máy đo pH, bộ lọc và cân.')
  await extraction.getByRole('link', { name: 'Xem chi tiết — Chiết tách axit–bazơ', exact: true }).click()
  await expect(page).toHaveURL(/\/experiments\/acid-base-extraction$/, { timeout: 15000 })
  const breadcrumb=page.getByRole('navigation',{name:'Đường dẫn điều hướng',exact:true})
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Chiết tách axit–bazơ')
  await expect(page.getByRole('heading',{name:'Mục tiêu & kết quả cần đạt',exact:true})).toBeVisible()
  await page.getByRole('link',{name:'Bắt đầu thực hành',exact:true}).click()
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/, { timeout: 15000 })
  await expect(page.getByRole('region',{name:'Bàn chiết tách axit–bazơ',exact:true})).toBeVisible()
})

test('opens the plastic lesson, guide and existing workbench from the library', async ({ page }) => {
  await page.goto('/experiments')
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Phân loại nhựa nguyên sinh', exact: true }) })
  await expect(card).toContainText('Có thể thực hành · Lưu trên trình duyệt')
  await expect(card.getByRole('link', { name: 'Bắt đầu thực hành', exact: true })).toHaveAttribute('href', '/simulate/plastic-density-separation')
  await card.locator('summary').click()
  await expect(card).toContainText('Bể pilot, máy ly tâm và cân')
  await card.getByRole('link', { name: 'Xem chi tiết — Phân loại nhựa nguyên sinh', exact: true }).click()
  await expect(page).toHaveURL(/\/experiments\/plastic-density-separation$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Phân loại nhựa nguyên sinh', exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Đường dẫn điều hướng', exact: true }).locator('[aria-current="page"]')).toHaveText('Phân loại nhựa nguyên sinh')
  await expect(page.getByRole('heading', { name: 'Mục tiêu bài thực hành', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mẫu đầu vào', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Điều kiện khảo sát', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'An toàn & phạm vi', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nguồn khoa học', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('link', { name: 'Lý thuyết & hướng dẫn chi tiết', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Phân loại nhựa: lý thuyết & cách làm bài', exact: true })).toBeVisible({ timeout: 15000 })
  await page.getByRole('navigation', { name: 'Đường dẫn điều hướng', exact: true }).getByRole('link', { name: 'Phân loại nhựa nguyên sinh', exact: true }).click()
  await expect(page).toHaveURL(/\/experiments\/plastic-density-separation$/, { timeout: 15000 })
  await page.getByRole('link', { name: 'Bắt đầu thực hành', exact: true }).click()
  await expect(page).toHaveURL(/\/simulate\/plastic-density-separation$/, { timeout: 15000 })
  await expect(page.getByRole('button', { name: 'Bắt đầu thí nghiệm Phân loại nhựa', exact: true })).toBeVisible()
})

test('library typography, tags and cards fit in both themes and enlarged text', async ({ page }) => {
  await page.goto('/experiments')
  const arrangement = await page.locator('.experiment-library-card').first().evaluate(card => {
    const image = card.querySelector('.experiment-library-image')!.getBoundingClientRect()
    const body = card.querySelector('.experiment-library-body')!.getBoundingClientRect()
    return matchMedia('(max-width: 58rem)').matches ? image.bottom <= body.top + 1 : image.right <= body.left + 1
  })
  expect(arrangement).toBe(true)
  for (const mode of ['light', 'dark']) {
    if (mode === 'dark') await page.getByRole('button', { name: 'Chuyển sang giao diện tối', exact: true }).click()
    await page.evaluate(() => { document.documentElement.style.fontSize = '150%' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const overflowing = await page.locator('.experiment-library-card, .experiment-library-tags, .experiment-library-facts dd, .page-breadcrumbs').evaluateAll(nodes => nodes.some(node => node.scrollWidth > node.clientWidth + 1))
    expect(overflowing).toBe(false)
    await expect(page.getByRole('heading', { name: 'Thí nghiệm', exact: true })).toBeVisible()
  }
})
