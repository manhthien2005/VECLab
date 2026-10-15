import { test, expect } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('offers the active extraction lesson and keeps adsorption planned', async ({ page }) => {
  await page.goto('/experiments')
  const cards = page.locator('.experiment-library-card')
  await expect(cards.locator('h2')).toHaveText(['Jar Test', 'Chiết tách axit–bazơ', 'Hấp phụ xanh methylene'])
  await expect(cards.locator('a[href^="/simulate/"]')).toHaveCount(2)
  await expect(cards.last()).toContainText('Chưa triển khai')
  await expect(cards.last().locator('a[href^="/simulate/"]')).toHaveCount(0)
  for (const card of await cards.all()) {
    await expect.poll(() => card.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
  const extraction = cards.nth(1)
  await extraction.locator('summary').click()
  await expect(extraction).toContainText('Phễu chiết, bình thu, máy đo pH, bộ lọc và cân.')
  await extraction.getByRole('link', { name: 'Xem chi tiết — Chiết tách axit–bazơ', exact: true }).click()
  await expect(page).toHaveURL(/\/experiments\/acid-base-extraction$/)
  const breadcrumb=page.getByRole('navigation',{name:'Đường dẫn điều hướng',exact:true})
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Chiết tách axit–bazơ')
  await expect(page.getByRole('heading',{name:'Đích của lượt học',exact:true})).toBeVisible()
  await page.getByRole('link',{name:'Bắt đầu thực hành',exact:true}).click()
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
  await expect(page.getByRole('region',{name:'Bàn chiết tách axit–bazơ',exact:true})).toBeVisible()
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
