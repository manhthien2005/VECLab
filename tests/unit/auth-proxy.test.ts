import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocked = vi.hoisted(() => ({ createServerClient: vi.fn(), user: null as null | { id: string } }))
vi.mock('@supabase/ssr', () => ({ createServerClient: mocked.createServerClient }))
beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_unit_test')
  mocked.user = { id: 'test-user' }
  mocked.createServerClient.mockImplementation((_url: string, _key: string, options: { cookies: { setAll: (cookies: { name: string; value: string; options: { path: string } }[], headers: Record<string, string>) => void } }) => ({ auth: { getUser: async () => {
    options.cookies.setAll([{ name: 'session-test', value: 'refreshed', options: { path: '/' } }], { 'Cache-Control': 'private, no-store', Pragma: 'no-cache', Expires: '0' })
    options.cookies.setAll([{ name: 'session-extra', value: 'second-write', options: { path: '/' } }], {})
    return { data: { user: mocked.user } }
  } } }))
})
afterEach(() => vi.unstubAllEnvs())

describe('auth refresh response', () => {
  it('keeps refreshed cookies and no-cache headers on the rebuilt response', async () => {
    const { proxy } = await import('@/proxy.js')
    const request = new NextRequest('http://localhost:3002/lab')
    const response = await proxy(request)
    expect(response.cookies.get('session-test')?.value).toBe('refreshed')
    expect(response.cookies.get('session-extra')?.value).toBe('second-write')
    expect(request.cookies.get('session-test')?.value).toBe('refreshed')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('pragma')).toBe('no-cache')
  })
  it('also carries cookies and cache guards through a sign-in redirect', async () => {
    mocked.user = null
    const { proxy } = await import('@/proxy.js')
    const response = await proxy(new NextRequest('http://localhost:3002/account'))
    expect(response.headers.get('location')).toContain('/sign-in?next=%2Faccount')
    expect(response.cookies.get('session-test')?.value).toBe('refreshed')
    expect(response.cookies.get('session-extra')?.value).toBe('second-write')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('expires')).toBe('0')
  })
})
