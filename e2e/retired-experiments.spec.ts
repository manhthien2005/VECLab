import { test, expect } from '@playwright/test'

test('retired simulator URLs cannot open the old experiment', async ({ page }) => {
  for (const key of ['acid-neutralization', 'plastic-density-separation', 'copper-precipitation']) {
    const response = await page.goto(`/simulate/${key}?attempt=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`)
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: /Không tìm thấy/ })).toBeVisible()
  }
  expect((await page.request.post('/api/simulation/attempts', { data: {} })).status()).toBe(404)
})

for (const key of ['jar-test', 'acid-base-extraction']) {
  test(`saved links open the same ${key} attempt without creating another run`, async ({ page }) => {
    await page.goto(`/simulate/${key}`)
    if (key === 'jar-test') await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }).click()
    await expect(page).toHaveURL(new RegExp(`/simulate/${key}\\?attempt=[0-9a-f-]{36}`))
    const id = new URL(page.url()).searchParams.get('attempt')!
    for (const [route, suffix] of [['attempts', ''], ['reports', '&view=report']]) {
      await page.goto(`/${route}/${id}`)
      await expect(page).toHaveURL(`/simulate/${key}?attempt=${id}${suffix}`)
      await expect(page.getByText('Bản lưu 0', { exact: true })).toHaveCount(1)
    }
  })
}

test('retired saved data is preserved and explained instead of relabelled', async ({ page }) => {
  await page.goto('/simulate/jar-test')
  await page.getByRole('button', { name: 'Bắt đầu thí nghiệm Jar Test' }).click()
  await expect(page).toHaveURL(/\/simulate\/jar-test\?attempt=[0-9a-f-]{36}$/)
  await expect(page.getByTestId('jar-revision')).toHaveText('Bản lưu 0')
  const id = new URL(page.url()).searchParams.get('attempt')!
  await page.evaluate(async attemptId => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('veclab')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('attempts', 'readwrite')
      const store = transaction.objectStore('attempts')
      const request = store.get(attemptId)
      request.onsuccess = () => store.put({ ...request.result, scenarioKey: 'acid-neutralization', scenarioReleaseId: 'acid-neutralization@1.0.0', initialState: { legacy: true }, currentState: { legacy: true } })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    db.close()
  }, id)
  await page.goto(`/reports/${id}`)
  await expect(page.getByRole('heading', { name: 'Bài thí nghiệm đã ngừng phục vụ' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Dữ liệu đã lưu vẫn được giữ')
  expect(new URL(page.url()).pathname).toBe(`/reports/${id}`)
  expect(await page.evaluate(async attemptId => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('veclab'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    const record = await new Promise<{ scenarioKey: string; revision: number }>((resolve, reject) => { const request = db.transaction('attempts').objectStore('attempts').get(attemptId); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    db.close()
    return { scenarioKey: record.scenarioKey, revision: record.revision }
  }, id)).toEqual({ scenarioKey: 'acid-neutralization', revision: 0 })
})

test('missing and malformed saved links have a clear exit', async ({ page }) => {
  for (const id of ['invalid', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']) {
    await page.goto(`/reports/${id}`)
    await expect(page.getByRole('heading', { name: 'Chưa mở được lượt thực hành' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Chọn thí nghiệm', exact: true })).toHaveAttribute('href', '/experiments')
  }
})
