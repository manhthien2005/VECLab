'use client'

import type { ReactNode } from 'react'
import { APP_STRINGS } from '@/content/index.js'

/**
 * The card every §4.4 auth screen is built from.
 *
 * Sign-in, sign-up, forgot-password and reset-password differ in their fields and in what
 * submitting does. They do NOT differ in their shape: a heading, an optional explanation, one
 * notice slot, a field list, a single submit button that goes busy, and footer links. Four
 * copies of that shape is four chances for one screen to lose the busy state or to render an
 * error somewhere the others do not.
 *
 * Presentational only. It owns no Supabase call and no field value — each screen keeps those,
 * because what is valid differs between them (sign-up needs a second password field, reset
 * needs no email). Keeping the state out of here is what lets this be a plain function
 * component that every screen can trust to behave the same way.
 */

/** The one notice slot, used for either a failure or a success. */
export type AuthNotice = { tone: 'danger' | 'ok'; text: string } | null

type AuthCardProps = {
  title: string
  /** Short explanation above the fields. Omitted where the title says enough. */
  lede?: string
  notice: AuthNotice
  /** Field controls. Rendered inside the `<form>` so Enter submits. */
  children: ReactNode
  /**
   * Submit label and handler, TOGETHER or not at all.
   *
   * Both are optional because some auth cards have nothing to submit: the verify screen
   * reports the outcome of a link the learner already clicked. Making them optional rather
   * than requiring a no-op pair is what keeps such a card from rendering a button that looks
   * actionable and does nothing — the learner's reasonable response to which is to click it
   * again and conclude the app is broken.
   */
  submitLabel?: string
  onSubmit?: () => void
  /** True while a request is in flight: disables the controls and labels the button. */
  busy?: boolean
  /** Links below the button — the other auth screens, or "continue as a guest". */
  footer?: ReactNode
}

export function AuthCard({
  title,
  lede,
  notice,
  children,
  submitLabel,
  onSubmit,
  busy = false,
  footer,
}: AuthCardProps) {
  // A card submits only when it was given something to do. One of the pair without the other
  // is a programming error, so the button is rendered only when both are present.
  const canSubmit = onSubmit !== undefined && submitLabel !== undefined
  return (
    <div className="auth-shell">
      <div className="card auth-card stack">
        <header className="stack-tight">
          {/* The mark repeats the header's, so a learner who arrived from an email link
              onto a bare auth screen can still tell what they are signing in to. */}
          <span className="brand-mark" aria-hidden="true">
            pH
          </span>
          <h1>{title}</h1>
          {lede === undefined ? null : <p className="muted small">{lede}</p>}
        </header>

        {notice === null ? null : (
          // Polite rather than assertive: these appear on submit, when focus is already on
          // the form, and an assertive announcement would interrupt the learner mid-action.
          <p className={`alert alert-${notice.tone}`} role="status">
            {notice.text}
          </p>
        )}

        {canSubmit ? (
          <form
            className="stack"
            onSubmit={(event) => {
              // Every auth screen submits to Supabase from the browser; there is no server
              // action to post to, and a real page navigation would discard the notice.
              event.preventDefault()
              if (!busy) onSubmit()
            }}
          >
            <fieldset className="stack" disabled={busy}>
              <legend className="visually-hidden">{title}</legend>
              {children}
            </fieldset>

            {/* Full width: on a one-field form the submit is the only action, and a
                half-width button beside empty space reads as optional. */}
            <button className="btn btn-primary btn-block" disabled={busy} type="submit">
              {busy ? APP_STRINGS.storage.saving : submitLabel}
            </button>
          </form>
        ) : (
          // No form at all, so no submit semantics: Enter does nothing and the content is
          // read rather than filled in.
          <div className="stack">{children}</div>
        )}

        {footer === undefined ? null : <footer className="stack-tight small">{footer}</footer>}
      </div>
    </div>
  )
}

/**
 * One labelled field.
 *
 * The id is required rather than generated, so a screen with two password fields cannot end
 * up with colliding ids — which would silently attach the label to the wrong input and break
 * the association for a screen reader.
 */
export function AuthField({
  id,
  label,
  hint,
  ...input
}: {
  id: string
  label: string
  hint?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input aria-describedby={hint === undefined ? undefined : `${id}-hint`} id={id} {...input} />
      {hint === undefined ? null : (
        <span className="hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  )
}
