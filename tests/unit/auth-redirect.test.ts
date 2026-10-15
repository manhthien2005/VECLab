import { describe, expect, it } from 'vitest'
import { authCallbackUrl, destinationAfterSignIn } from '@/features/auth/redirect.js'

describe('auth return paths', () => {
  it('keeps only same-origin destinations', () => {
    for (const next of ['https://outside.example', '//outside.example', '/\\outside.example', 'javascript:alert(1)', '/lab\nother']) expect(destinationAfterSignIn(next)).toBe('/lab')
    expect(destinationAfterSignIn('/account')).toBe('/account')
  })
  it('builds confirmation and recovery callbacks without allowing a foreign next URL', () => {
    expect(authCallbackUrl('http://127.0.0.1:3002', '/reset-password')).toBe('http://127.0.0.1:3002/auth/callback?next=%2Freset-password')
    expect(authCallbackUrl('https://veclab.example', 'https://outside.example')).toBe('https://veclab.example/auth/callback?next=%2Flab')
  })
})
