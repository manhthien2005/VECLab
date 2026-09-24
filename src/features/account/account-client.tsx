'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import type { UUID } from '@/domain/process/contracts.js'
import type { AcidSession } from '@/application/simulation/acid-session.js'
import { createSessionForStorageMode } from '@/features/simulation-session.js'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'
import {
  AttemptTable,
  toAttemptRow,
  type AttemptRow,
} from '@/features/attempts/attempt-table.js'
import { DISPLAY_NAME_MAX_LENGTH } from '@/application/profiles/profile.js'

/**
 * Account and data (docs/web-application-scope.md §4.9).
 *
 * The six things §4.9 requires, and nothing else: see the login email, change the display
 * name, change the password, sign out, list attempts, delete one of them. §4.9 also names
 * what is NOT built — no social profile, no uploaded avatar, no following other learners,
 * no public sharing — and none of it appears here.
 *
 * Two different backends are involved and deliberately kept separate:
 *
 *   * profile and password go to Supabase Auth and to `/api/profile`. The display name
 *     cannot be written from the browser at all: `authenticated` holds SELECT only on
 *     `profiles` (docs/data-and-state-model.md §17.1), so the route is the only writer.
 *   * attempts go through the session, which for an account is the BFF.
 *
 * The attempt list here uses the SAME `AttemptTable` as My Lab. That is not tidiness: pH*
 * and score are `number | null` where null means "not evaluable" and never zero (§10.2),
 * and one table is what keeps this screen from rendering a 0 where the lab renders a dash.
 */

type ProfileState =
  | { kind: 'loading' }
  | { kind: 'ready'; email: string | null; displayName: string; updatedAt: string }
  | { kind: 'error'; message: string }

type AttemptsState =
  | { kind: 'loading' }
  | { kind: 'ready'; rows: readonly AttemptRow[] }
  | { kind: 'error'; message: string }

/** Feedback for the two forms: which one, and whether it succeeded. */
type FormNotice = {
  field: 'profile' | 'password'
  tone: 'ok' | 'danger'
  text: string
} | null

export function AccountClient({ storageMode }: { storageMode: 'cloud' | 'local' }) {
  const router = useRouter()
  const strings = APP_STRINGS.account

  const session = useMemo<AcidSession>(
    () => createSessionForStorageMode(storageMode),
    [storageMode],
  )

  // A build-time constant: `NEXT_PUBLIC_` values are inlined at build, so this cannot change
  // for the life of the bundle. Deriving the initial profile state from it during render —
  // rather than setting it inside the effect below — keeps an accountless deployment from ever
  // flashing "loading", and keeps the effect free of a synchronous setState.
  const configured = isSupabaseConfigured()

  const [profile, setProfile] = useState<ProfileState>(() =>
    configured
      ? { kind: 'loading' }
      : { kind: 'error', message: APP_STRINGS.errors.notConfiguredBody },
  )
  const [attempts, setAttempts] = useState<AttemptsState>({ kind: 'loading' })
  const [notice, setNotice] = useState<FormNotice>(null)

  // Form state lives next to the handler that submits it, and each form has its own busy
  // flag: saving a name must not disable the password fields, and vice versa.
  const [displayName, setDisplayName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  /**
   * Read the profile.
   *
   * A deployment with no Supabase configuration has no accounts at all, so there is nothing
   * to read and the screen says so instead of firing a request that can only fail. Guest
   * mode keeps working in that state (§5.1), which is why this is a branch and not an error.
   */
  useEffect(() => {
    // Nothing to read when the deployment has no accounts at all. The state was derived during
    // render above, so this returns WITHOUT touching it: a synchronous setState here would
    // start a render cascade the caller cannot see, to write the value it already has.
    if (!configured) return undefined

    let cancelled = false

    void (async () => {
      try {
        const response = await globalThis.fetch('/api/profile', {
          // Never cached: this is one learner's identity, and §17 requires authenticated
          // responses to be no-store. A cached copy could survive a sign-out.
          cache: 'no-store',
          credentials: 'same-origin',
        })

        if (!response.ok) {
          if (cancelled) return
          // A 401 here means the session ended while this page was open (§11.4). The learner
          // is sent to sign in with this page as the return target rather than shown a
          // profile form that cannot save.
          if (response.status === 401) {
            router.replace('/sign-in?next=%2Faccount')
            return
          }
          setProfile({ kind: 'error', message: strings.errors.profileSaveFailed })
          return
        }

        const body = (await response.json()) as {
          email: string | null
          displayName: string
          updatedAt: string
        }

        if (cancelled) return
        setProfile({ kind: 'ready', ...body })
        // Seeded from the stored value, so the input shows what is saved rather than empty.
        setDisplayName(body.displayName)
      } catch {
        if (cancelled) return
        setProfile({ kind: 'error', message: strings.errors.profileSaveFailed })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [configured, router, strings.errors.profileSaveFailed])

  /**
   * Read the attempt list.
   *
   * Same shape as the lab's loader, including turning a failure into a state: a list that
   * cannot be read must not look like a learner with no attempts.
   */
  const readAttempts = useCallback(async (): Promise<AttemptsState> => {
    try {
      const summaries = await session.list()
      return { kind: 'ready', rows: summaries.map(toAttemptRow) }
    } catch (error) {
      return {
        kind: 'error',
        message: error instanceof Error ? error.message : APP_STRINGS.errors.genericTitle,
      }
    }
  }, [session])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const next = await readAttempts()
      if (!cancelled) setAttempts(next)
    })()

    return () => {
      cancelled = true
    }
  }, [readAttempts])

  const saveProfile = useCallback(async () => {
    setSavingProfile(true)
    setNotice(null)

    // Checked in the browser as well as by the route, because it is the learner's own input
    // and a round trip to learn "you typed nothing" is a wasted trip. The route remains the
    // authority: it re-checks and it is what enforces §5.3's 1–80 after trim.
    if (displayName.trim() === '') {
      setNotice({ field: 'profile', tone: 'danger', text: strings.errors.emptyDisplayName })
      setSavingProfile(false)
      return
    }
    if (displayName.trim().length > DISPLAY_NAME_MAX_LENGTH) {
      setNotice({ field: 'profile', tone: 'danger', text: strings.errors.tooLongDisplayName })
      setSavingProfile(false)
      return
    }

    try {
      const response = await globalThis.fetch('/api/profile', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      })

      const body = (await response.json().catch(() => null)) as { error?: string; displayName?: string } | null

      if (!response.ok) {
        setNotice({
          field: 'profile',
          tone: 'danger',
          text:
            body?.error === 'display_name_too_long'
              ? strings.errors.tooLongDisplayName
              : body?.error === 'display_name_blank'
                ? strings.errors.emptyDisplayName
                : strings.errors.profileSaveFailed,
        })
        setSavingProfile(false)
        return
      }

      // The trimmed value the store actually saved, so the field stops showing padding the
      // learner typed and starts showing what is stored.
      if (body?.displayName !== undefined) setDisplayName(body.displayName)
      setNotice({ field: 'profile', tone: 'ok', text: strings.messages.profileSaved })
    } catch {
      setNotice({ field: 'profile', tone: 'danger', text: strings.errors.profileSaveFailed })
    } finally {
      setSavingProfile(false)
    }
  }, [displayName, strings])

  /**
   * Change the password.
   *
   * No "current password" field, and that is a decision rather than an omission: Supabase only
   * checks `current_password` when a server flag is enabled, which a browser cannot detect.
   * Collecting it anyway would promise a verification that may silently never happen. The
   * requirement actually enforced is the active session, which the learner has by being here.
   */
  const changePassword = useCallback(async () => {
    setSavingPassword(true)
    setNotice(null)

    if (newPassword !== confirmPassword) {
      setNotice({ field: 'password', tone: 'danger', text: APP_STRINGS.auth.errors.passwordMismatch })
      setSavingPassword(false)
      return
    }

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error !== null) {
        setNotice({ field: 'password', tone: 'danger', text: describeAuthError(error) })
        setSavingPassword(false)
        return
      }

      // Cleared so the password is not left sitting in a field after a successful save.
      setNewPassword('')
      setConfirmPassword('')
      setNotice({ field: 'password', tone: 'ok', text: strings.messages.passwordChanged })
    } catch (cause) {
      setNotice({ field: 'password', tone: 'danger', text: describeAuthError(cause) })
    } finally {
      setSavingPassword(false)
    }
  }, [confirmPassword, newPassword, strings.messages.passwordChanged])

  const signOut = useCallback(async () => {
    setSigningOut(true)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.signOut()

      if (error !== null) {
        setNotice({ field: 'profile', tone: 'danger', text: describeAuthError(error) })
        setSigningOut(false)
        return
      }

      // To the catalog rather than staying: everything on this page is account data, and
      // leaving the learner on it after sign-out shows a screen that can no longer load.
      // `refresh()` re-runs server components so middleware sees the cleared cookie.
      router.replace('/experiments')
      router.refresh()
    } catch (cause) {
      setNotice({ field: 'profile', tone: 'danger', text: describeAuthError(cause) })
      setSigningOut(false)
    }
  }, [router])

  /**
   * Delete one attempt (§4.9, and §12 requires the confirmation).
   *
   * The message is the lab's, which already says the history goes too and cannot be
   * recovered. Reusing it is the point: two screens offering the same destructive action
   * should warn in the same words.
   */
  const removeAttempt = useCallback(
    async (attemptId: UUID) => {
      if (!globalThis.confirm(APP_STRINGS.lab.confirmDelete)) return
      await session.remove(attemptId)
      setAttempts(await readAttempts())
    },
    [readAttempts, session],
  )

  return (
    <div className="page stack">
      <header className="row">
        <div className="stack-tight">
          <h1>{strings.title}</h1>
          <p className="muted">{strings.lede}</p>
        </div>
        <button
          className="btn btn-ghost"
          disabled={signingOut || !configured}
          onClick={() => void signOut()}
          type="button"
        >
          {signingOut ? strings.signingOut : strings.signOut}
        </button>
      </header>

      {notice === null ? null : (
        <p className={`alert alert-${notice.tone}`} role="status">
          {notice.text}
        </p>
      )}

      <section className="card stack-tight">
        <h2>{strings.headings.profile}</h2>

        {profile.kind === 'loading' ? (
          <p className="muted" role="status">
            {APP_STRINGS.workbench.loading}
          </p>
        ) : profile.kind === 'error' ? (
          <p className="alert alert-danger">{profile.message}</p>
        ) : (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault()
              if (!savingProfile) void saveProfile()
            }}
          >
            {/* Read-only. §5.3 keeps email out of the profiles table and reads it from the
                auth identity, so there is nothing here to write — and saying why beats
                leaving a field that looks editable. */}
            <div className="field">
              <label htmlFor="account-email">{strings.email}</label>
              <input
                aria-describedby="account-email-hint"
                id="account-email"
                readOnly
                type="email"
                value={profile.email ?? ''}
              />
              <span className="hint" id="account-email-hint">
                {strings.emailLocked}
              </span>
            </div>

            <div className="field">
              <label htmlFor="account-display-name">{strings.displayName}</label>
              <input
                aria-describedby="account-display-name-hint"
                id="account-display-name"
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                onChange={(event) => setDisplayName(event.target.value)}
                type="text"
                value={displayName}
              />
              <span className="hint" id="account-display-name-hint">
                {strings.displayNameHint}
              </span>
            </div>

            <div className="row">
              <button className="btn btn-primary" disabled={savingProfile} type="submit">
                {strings.saveProfile}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="card stack-tight">
        <h2>{strings.headings.password}</h2>
        <p className="hint">{strings.changePasswordHint}</p>

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault()
            if (!savingPassword) void changePassword()
          }}
        >
          <div className="field">
            <label htmlFor="account-new-password">{APP_STRINGS.auth.newPassword}</label>
            <input
              autoComplete="new-password"
              id="account-new-password"
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
            <span className="hint">{APP_STRINGS.auth.passwordHint}</span>
          </div>

          <div className="field">
            <label htmlFor="account-confirm-password">{APP_STRINGS.auth.confirmNewPassword}</label>
            <input
              autoComplete="new-password"
              id="account-confirm-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </div>

          <div className="row">
            <button
              className="btn btn-primary"
              disabled={savingPassword || !configured}
              type="submit"
            >
              {strings.changePassword}
            </button>
          </div>
        </form>
      </section>

      <section className="stack-tight">
        <h2>{strings.headings.attempts}</h2>

        {attempts.kind === 'loading' ? (
          <p className="muted" role="status">
            {APP_STRINGS.workbench.loading}
          </p>
        ) : attempts.kind === 'error' ? (
          <p className="alert alert-danger">{attempts.message}</p>
        ) : attempts.rows.length === 0 ? (
          <p className="muted">{APP_STRINGS.lab.emptyBody}</p>
        ) : (
          <AttemptTable
            heading={strings.headings.attempts}
            onRemove={removeAttempt}
            rows={attempts.rows}
            // The section above already renders this heading over all four states, so the
            // table's visible one would repeat it. Its caption still names the table.
            showHeading={false}
          />
        )}
      </section>
    </div>
  )
}
