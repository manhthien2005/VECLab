import { describe, expect, it } from 'vitest'
import { footerNavItems, headerNavItems } from '@/app/nav-items.js'

describe('nav items', () => {
  it('shows home and a clearly named guest lab', () => {
    const hrefs = headerNavItems(false).map((item) => item.href)
    expect(hrefs).toEqual(['/', '/experiments', '/evidence', '/lab'])
    expect(headerNavItems(false).find(item => item.href === '/lab')?.label).toBe('Lab dùng thử')
  })

  it('adds compare and account only when signed in', () => {
    const hrefs = headerNavItems(true).map((item) => item.href)
    expect(hrefs).toEqual(['/', '/experiments', '/evidence', '/lab', '/compare', '/account'])
    expect(headerNavItems(true).find(item => item.href === '/lab')?.label).toBe('Phòng lab của tôi')
  })

  it('puts sign-in in the guest footer instead of compare and account', () => {
    const guest = footerNavItems(false).map((item) => item.href)
    const signedIn = footerNavItems(true).map((item) => item.href)
    expect(guest).toEqual(['/experiments', '/evidence', '/lab', '/sign-in'])
    expect(signedIn).toEqual(['/experiments', '/evidence', '/lab', '/compare', '/account'])
  })
})
