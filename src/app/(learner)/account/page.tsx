import type { Metadata } from 'next'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { currentLearner, isSupabaseConfigured } from '@/features/auth/session.js'
import { AccountClient } from '@/features/account/account-client.js'

/**
 * `/account` — account and data (docs/web-application-scope.md §4.9).
 *
 * Middleware redirects a signed-out learner to `/sign-in?next=/account`, so this page
 * normally renders for someone with a session. It still handles the guest case rather than
 * assuming, for two reasons: middleware falls through when Supabase is not configured at all
 * (a guest-only deployment is a supported state, §5.1), and a session can end while the page is
 * open (§11.4). In both the screen explains itself instead of showing forms that cannot save.
 *
 * Reads cookies, so it renders per request. The profile, the password form and the attempt list
 * are all one learner's data; none of it may be cached or prefetched, and a route group name is
 * not what keeps it private — the checks inside are.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.account.title,
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  // One session resolution, not two. `currentStorageMode()` is itself
  // `currentLearner() === null`, so calling both would make two `getUser()` round trips to
  // Supabase for a single answer. Deriving the mode from the learner already in hand is the
  // same decision the shared helper makes, without the second trip.
  const learner = await currentLearner()
  const storageMode = learner === null ? 'local' : 'cloud'

  // A guest on a configured deployment: middleware should have redirected, but a redirect can
  // be bypassed by a direct fetch or by a session ending mid-request. The screen says what is
  // missing instead of rendering an account that does not exist.
  if (learner === null && isSupabaseConfigured()) {
    return (
      <div className="page-narrow stack">
        <h1>{APP_STRINGS.account.title}</h1>
        <p className="muted">{APP_STRINGS.account.signInPrompt}</p>
        <p>
          <Link className="btn btn-primary" href="/sign-in?next=%2Faccount">
            {APP_STRINGS.account.signIn}
          </Link>
        </p>
      </div>
    )
  }

  return <AccountClient storageMode={storageMode} />
}
