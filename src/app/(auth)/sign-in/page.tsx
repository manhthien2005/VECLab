import { Suspense } from 'react'
import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { SignInForm } from '@/features/auth/sign-in-form.js'

/**
 * `/sign-in` (§4.4).
 *
 * Reached two ways: directly, and by middleware redirecting a signed-out learner away from
 * `/lab`, `/compare` or `/account` with `?next=<pathname>` appended. The form validates that
 * parameter before using it, so the redirect is a convenience and not a way to send a learner
 * off-site (see src/features/auth/redirect.ts).
 *
 * The route group name is not what makes this public — `(auth)` groups files for layout
 * purposes only and is not part of the URL. Any screen that needed to be private would have to
 * check the session itself or be listed in middleware, neither of which depends on a directory
 * name (docs/system-architecture.md).
 */

export const metadata: Metadata = {
  title: APP_STRINGS.auth.signInTitle,
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    // `useSearchParams` needs a boundary: without one the whole route would have to render
    // dynamically, and with one the static shell can be served while the form resolves the
    // query on the client. The fallback is the card frame so the page does not jump.
    <Suspense fallback={<div className="auth-shell" />}>
      <SignInForm />
    </Suspense>
  )
}
