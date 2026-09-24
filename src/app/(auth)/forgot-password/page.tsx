import { Suspense } from 'react'
import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form.js'

/**
 * `/forgot-password` (§4.4).
 *
 * Asks Supabase to email a reset link. The link returns to `/auth/callback`, which exchanges
 * its one-time code and forwards the learner to `/reset-password` with a session in place.
 *
 * The success copy is ambiguous on purpose — it does not confirm whether the address was
 * registered — because a screen that said "we sent it" would turn the form into an
 * account-existence oracle. Supabase already returns the same response either way; this page
 * keeps it that way.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.auth.forgotTitle,
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
