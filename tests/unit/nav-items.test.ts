import { describe, expect, it } from 'vitest'
import { footerNavItems, headerNavItems } from '@/app/nav-items.js'

describe('nav items', () => {
  it('shows experiments, evidence, and lab to a guest', () => {
    const hrefs = headerNavItems(false).map((item) => item.href)
    expect(hrefs).toEqual(['/experiments', '/evidence', '/lab'])
  })

  it('adds compare and account only when signed in', () => {
    const hrefs = headerNavItems(true).map((item) => item.href)
    expect(hrefs).toEqual(['/experiments', '/evidence', '/lab', '/compare', '/account'])
  })

  it('puts sign-in in the guest footer instead of compare and account', () => {
    const guest = footerNavItems(false).map((item) => item.href)
    const signedIn = footerNavItems(true).map((item) => item.href)
    expect(guest).toEqual(['/experiments', '/evidence', '/lab', '/sign-in'])
    expect(signedIn).toEqual(['/experiments', '/evidence', '/lab', '/compare', '/account'])
  })
})
