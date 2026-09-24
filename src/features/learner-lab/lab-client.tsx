'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import type { UUID } from '@/domain/process/contracts.js'
import type { AcidSession } from '@/application/simulation/acid-session.js'
import { createSessionForStorageMode } from '@/features/simulation-session.js'
import {
  AttemptTable,
  isInProgress,
  toAttemptRow,
  type AttemptRow,
} from '@/features/attempts/attempt-table.js'
import { WORKBENCH_SCENARIO_KEY } from '@/features/simulation-workbench/scenario.js'

/**
 * My Lab (docs/web-application-scope.md §4.5).
 *
 * The learner's list of attempts, newest first, with a way back into each one. Required
 * contents, all present: in-progress runs, recently completed runs, and for each its status,
 * experiment, updated time and degree of completion; plus access to the report, access to
 * comparison, deletion, and starting a new attempt.
 *
 * §4.5 also states what NOT to build, and none of it is built here: no aggregate learning KPI,
 * no leaderboard, no class analytics. The screen is a way back into work, not a scoreboard.
 *
 * Client component, because a guest's attempts live in IndexedDB and only the browser can read
 * them. The storage mode decides which session lists them, so this one component serves both
 * modes.
 *
 * The route is `/lab`, which middleware redirects to `/sign-in` for a signed-out learner. That
 * redirect is NOT an auth boundary in the architectural sense — it is a convenience so a
 * signed-out visitor is not shown an empty list with no explanation. The screen itself reads
 * only what the session it is given can see, so a guest who reaches it directly sees their own
 * local attempts and nothing else. Route group names are never the guard.
 *
 * The rows render through the shared `AttemptTable`, which the account screen (§4.9) also
 * lists and deletes from: one table means the two cannot disagree about what a null pH* looks
 * like (§10.2).
 */

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; rows: readonly AttemptRow[] }
  | { kind: 'error'; message: string }

/** How many completed attempts to show. §4.5 asks for "recent", not all of them. */
const COMPLETED_LIMIT = 5

export function LabClient({ storageMode }: { storageMode: 'local' | 'cloud' }) {
  const strings = APP_STRINGS.lab

  const session = useMemo<AcidSession>(
    () => createSessionForStorageMode(storageMode),
    [storageMode],
  )

  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  /**
   * Read the list, turning a failure into a state rather than a throw.
   *
   * Returns the next `LoadState` instead of setting it, so ONE fetch and ONE error policy are
   * shared by the initial load and the refresh after a delete. That sharing is the point: they
   * used to be separate paths, and the refresh one did not catch, so a delete against a store
   * that had become unreadable threw an unhandled rejection while the initial load showed a
   * message for the same failure.
   *
   * Returning rather than setting also keeps every `setState` inside either the effect's own
   * async body or an event handler.
   */
  const readRows = useCallback(async (): Promise<LoadState> => {
    try {
      const summaries = await session.list()
      return { kind: 'ready', rows: summaries.map(toAttemptRow) }
    } catch (error) {
      // A failed list read is not an empty lab. Showing "no attempts" would tell a learner
      // their history was gone when the truth is that it could not be read — and, for a guest
      // whose IndexedDB is blocked, that distinction decides whether they retry or start over.
      return {
        kind: 'error',
        message: error instanceof Error ? error.message : APP_STRINGS.errors.genericTitle,
      }
    }
  }, [session])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const next = await readRows()
      // Not after unmount, and not after the storage mode changed: both mean this result
      // describes a document the learner is no longer looking at.
      if (!cancelled) setState(next)
    })()

    return () => {
      cancelled = true
    }
  }, [readRows])

  /**
   * Delete one attempt and reload.
   *
   * The confirmation is the browser's own dialog rather than a custom modal, because §4.5
   * requires that deletion is not accidental and a native confirm cannot be dismissed by
   * mis-clicking past it.
   */
  const remove = useCallback(
    async (attemptId: UUID) => {
      if (!globalThis.confirm(strings.confirmDelete)) return
      await session.remove(attemptId)
      setState(await readRows())
    },
    [readRows, session, strings.confirmDelete],
  )

  if (state.kind === 'error') {
    return (
      <div className="page-narrow stack">
        <h1>{APP_STRINGS.errors.genericTitle}</h1>
        <p className="alert alert-danger">{state.message}</p>
        <p className="row">
          <Link className="btn btn-primary" href="/experiments">
            {strings.browseCatalog}
          </Link>
        </p>
      </div>
    )
  }

  const inProgress = state.kind === 'ready' ? state.rows.filter(isInProgress) : []
  const completed =
    state.kind === 'ready'
      ? state.rows.filter((row) => row.status === 'completed').slice(0, COMPLETED_LIMIT)
      : []

  return (
    <div className="page stack-loose">
      <header className="row-between rise">
        <div className="stack-tight">
          <p className="eyebrow">{APP_STRINGS.brandTag}</p>
          <h1>{strings.title}</h1>
          <p className="lede">{strings.lede}</p>
        </div>
        <Link className="btn btn-primary btn-lg" href={`/simulate/${WORKBENCH_SCENARIO_KEY}`}>
          {strings.startNew}
        </Link>
      </header>

      {state.kind === 'loading' ? (
        <LabSkeleton />
      ) : state.rows.length === 0 ? (
        <EmptyLab />
      ) : (
        <div className="stack-loose">
          {/*
            A count strip, not a scoreboard.

            §4.5 forbids aggregate learning KPIs, leaderboards and class analytics, so these
            are three plain counts of what is in the list below — the same facts the tables
            show, stated once so a learner can see at a glance whether they have anything
            unfinished. No score, no average, no ranking.
          */}
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-value">{inProgress.length}</span>
              <span className="stat-label">{strings.groupInProgress}</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {state.rows.filter((row) => row.status === 'completed').length}
              </span>
              <span className="stat-label">Đã hoàn thành</span>
            </div>
            <div className="stat">
              <span className="stat-value">{state.rows.length}</span>
              <span className="stat-label">Tổng số lượt đã lưu</span>
            </div>
          </div>

          <div className="card">
            <AttemptTable
              heading={strings.groupInProgress}
              onRemove={remove}
              rows={inProgress}
            />
          </div>
          <div className="card">
            <AttemptTable
              heading={strings.groupCompleted}
              onRemove={remove}
              rows={completed}
            />
          </div>

          {/* §4.5 requires access to comparison from here, not only from the navigation. */}
          <p className="row">
            <Link className="btn" href="/compare">
              {APP_STRINGS.nav.compare}
            </Link>
            <span className="hint">
              Cần hai lượt đã hoàn thành cùng một phiên bản kịch bản.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

/** Matches the shape of the loaded lab, so the page does not jump when rows arrive. */
function LabSkeleton() {
  return (
    <div className="stack" aria-hidden="true">
      <div className="stat-grid">
        {[0, 1, 2].map((index) => (
          <div className="stat" key={index}>
            <div className="skeleton skeleton-line" style={{ width: '2.5rem', height: '1.25rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '70%' }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skeleton skeleton-block" />
      </div>
    </div>
  )
}

/** The empty state §4.5 expects, with the one action that resolves it. */
function EmptyLab() {
  const strings = APP_STRINGS.lab

  return (
    <div className="empty-state rise rise-1">
      <p className="eyebrow">{APP_STRINGS.nav.lab}</p>
      <h2>{strings.emptyTitle}</h2>
      <p>{strings.emptyBody}</p>
      <div className="row">
        <Link className="btn btn-primary" href={`/simulate/${WORKBENCH_SCENARIO_KEY}`}>
          {strings.startNew}
        </Link>
        <Link className="btn" href="/experiments">
          {strings.browseCatalog}
        </Link>
      </div>
    </div>
  )
}
