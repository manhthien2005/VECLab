import { describe, expect, it } from 'vitest'
import { requiresSession } from '@/features/auth/session-routes.js'

describe('requiresSession', () => {
  it('lets guests into the lab, catalog, evidence, and workbench', () => {
    expect(requiresSession('/lab')).toBe(false)
    expect(requiresSession('/experiments')).toBe(false)
    expect(requiresSession('/evidence')).toBe(false)
    expect(requiresSession('/simulate/acid-neutralization')).toBe(false)
    expect(requiresSession('/attempts/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBe(false)
  })

  it('requires a session for compare and account', () => {
    expect(requiresSession('/compare')).toBe(true)
    expect(requiresSession('/compare/extra')).toBe(true)
    expect(requiresSession('/account')).toBe(true)
    expect(requiresSession('/account/settings')).toBe(true)
  })
})
