import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({
  learner: vi.fn(), getUser: vi.fn(), updateUser: vi.fn(), legacyRead: vi.fn(), legacyUpdate: vi.fn(),
}))
vi.mock('@/features/auth/session.js', () => ({ currentLearner: mocks.learner }))
vi.mock('@/infrastructure/supabase/server.js', () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser, updateUser: mocks.updateUser } }) }))
vi.mock('@/application/profiles/profile-store.js', () => ({ readLearnerProfile: mocks.legacyRead, updateDisplayName: mocks.legacyUpdate }))
import { GET, POST } from '@/app/api/profile/route.js'
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const user = { id, email: 'test@example.invalid', is_anonymous: false, user_metadata: { display_name: 'Tên cũ' }, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' }
function post(body: unknown, origin = 'http://localhost:3002') {
  return POST(new NextRequest('http://localhost:3002/api/profile', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SUPABASE_SECRET_KEY', '')
  mocks.learner.mockResolvedValue({ id, email: user.email })
  mocks.getUser.mockResolvedValue({ data: { user }, error: null })
  mocks.updateUser.mockImplementation(async (value: { data: { display_name: string } }) => ({ data: { user: { ...user, user_metadata: value.data } }, error: null }))
})
afterEach(() => vi.unstubAllEnvs())
describe('profile with public Supabase configuration', () => {
  it('reads and saves the authenticated display name without privileged table access', async () => {
    expect(await (await GET()).json()).toMatchObject({ email: user.email, displayName: 'Tên cũ' })
    const saved = await post({ displayName: '  Nguyễn An  ' })
    expect(saved.status).toBe(200)
    expect(saved.headers.get('cache-control')).toContain('private')
    expect(saved.headers.get('cache-control')).toContain('no-store')
    expect(await saved.json()).toEqual({ displayName: 'Nguyễn An' })
    expect(mocks.updateUser).toHaveBeenCalledWith({ data: { display_name: 'Nguyễn An' } })
    expect(mocks.legacyRead).not.toHaveBeenCalled()
    expect(mocks.legacyUpdate).not.toHaveBeenCalled()
  })
  it('rejects expired sessions, cross-site writes, blank names and extra identity fields before mutation', async () => {
    expect((await post({ displayName: 'An' }, 'https://foreign.invalid')).status).toBe(403)
    expect((await post({ displayName: ' ' })).status).toBe(400)
    expect((await post({ displayName: 'An', userId: 'other' })).status).toBe(400)
    mocks.learner.mockResolvedValue(null)
    expect((await post({ displayName: 'An' })).status).toBe(401)
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })
  it('retains table-backed profile storage when privileged configuration already exists', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-only-not-a-real-key')
    mocks.legacyUpdate.mockResolvedValue({ ok: true, displayName: 'An' })
    expect((await post({ displayName: 'An' })).status).toBe(200)
    expect(mocks.legacyUpdate).toHaveBeenCalledWith(id, 'An')
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })
})
