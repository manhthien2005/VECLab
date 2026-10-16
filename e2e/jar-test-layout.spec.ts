import { expect, test } from '@playwright/test'

test.use({ screenshot: 'off', trace: 'off' })

test('Jar layout keeps the notebook and apparatus next to their preceding content', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium') await page.setViewportSize({ width: 1763, height: 900 })
  await page.goto('/simulate/jar-test')
  await expect(page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true })).toBeVisible()
  const simulation = page.locator('[data-workbench-area="simulation"]')
  const notebook = page.locator('[data-workbench-area="notebook"]')
  const mobile = await page.getByRole('navigation', { name: 'Khu vực workbench' }).isVisible()
  if (!mobile) {
    const stage = await simulation.boundingBox()
    const notes = await notebook.boundingBox()
    expect(notes!.y - stage!.y - stage!.height).toBeLessThanOrEqual(20)
  }
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test', exact: true }).click()
  await expect(page).toHaveURL(/attempt=[0-9a-f-]{36}/)
  const cups = page.getByRole('group', { name: 'Chọn cốc thao tác' })
  await expect(cups).toBeVisible()
  const gaps = await simulation.evaluate(element => {
    const header = element.querySelector('h2')!.parentElement!.parentElement!.getBoundingClientRect()
    const status = element.querySelector('[data-phase]')!.firstElementChild!.getBoundingClientRect()
    const rack = element.querySelector('[data-phase]')!.getBoundingClientRect()
    const note = element.querySelector('[data-phase]')!.lastElementChild!.getBoundingClientRect()
    return { above: status.top - header.bottom, below: rack.bottom - note.bottom }
  })
  expect(gaps.above).toBeLessThanOrEqual(24)
  expect(gaps.below).toBeLessThanOrEqual(24)
  if (!mobile) {
    const stage = await simulation.boundingBox()
    const notes = await notebook.boundingBox()
    expect(notes!.y - stage!.y - stage!.height).toBeLessThanOrEqual(20)
  }
  await expect(cups.getByRole('button')).toHaveCount(6)
  if (mobile) await page.getByRole('button', { name: 'Sổ đo', exact: true }).click()
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 0')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
