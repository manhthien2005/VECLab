import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('lists the agreed experiments, keeps planned lessons honest, and provides contextual navigation', async ({ page }) => {
  await page.goto('/experiments')
  const cards = page.locator('.experiment-library-card')
  await expect(cards.locator('h2')).toHaveText(['Điều chỉnh pH', 'Jar Test', 'Hấp phụ xanh methylene'])
  await expect(cards.locator('.experiment-library-learning')).toHaveCount(3)
  await cards.first().locator('summary').click()
  await expect(cards.first().locator('.experiment-library-preparation')).toContainText('Buret, máy khuấy và máy đo pH.')
  await expect(cards.getByText('Có thể thực hành', { exact: true })).toHaveCount(1)
  await expect(cards.getByText('Đang xây dựng', { exact: true })).toHaveCount(2)
  await expect(cards.locator('a[href^="/simulate/"]')).toHaveCount(1)
  await expect(page.locator('.experiment-library-grid')).not.toContainText('Phân loại nhựa')
  await expect(cards.first()).toContainText('25,00 mL')
  for (const card of await cards.all()) {
    await expect.poll(() => card.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
  await cards.nth(1).locator('summary').click()
  await expect(cards.nth(1).locator('details')).toHaveAttribute('open', '')
  await expect(cards.nth(1)).toContainText('Bài này chưa mở thực hành.')
  const breadcrumb = page.getByRole('navigation', { name: 'Đường dẫn điều hướng', exact: true })
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Thí nghiệm')
  await cards.first().getByRole('link', { name: 'Xem chi tiết — Điều chỉnh pH', exact: true }).click()
  await expect(page).toHaveURL(/\/experiments\/acid-neutralization$/, { timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'Điều chỉnh pH', exact: true })).toBeVisible()
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Điều chỉnh pH')
  await breadcrumb.getByRole('link', { name: 'Thí nghiệm', exact: true }).click()
  await expect(page).toHaveURL(/\/experiments$/)
  await cards.first().getByRole('link', { name: 'Bắt đầu thực hành', exact: true }).click()
  await expect(page).toHaveURL(/\/simulate\/acid-neutralization$/, { timeout: 15000 })
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
