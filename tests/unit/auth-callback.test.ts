import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/auth/callback/route.js'

const auth = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn() }))
vi.mock('@/infrastructure/supabase/server.js', () => ({ createSupabaseServerClient: async (options: { onAuthHeaders: (headers: Record<string, string>) => void }) => {
  options.onAuthHeaders({ 'Cache-Control': 'private, no-store', Pragma: 'no-cache' })
  return { auth }
} }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_unit_test')
  auth.exchangeCodeForSession.mockResolvedValue({ error: null })
  auth.verifyOtp.mockResolvedValue({ error: null })
})
afterEach(() => vi.unstubAllEnvs())
const request = (query: string) => new NextRequest(`http://localhost:3002/auth/callback?${query}`)

describe('email callbacks', () => {
  it('exchanges a PKCE code and removes credentials from the safe return URL', async () => {
    const response = await GET(request('code=test-code&next=%2Faccount'))
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code')
    expect(response.headers.get('location')).toBe('http://localhost:3002/account')
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
  it('rejects an external destination after a valid exchange', async () => {
    const response = await GET(request('code=test-code&next=https%3A%2F%2Foutside.example'))
    expect(response.headers.get('location')).toBe('http://localhost:3002/lab')
  })
  it('verifies recovery token hashes and sends the learner to reset, even with another next path', async () => {
    const response = await GET(request('token_hash=test-hash&type=recovery&next=%2Faccount'))
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'test-hash', type: 'recovery' })
    expect(response.headers.get('location')).toBe('http://localhost:3002/reset-password')
  })
  it('supports confirmation tokens and refuses unrecognized token types', async () => {
    expect((await GET(request('token_hash=test-hash&type=signup'))).headers.get('location')).toBe('http://localhost:3002/lab')
    auth.verifyOtp.mockClear()
    expect((await GET(request('token_hash=test-hash&type=unknown'))).headers.get('location')).toContain('/verify?status=missing_code')
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })
  it('turns expired codes and network errors into a recovery screen', async () => {
    auth.exchangeCodeForSession.mockResolvedValueOnce({ error: { code: 'otp_expired' } })
    expect((await GET(request('code=expired'))).headers.get('location')).toContain('/verify?status=failed')
    auth.exchangeCodeForSession.mockRejectedValueOnce(new Error('network unavailable'))
    const response = await GET(request('code=test-code'))
    expect(response.headers.get('location')).toContain('/verify?status=failed')
    expect(response.headers.get('cache-control')).toContain('no-store')
  })
  it('does not contact auth when configuration or credentials are missing', async () => {
    expect((await GET(request(''))).headers.get('location')).toContain('/verify?status=missing_code')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    expect((await GET(request('code=test-code'))).headers.get('location')).toContain('/verify?status=not_configured')
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })
})
