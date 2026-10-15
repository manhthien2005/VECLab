'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP_STRINGS } from '@/content/index.js'
import type { UUID } from '@/domain/process/contracts.js'
import Link from 'next/link'
import { GuestAttemptRepository } from '@/application/attempts/guest-repository.js'
import type { JarState } from '@/domain/experiments/jar-test/model.js'
import { listJarLabRows, removeJarLabAttempt, type JarLabRow } from '@/features/learner-lab/jar-attempts.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { formatRelativeDate } from '@/shared/ui/format.js'
import styles from './learner-pages.module.css'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { describeAuthError } from '@/features/auth/errors.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'
import { DISPLAY_NAME_MAX_LENGTH } from '@/application/profiles/profile.js'

type ProfileState =
  | { kind: 'loading' }
  | { kind: 'ready'; email: string | null; displayName: string; updatedAt: string }
  | { kind: 'error'; message: string }

type AttemptsState =
  | { kind: 'loading' }
  | { kind: 'ready'; rows: readonly JarLabRow[] }
  | { kind: 'error'; message: string }

/** Feedback for the two forms: which one, and whether it succeeded. */
type FormNotice = {
  field: 'profile' | 'password' | 'attempt'
  tone: 'ok' | 'danger'
  text: string
} | null

export function AccountClient() {
  const router = useRouter()
  const strings = APP_STRINGS.account

  const repository = useMemo(() => new GuestAttemptRepository<JarState>(), [])
  const [deleting, setDeleting] = useState<UUID | null>(null)

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
          setProfile({ kind: 'error', message: 'Chưa đọc được hồ sơ. Hãy tải lại trang để thử lại.' })
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
        setProfile({ kind: 'error', message: 'Chưa đọc được hồ sơ. Hãy tải lại trang để thử lại.' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [configured, router, strings.errors.profileSaveFailed])

  /**
   * Read the attempt list.
   *
   * Same local Jar repository as the lab, including a visible read-error state: a list that
   * cannot be read must not look like a learner with no attempts.
   */
  const readAttempts = useCallback(async (): Promise<AttemptsState> => {
    try {
      return { kind: 'ready', rows: await listJarLabRows(repository) }
    } catch (error) {
      return {
        kind: 'error',
        message: error instanceof Error ? error.message : APP_STRINGS.errors.genericTitle,
      }
    }
  }, [repository])

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
        if (response.status === 401) { router.replace('/sign-in?next=%2Faccount'); return }
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
      if (typeof body?.displayName !== 'string') throw new Error('Invalid saved profile')
      const savedName = body.displayName
      setDisplayName(savedName)
      setProfile(current => current.kind === 'ready' ? { ...current, displayName: savedName } : current)
      setNotice({ field: 'profile', tone: 'ok', text: strings.messages.profileSaved })
    } catch {
      setNotice({ field: 'profile', tone: 'danger', text: strings.errors.profileSaveFailed })
    } finally {
      setSavingProfile(false)
    }
  }, [displayName, strings, router])

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

    if (newPassword.length < 8) {
      setNotice({ field: 'password', tone: 'danger', text: APP_STRINGS.auth.errors.weakPassword })
      setSavingPassword(false)
      return
    }
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
      setDeleting(attemptId)
      try {
        await removeJarLabAttempt(repository, attemptId)
        setAttempts(await readAttempts())
        setNotice({ field: 'attempt', tone: 'ok', text: strings.messages.attemptDeleted })
      } catch {
        setNotice({ field: 'attempt', tone: 'danger', text: 'Chưa xóa được lượt thực hành. Hãy thử lại.' })
      } finally { setDeleting(null) }
    },
    [readAttempts, repository, strings.messages.attemptDeleted],
  )

  return (
    <div className={`page stack ${styles.page}`}>
      <ScienceBackdrop />
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tài khoản' }]} />
      <header className={styles.heading}>
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

      {notice?.field !== 'attempt' ? null : (
        <p className={`alert alert-${notice.tone}`} role="status">
          {notice.text}
        </p>
      )}

      <div className={styles.grid}>
        <section className={`${styles.panel} stack-tight`}>
        <h2>{strings.headings.profile}</h2>
        {notice?.field === 'profile' && <p className={`alert alert-${notice.tone}`} role="status">{notice.text}</p>}

        {profile.kind === 'loading' ? (
          <p className="muted" role="status">
            {APP_STRINGS.workbench.loading}
          </p>
        ) : profile.kind === 'error' ? (
          <div className="stack-tight"><p className="alert alert-danger" role="alert">{profile.message}</p><button type="button" className="btn" onClick={() => globalThis.location.reload()}>Tải lại hồ sơ</button></div>
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
                autoComplete="nickname"
                required
                disabled={savingProfile}
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
              <button className="btn btn-primary" disabled={savingProfile || displayName.trim() === (profile.kind === 'ready' ? profile.displayName : '')} type="submit">
                {savingProfile ? 'Đang lưu…' : strings.saveProfile}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className={`${styles.panel} stack-tight`}>
        <h2>{strings.headings.password}</h2>
        {notice?.field === 'password' && <p className={`alert alert-${notice.tone}`} role="status">{notice.text}</p>}
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
              minLength={8}
              disabled={savingPassword}
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
              minLength={8}
              disabled={savingPassword}
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
              {savingPassword ? 'Đang cập nhật…' : strings.changePassword}
            </button>
          </div>
        </form>
      </section>

      </div>
      <section className={`${styles.panel} stack-tight`}>
        <div className={styles.heading}><h2>Lượt Jar Test trên trình duyệt này</h2><Link href="/compare">So sánh lượt đã nộp</Link></div>
        <p className="hint">Các lượt này được lưu trên thiết bị, chưa đồng bộ với tài khoản. Xóa dữ liệu trình duyệt sẽ làm mất lượt đã lưu.</p>

        {attempts.kind === 'loading' ? (
          <p className="muted" role="status">
            {APP_STRINGS.workbench.loading}
          </p>
        ) : attempts.kind === 'error' ? (
          <p className="alert alert-danger">{attempts.message}</p>
        ) : attempts.rows.length === 0 ? (
          <p className="muted">{APP_STRINGS.lab.emptyBody}</p>
        ) : (
          <div className={styles.tableWrap}><table className={styles.table}><caption className="sr-only">Các lượt Jar Test đã lưu</caption><thead><tr><th scope="col">Lượt thực hành</th><th scope="col">Trạng thái</th><th scope="col">Cập nhật</th><th scope="col">Thao tác</th></tr></thead><tbody>{attempts.rows.map(row => <tr key={row.attemptId}><th scope="row">Jar Test · {row.attemptId.slice(0, 8)}</th><td>{row.status === 'completed' ? 'Đã nộp' : row.status === 'stopped' ? 'Đã dừng' : 'Đang thực hành'}</td><td>{formatRelativeDate(row.updatedAt)}</td><td><div className={styles.actions}><Link href={`/simulate/jar-test?attempt=${row.attemptId}${row.status === 'completed' ? '&view=report' : ''}`}>{row.status === 'completed' ? 'Xem báo cáo' : 'Mở lượt'}</Link><button className="btn btn-sm btn-ghost" disabled={deleting !== null} onClick={() => void removeAttempt(row.attemptId)} aria-label={`Xóa lượt Jar Test ${row.attemptId}`} type="button">{deleting === row.attemptId ? 'Đang xóa…' : 'Xóa'}</button></div></td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  )
}
