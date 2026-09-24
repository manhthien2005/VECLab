import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { ResetPasswordForm } from '@/features/auth/reset-password-form.js'

/**
 * `/reset-password` (§4.4).
 *
 * The last leg of the forgot-password flow, reached only from `/auth/callback` after it has
 * exchanged the emailed code for a session. So there is no `useSearchParams` here and no
 * Suspense boundary needed: this route reads nothing from the URL.
 *
 * The session check lives inside the form, not in middleware. Middleware guards `/lab`,
 * `/compare` and `/account` because those are per-learner data; this route guards itself
 * because its failure mode is specific and worth explaining — an expired link should tell the
 * learner to request a new one, not bounce them to a sign-in screen that cannot help.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.auth.resetTitle,
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
