import { Suspense } from 'react'
import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { VerifyCard } from '@/features/auth/verify-card.js'

/**
 * `/verify` (§4.4: email verification).
 *
 * Where `/auth/callback` sends the learner after exchanging an emailed code, with
 * `?status=` describing the outcome. This page only explains that outcome — the session, if
 * any, was already established by the callback route, which is the single place a session can
 * be created from a URL.
 *
 * Splitting the exchange (server) from the explanation (this page) is deliberate: the code is
 * consumed in a route handler where it can be used exactly once and never rendered, and what
 * the learner sees is plain copy with no detail that would reveal how far a guessed link got.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.auth.verifyTitle,
  robots: { index: false, follow: false },
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <VerifyCard />
    </Suspense>
  )
}
