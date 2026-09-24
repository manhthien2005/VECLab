import { Suspense } from 'react'
import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { SignUpForm } from '@/features/auth/sign-up-form.js'

/**
 * `/sign-up` (§4.4).
 *
 * Registers the account and sends the confirmation email. It does NOT sign the learner in:
 * §4.4 treats verification as its own required step, and the session only exists once the
 * emailed link is exchanged at `/auth/callback`.
 *
 * Guest mode stays available throughout (§5.1: a learner must be able to finish an experiment
 * without an account), so every auth screen links back to the catalog.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.auth.signUpTitle,
  robots: { index: false, follow: false },
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <SignUpForm />
    </Suspense>
  )
}
