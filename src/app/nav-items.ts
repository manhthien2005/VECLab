import { APP_STRINGS } from '@/content/index.js'

export type NavItem = {
  href: string
  label: string
}

/**
 * Destinations a guest can open without an account.
 *
 * `/simulate`, `/attempts` and `/reports` stay off this list: they are reached
 * from the catalog or the lab, not by guessing an id.
 */
export const GUEST_NAV_ITEMS: readonly NavItem[] = [
  { href: '/experiments', label: APP_STRINGS.nav.experiments },
  { href: '/evidence', label: APP_STRINGS.nav.evidence },
  { href: '/lab', label: APP_STRINGS.nav.lab },
]

const SIGNED_IN_EXTRA_ITEMS: readonly NavItem[] = [
  { href: '/compare', label: APP_STRINGS.nav.compare },
  { href: '/account', label: APP_STRINGS.nav.account },
]

const SIGN_IN_ITEM: NavItem = {
  href: '/sign-in',
  label: APP_STRINGS.nav.signIn,
}

export function headerNavItems(signedIn: boolean): readonly NavItem[] {
  return signedIn ? [...GUEST_NAV_ITEMS, ...SIGNED_IN_EXTRA_ITEMS] : GUEST_NAV_ITEMS
}

export function footerNavItems(signedIn: boolean): readonly NavItem[] {
  return signedIn
    ? [...GUEST_NAV_ITEMS, ...SIGNED_IN_EXTRA_ITEMS]
    : [...GUEST_NAV_ITEMS, SIGN_IN_ITEM]
}
