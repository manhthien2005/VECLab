'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APP_STRINGS, resolveMessage } from '@/content/index.js'
import { ACID_ACTIONS, ACID_INPUT_DOMAIN } from '@/content/scenarios/acid-neutralization.js'
import { ACID_ROUTES } from '@/domain/experiments/acid-neutralization/state.js'
import type { AcidRoute } from '@/domain/experiments/acid-neutralization/state.js'
import type { UUID } from '@/domain/process/contracts.js'
import { createSessionForStorageMode } from '@/features/simulation-session.js'
import {
  probeAvailableActions,
  type AcidSession,
  type AcidSessionState,
  type ActionAvailability,
  type ActionFeedback,
  type SessionActionResult,
} from '@/application/simulation/acid-session.js'
import { parseUUID } from '@/shared/ids.js'
import { WORKBENCH_PATH } from './scenario.js'
import { ScientificDisclosure } from '@/shared/ui/scientific-disclosure.js'
import { formatLitresAsMl } from '@/shared/ui/format.js'
import { actionLabel, routeLabel } from './copy.js'
import {
  FeedbackPanel,
  FormulasPanel,
  GoalPanel,
  MetricsPanel,
  ProgressPanel,
  StatePanel,
} from './workbench-panels.js'
import { buildTimeline, lastActionType, type TimelineEntry } from './timeline.js'

/**
 * The simulation workbench (docs/web-application-scope.md §4.6).
 *
 * The central screen. It owns exactly three things a panel must not: which attempt is open,
 * whether a write is in flight, and what the store said about the last write. Everything
 * else is rendered by the stateless panels in `workbench-panels.tsx`, so the twelve
 * mandatory information groups can be reviewed against that file alone.
 *
 * STORAGE MODE. A guest runs the exact release engine in the browser against IndexedDB
 * (§10.1); a signed-in learner posts through the BFF instead. Only the repository differs,
 * which is why this component never touches a store directly — it calls `session.apply`
 * and cannot tell where the event went.
 *
 * CONFLICTS. `revision_conflict` means another tab or device committed first. The work is
 * NOT lost: it was never written. The response is to reload the newer state, say so
 * plainly, and let the learner repeat the action — which gets a FRESH action id, because
 * retrying the same one would be refused as an idempotency conflict (§12.1).
 */

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'local'

type Banner = { tone: 'danger' | 'warn' | 'info'; text: string } | null

type WorkbenchProps = {
  /** Attempt to resume, when the URL carries one. Absent starts a fresh attempt. */
  attemptId: string | null
  /** Where the learner's data lives; decides which repository the session gets. */
  storageMode: 'local' | 'cloud'
}

/**
 * Operations offered in the order §5 presents them, excluding `select_route` (a choice,
 * rendered separately) and `complete` (a terminal action, rendered with undo/reset).
 */
const SEQUENCE_ACTIONS = [
  'calibrate_meter',
  'add_base',
  'mix',
  'wait_for_stable_reading',
  'measure_ph',
  'add_correction_acid',
] as const

/** Action types whose parameter is an aliquot volume. */
const DOSE_ACTIONS: readonly string[] = ['add_base', 'add_correction_acid']

export function WorkbenchClient({ attemptId, storageMode }: WorkbenchProps) {
  const router = useRouter()
  const strings = APP_STRINGS.workbench

  /**
   * Derived, not state: a pure function of `storageMode`, and safe to build during render
   * because neither session touches a browser API in its constructor. So the effect below
   * does not have to set it. See `createSessionForStorageMode` for what the two modes
   * differ in.
   */
  const session = useMemo<AcidSession>(
    () => createSessionForStorageMode(storageMode),
    [storageMode],
  )

  const [state, setState] = useState<AcidSessionState | null>(null)
  const [timeline, setTimeline] = useState<readonly TimelineEntry[]>([])
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null)
  const [banner, setBanner] = useState<Banner>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [loadError, setLoadError] = useState<string | null>(null)
  /**
   * In-flight guard as STATE, not a ref.
   *
   * A ref would stop a second write but would not re-render, so every control would stay
   * enabled and the save indicator would stay stale while the request was outstanding. The
   * store would refuse the concurrent write anyway; this exists to tell the learner their
   * click was registered.
   */
  const [busy, setBusy] = useState(false)

  /** The aliquot the learner has armed, in canonical litres. */
  const [aliquotL, setAliquotL] = useState<number>(
    ACID_INPUT_DOMAIN.permittedAliquotsL[2] ?? 0.0005,
  )

  /**
   * Open or create the attempt.
   *
   * Runs in an effect because loading reads IndexedDB, which does not exist during server
   * rendering. The attempt id is written back to the URL so a reload resumes this run
   * instead of silently creating a second attempt.
   */
  useEffect(() => {
    let cancelled = false


    void (async () => {
      const existing = attemptId === null ? null : parseUUID(attemptId)

      if (existing !== null) {
        const loaded = await session.load(existing)
        if (cancelled) return

        if (loaded === null) {
          setLoadError(strings.notFoundBody)
          return
        }
        if (!loaded.ok) {
          // A chain that fails hash verification is not shown as an empty attempt: the
          // learner would think their work vanished, and re-running would start over.
          setLoadError(resolveMessage(loaded.error.messageKey, loaded.error.data))
          return
        }

        setState(loaded.state)
        setSaveState(storageMode === 'local' ? 'local' : 'saved')
        await refreshTimeline(session, loaded.state.attemptId)
        return
      }

      const started = await session.start()
      if (cancelled) return

      setState(started)
      setSaveState(storageMode === 'local' ? 'local' : 'saved')
      router.replace(`${WORKBENCH_PATH}?attempt=${started.attemptId}`, {
        scroll: false,
      })
      await refreshTimeline(session, started.attemptId)
    })()

    return () => {
      cancelled = true
    }
    // `session` derives from `storageMode`, so the two deps below cover it. The disable is
    // for `refreshTimeline`: it is redeclared on every render, so listing it would re-run
    // this bootstrap each render and create a second attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, storageMode])

  /** Re-read the event records so the timeline reflects what the store holds. */
  async function refreshTimeline(active: AcidSession, id: UUID): Promise<void> {
    const records = await active.listEvents(id)
    setTimeline(buildTimeline(records))
  }

  /**
   * Surface the outcome of a write.
   *
   * One place handles every refusal, so the busy guard, the save indicator and the conflict
   * reload cannot be forgotten by one control and remembered by another. Each outcome gets
   * its own message because the learner's next step differs: a conflict means retry, a
   * ceiling means stop, `not_in_progress` means the run is over.
   */
  const settle = useCallback(
    async (
      result: SessionActionResult,
      active: AcidSession,
      id: UUID,
    ): Promise<void> => {
      if (result.ok) {
        setState(result.state)
        setFeedback(result.feedback)
        setSaveState(storageMode === 'local' ? 'local' : 'saved')
        await refreshTimeline(active, result.state.attemptId)
        return
      }
      // A DOMAIN refusal: the engine evaluated the action and declined it. Distinguished
      // by the ABSENCE of `outcome`, not by the presence of `error` — the store also has
      // an `outcome: 'error'` variant carrying an `error`, and testing `'error' in result`
      // would swallow that one too and leave the switch below with a `never` to handle.
      if (!('outcome' in result)) {
        setSaveState('idle')
        setBanner({
          tone: result.error.category === 'model_invalid' ? 'warn' : 'danger',
          text: resolveMessage(result.error.messageKey, result.error.data),
        })
        return
      }

      switch (result.outcome) {
        case 'revision_conflict':
          setSaveState('idle')
          setBanner({
            tone: 'warn',
            text: `${APP_STRINGS.storage.conflictTitle} ${APP_STRINGS.storage.conflictHint}`,
          })
          {
            // Reload the newer state so the workbench stops showing a revision that no
            // longer exists; without this every further action conflicts again.
            const reloaded = await active.load(id)
            if (reloaded !== null && reloaded.ok) {
              setState(reloaded.state)
              await refreshTimeline(active, reloaded.state.attemptId)
            }
          }
          return
        case 'idempotency_conflict':
          setSaveState('error')
          setBanner({
            tone: 'danger',
            text: `Thao tác này trùng mã với event ${result.existingSequence} đã lưu nhưng nội dung khác. Không ghi thêm event thứ hai.`,
          })
          return
        case 'not_in_progress':
          setSaveState('idle')
          setBanner({
            tone: 'warn',
            text: `Lượt này đã ${result.status === 'completed' ? 'hoàn thành' : 'dừng'} nên không nhận thêm thao tác. Tạo lượt mới để tiếp tục.`,
          })
          return
        case 'event_ceiling':
          setSaveState('idle')
          setBanner({
            tone: 'warn',
            text: `Đã đạt giới hạn ${result.maxEvents} event cho một lượt. Hoàn thành lượt này rồi tạo lượt mới.`,
          })
          return
        case 'undo_invalid':
          setSaveState('idle')
          setBanner({
            tone: 'warn',
            text: 'Không hoàn tác được: thao tác cuối không phải thao tác có thể hoàn tác.',
          })
          return
        case 'not_found':
          setSaveState('error')
          setBanner({ tone: 'danger', text: strings.notFoundBody })
          return
        case 'error':
          setSaveState('error')
          setBanner({
            tone: 'danger',
            text: resolveMessage(result.error.messageKey, result.error.data),
          })
          return
      }
    },
    [storageMode, strings.notFoundBody],
  )

  /**
   * Run one action, persist it and surface what happened.
   *
   * Single funnel for every control — route choice, dose, mix, wait, measure, correction
   * and undo — so no control can forget the busy guard or the conflict handling.
   */
  const run = useCallback(
    async (
      actionType: string,
      parameters: Record<string, number | string | boolean> = {},
    ): Promise<void> => {
      if (state === null || busy) return

      const id = state.attemptId
      setBusy(true)
      setSaveState('saving')
      setBanner(null)

      try {
        /*
          PARAMETERS ARE ALREADY CANONICAL — SEND NO UNIT SELECTION.

          This call used to pass `{ volumeL: 'mL' }` while handing over a value in LITRES.
          `normalizeParameters` (domain/process/lifecycle.ts §5.1) takes the unit selection
          at its word and converts, so a 0,50 mL aliquot arrived at the engine as 0,0005 mL
          — five micro-litres — which is not in the permitted set. Every dose was refused
          with "Cỡ aliquot không nằm trong tập cho phép", so "Thêm dung dịch base" could
          never be completed and no attempt could reach the target band.

          The aliquots offered by the control are read straight out of the frozen release
          constants (`ACID_INPUT_DOMAIN.permittedAliquotsL`), so they are already in the
          canonical unit and need no conversion. Passing them through a unit selection
          would also be fragile: the domain checks membership with exact equality, and a
          float multiply is not guaranteed to land back on the exact constant for a future
          aliquot set. mL stays a DISPLAY concern — `formatLitresAsMl` renders it on the
          picker and on the button — which is the same shape the domain's own tests use.
        */
        const result = await session.apply(id, actionType, parameters)
        await settle(result, session, id)
      } catch {
        // A thrown error means the store failed, not that the action was refused. Reporting
        // "not saved" is the honest outcome; implying success would lose the learner's work.
        setSaveState('error')
        setBanner({ tone: 'danger', text: APP_STRINGS.storage.errorHint })
      } finally {
        setBusy(false)
      }
    },
    [session, state, busy, settle],
  )

  const undo = useCallback(async (): Promise<void> => {
    if (state === null || busy) return

    const id = state.attemptId
    setBusy(true)
    setSaveState('saving')
    setBanner(null)

    try {
      await settle(await session.undo(id), session, id)
    } catch {
      setSaveState('error')
      setBanner({ tone: 'danger', text: APP_STRINGS.storage.errorHint })
    } finally {
      setBusy(false)
    }
  }, [session, state, busy, settle])

  const complete = useCallback(async (): Promise<void> => {
    if (state === null || busy) return

    const id = state.attemptId
    setBusy(true)
    setSaveState('saving')
    setBanner(null)

    try {
      const result = await session.complete(id)

      if (result.ok) {
        setState(result.state)
        setSaveState(storageMode === 'local' ? 'local' : 'saved')
        await refreshTimeline(session, id)
        // The report is the point of completing, so go to it rather than leaving the
        // learner on a finished workbench with no next step.
        router.push(`/reports/${id}`)
        return
      }

      // Same discriminator as `run`: a DOMAIN refusal has no `outcome`. The store's
      // `outcome: 'error'` refusal falls through to `settle`, so completion and an
      // ordinary action render a store error identically rather than one of them
      // hardcoding a tone the other derives from the error category.
      if (!('outcome' in result)) {
        setSaveState('idle')
        setBanner({
          tone: 'danger',
          text: resolveMessage(result.error.messageKey, result.error.data),
        })
        return
      }

      await settle(result, session, id)
    } catch {
      setSaveState('error')
      setBanner({ tone: 'danger', text: APP_STRINGS.storage.errorHint })
    } finally {
      setBusy(false)
    }
  }, [session, state, busy, storageMode, router, settle])

  /**
   * Reset: stop this attempt and start a fresh one.
   *
   * The stored attempt is NOT deleted — §14.1 has a reset end the current attempt as
   * stopped and create a new one, so history survives. Confirming first is required because
   * the visible workbench does change.
   */
  const reset = useCallback(async (): Promise<void> => {
    if (busy) return
    if (!window.confirm(strings.confirmReset)) return

    setBusy(true)
    setBanner(null)

    try {
      const started = await session.start()
      setState(started)
      setFeedback(null)
      setTimeline([])
      setSaveState(storageMode === 'local' ? 'local' : 'saved')
      await refreshTimeline(session, started.attemptId)
      router.replace(`${WORKBENCH_PATH}?attempt=${started.attemptId}`, {
        scroll: false,
      })
    } catch {
      setSaveState('error')
      setBanner({ tone: 'danger', text: APP_STRINGS.storage.errorHint })
    } finally {
      setBusy(false)
    }
  }, [session, busy, storageMode, router, strings.confirmReset])

  const availability = useMemo<readonly ActionAvailability[]>(
    () => (state === null ? [] : probeAvailableActions(state.domain, state.lastSequence + 1)),
    [state],
  )

  /**
   * Whether undo applies to the last event.
   *
   * Derived from the newest event's action type, because that is the rule `undoLastAction`
   * enforces: it refuses unless the LAST event is undoable. Inferring it instead from
   * whether `select_route` is currently available would enable a button the engine then
   * rejects — a control that appears to work and does not is worse than a disabled one.
   */
  const canUndo = useMemo(() => {
    const last = lastActionType(timeline)
    return (
      last !== null &&
      state !== null &&
      state.status === 'in_progress' &&
      UNDOABLE_ACTION_TYPES.has(last)
    )
  }, [timeline, state])

  if (loadError !== null) {
    return (
      <div className="page page-narrow stack">
        <h1>{strings.notFoundTitle}</h1>
        <p className="alert alert-danger" role="alert">
          {loadError}
        </p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => router.replace(WORKBENCH_PATH)}
        >
          {strings.reset}
        </button>
      </div>
    )
  }

  if (state === null) {
    // A real load, not a skeleton: the engine is constructed in the browser and a resumed
    // run replays its whole chain, which for a long attempt is visible time.
    return (
      <div className="page" aria-busy="true" aria-live="polite">
        <p className="muted">{strings.loading}</p>
      </div>
    )
  }

  return (
    <div className="stack">
      {/*
        Status strip. The page above renders the heading; this bar carries everything that
        only the browser knows — where the run is being saved, whether a write is in
        flight, and which release is open.
      */}
      <div className="workbench-bar">
        <span className="badge badge-mono badge-accent">{state.releaseId}</span>

        {/* §4.6 group 11: auto-save status, always visible. */}
        <span className="save-status" role="status" aria-live="polite">
          <span className="save-dot" data-state={saveState} />
          {saveLabel(saveState)}
        </span>

        <span className="badge">
          {storageMode === 'local'
            ? APP_STRINGS.storage.localLabel
            : APP_STRINGS.storage.cloudLabel}
        </span>

        {state.status !== 'in_progress' && (
          <span className={`badge ${state.status === 'completed' ? 'badge-ok' : 'badge-warn'}`}>
            {APP_STRINGS.lab.status[state.status]}
          </span>
        )}
      </div>

      {storageMode === 'local' && (
        <p className="alert alert-info small">{APP_STRINGS.storage.localHint}</p>
      )}

      {banner !== null && (
        <p className={`alert alert-${banner.tone} alert-live`} role="alert">
          {banner.text}
        </p>
      )}

      {/*
        Desktop: progress | state + phenomena + results | next action.

        MOBILE ORDER (§4.6): trạng thái → tiến trình → thao tác → công thức → nguồn. The
        DOM puts progress first because that is the left-hand column on a wide screen, so
        the narrow layout reorders it — `.workbench-state` is pulled ahead of progress
        below 46rem. The previous comment here claimed the DOM order already matched §4.6;
        it did not, and a learner on a phone met the empty timeline before the sample's
        own state.
      */}
      <div className="workbench">
        <ProgressPanel session={state} events={timeline} />

        <div className="stack workbench-state">
          <GoalPanel projection={state.projection} />
          <StatePanel session={state} />
          <MetricsPanel session={state} />
          {feedback !== null && <FeedbackPanel feedback={feedback} />}
        </div>

        <div className="workbench-actions">
          <ActionPanel
            availability={availability}
            aliquotL={aliquotL}
            busy={busy}
            completed={state.status === 'completed'}
            canUndo={canUndo}
            onAliquotChange={setAliquotL}
            onRun={run}
            onUndo={undo}
            onComplete={complete}
            onReset={reset}
          />
        </div>
      </div>

      <FormulasPanel session={state} />

      {/* §4.6 group 10: sources and model limitations, on the workbench itself. */}
      <ScientificDisclosure />
    </div>
  )
}

/**
 * Action types undo may revert.
 *
 * Read from the same content definition the session uses, so the button is enabled exactly
 * when the engine would accept the undo. Duplicating the list here would let the two
 * disagree and produce a control that fails on click.
 */
const UNDOABLE_ACTION_TYPES: ReadonlySet<string> = new Set(
  Object.values(ACID_ACTIONS)
    .filter((spec) => spec.undoable)
    .map((spec) => spec.actionType),
)

/** §4.6 group 6 — next action and its parameters. */
function ActionPanel({
  availability,
  aliquotL,
  busy,
  completed,
  canUndo,
  onAliquotChange,
  onRun,
  onUndo,
  onComplete,
  onReset,
}: {
  availability: readonly ActionAvailability[]
  aliquotL: number
  busy: boolean
  completed: boolean
  canUndo: boolean
  onAliquotChange: (litres: number) => void
  onRun: (
    actionType: string,
    parameters: Record<string, number | string | boolean>,
  ) => Promise<void>
  onUndo: () => Promise<void>
  onComplete: () => Promise<void>
  onReset: () => Promise<void>
}) {
  const availabilityOf = (actionType: string): ActionAvailability | undefined =>
    availability.find((entry) => entry.actionType === actionType)

  const disabled = (actionType: string): boolean =>
    busy || completed || availabilityOf(actionType)?.available !== true

  /**
   * Why an action is unavailable, or null when it is available.
   *
   * Rendered next to the disabled control (§5 "Điều kiện trước") so a greyed-out button
   * always explains itself instead of leaving the learner to guess what to do first.
   */
  const reasonFor = (actionType: string): string | null => {
    const entry = availabilityOf(actionType)
    if (entry === undefined || entry.available || entry.reasonKey === null) return null
    return resolveMessage(entry.reasonKey, entry.reasonData)
  }

  const dose = (actionType: string): void => {
    void onRun(actionType, { volumeL: aliquotL })
  }

  return (
    <section className="card stack">
      <h2>{APP_STRINGS.workbench.actionsHeading}</h2>

      {/* Route choice first: it is the only decision that changes which chemistry runs,
          and §5 orders it before any dosing. */}
      <fieldset className="field" disabled={busy}>
        <legend>Chất trung hòa</legend>
        <div className="row">
          {ACID_ROUTES.map((route: AcidRoute) => (
            <button
              key={route}
              className="btn"
              type="button"
              // The probe validates with a representative route, so select_route is offered
              // as a whole. A locked route is refused by the engine when clicked, which is
              // the right place for that rule — duplicating it here would be a second copy
              // of the lock condition that could drift from the domain's.
              disabled={disabled('select_route')}
              onClick={() => void onRun('select_route', { route })}
            >
              {routeLabel(route)}
            </button>
          ))}
        </div>
        {reasonFor('select_route') !== null && (
          <span className="hint">{reasonFor('select_route')}</span>
        )}
      </fieldset>

      {/* Aliquot size, in mL because that is what a burette reads. Offered from the
          permitted set only: an arbitrary volume would be refused by the engine, so
          letting one be typed would produce a control that mostly fails. */}
      <fieldset className="field" disabled={busy}>
        <legend>Cỡ aliquot</legend>
        <div className="aliquot-group">
          {ACID_INPUT_DOMAIN.permittedAliquotsL.map((litres) => (
            <label key={litres}>
              <input
                type="radio"
                name="aliquot"
                value={litres}
                checked={aliquotL === litres}
                onChange={() => onAliquotChange(litres)}
              />
              {formatLitresAsMl(litres)}
            </label>
          ))}
        </div>
        <span className="hint">Giá trị gửi cho mô hình: {formatLitresAsMl(aliquotL)}</span>
      </fieldset>

      {/*
        The procedure, in the order §5 presents it.

        Each row is the button plus the reason it is unavailable, as one unit — a
        greyed-out control that does not say what to do first is the fastest way to
        stall a learner. The steps are numbered so the column reads as a procedure
        rather than as a pile of buttons; the number is decorative, since the button
        label already names the operation.
      */}
      <ol className="action-list">
        {SEQUENCE_ACTIONS.map((actionType, index) => {
          const reason = reasonFor(actionType)
          const isDisabled = disabled(actionType)

          return (
            <li className="action-item" key={actionType}>
              <button
                className={actionType === 'measure_ph' ? 'btn btn-primary' : 'btn'}
                type="button"
                disabled={isDisabled}
                onClick={() =>
                  DOSE_ACTIONS.includes(actionType)
                    ? dose(actionType)
                    : void onRun(actionType, {})
                }
              >
                <span className="action-step" aria-hidden="true">
                  {index + 1}
                </span>
                {actionLabel(actionType)}
                {DOSE_ACTIONS.includes(actionType) && !isDisabled && (
                  <span className="action-dose mono">{formatLitresAsMl(aliquotL)}</span>
                )}
              </button>

              {reason !== null && <p className="hint tiny">{reason}</p>}

              {/* §4.6 group 7: a warning BEFORE the action that cannot be taken back.
                  Correction acid costs a permanent safety penalty, so it says so first. */}
              {actionType === 'add_correction_acid' && !isDisabled && (
                <p className="hint tiny alert alert-warn">
                  Thêm HCl hiệu chỉnh sẽ ghi nhận một điểm phạt an toàn và không hoàn tác
                  được.
                </p>
              )}
            </li>
          )
        })}
      </ol>

      {/* §4.6 group 12: finish, undo and reset — only what the scenario supports.
          Separated by a rule because these change the RUN, not the sample. */}
      <div className="action-terminal stack-tight">
        <button
          className="btn btn-primary btn-block"
          type="button"
          disabled={disabled('complete')}
          onClick={() => void onComplete()}
        >
          {APP_STRINGS.workbench.complete}
        </button>
        {reasonFor('complete') !== null && (
          <p className="hint tiny">{reasonFor('complete')}</p>
        )}

        <div className="row">
          <button
            className="btn btn-sm"
            type="button"
            disabled={busy || !canUndo}
            onClick={() => void onUndo()}
          >
            {APP_STRINGS.workbench.undo}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            disabled={busy}
            onClick={() => void onReset()}
          >
            {APP_STRINGS.workbench.reset}
          </button>
        </div>
      </div>
    </section>
  )
}

/** Auto-save indicator text (§4.6 group 11). */
function saveLabel(saveState: SaveState): string {
  switch (saveState) {
    case 'saving':
      return APP_STRINGS.storage.saving
    case 'saved':
      return APP_STRINGS.storage.saved
    case 'error':
      return APP_STRINGS.storage.error
    case 'local':
      return `${APP_STRINGS.storage.saved} · ${APP_STRINGS.storage.localLabel}`
    case 'idle':
    default:
      return ''
  }
}
