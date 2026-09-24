'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { APP_STRINGS, resolveMessage, storageModeLabel } from '@/content/index.js'
import { ACID_INPUT_DOMAIN } from '@/content/scenarios/acid-neutralization.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { parseUUID } from '@/shared/ids.js'
import { createSessionForStorageMode } from '@/features/simulation-session.js'
import type {
  AcidSession,
  AcidSessionState,
  FinalReportSnapshot,
} from '@/application/simulation/acid-session.js'
import { ScientificDisclosure } from '@/shared/ui/scientific-disclosure.js'
import {
  formatCount,
  formatIndex,
  formatLitresAsMl,
  formatMmol,
  formatPh,
  formatScore,
} from '@/shared/ui/format.js'
import {
  acidText,
  actionLabel,
  phaseLabel,
  penaltyText,
  routeLabel,
} from '@/features/simulation-workbench/copy.js'
import { buildTimeline, type TimelineEntry } from '@/features/simulation-workbench/timeline.js'

/**
 * The attempt and report shell (docs/system-architecture.md §14, web scope §4.7).
 *
 * ONE component for `/attempts/[attemptId]` and `/reports/[attemptId]`, differing only in
 * which sections it emphasises. The doc is explicit that these two routes are shared
 * shells parameterized by storage mode, and sharing one component is what makes guest and
 * cloud reports literally the same document: §6.1 requires the same report UI and print
 * CSS for both, and a second implementation is how they would drift into disagreeing about
 * the same run.
 *
 * Client component, because a guest attempt lives in IndexedDB and only the browser can
 * read it. That is also why the route cannot render a report on the server: for a guest
 * there is no server-side copy to render from.
 *
 * READ-ONLY by construction. This shell holds an `AcidSession` and calls only `load` and
 * `listEvents` — never `apply`, `undo` or `complete`. A finished report must not be a place
 * where chemistry can still change, which is why the workbench is the only screen with
 * mutating controls.
 */

/** Which document the shell is rendering. */
export type ShellView = 'attempt' | 'report'

type ShellProps = {
  /** Attempt to open. A malformed or absent id renders "cannot open", not a 500. */
  attemptId: string | null
  /** Where the learner's data lives; decides which session the shell gets. */
  storageMode: 'local' | 'cloud'
  /** Which document this is. */
  view: ShellView
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; session: AcidSessionState; timeline: readonly TimelineEntry[] }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

/**
 * How many steps a report shows without asking.
 *
 * Short runs read better inline; long ones would bury the result. Twelve is roughly two
 * dose-mix-wait-measure cycles plus setup — enough that a quick run is fully visible.
 */
const TIMELINE_INLINE_LIMIT = 12

export function AttemptShell({ attemptId, storageMode, view }: ShellProps) {
  const strings = APP_STRINGS.report

  const session = useMemo<AcidSession>(
    () => createSessionForStorageMode(storageMode),
    [storageMode],
  )

  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  /**
   * A malformed or absent id, decided during render.
   *
   * This is a pure function of the props, so it does not belong in the effect and must not
   * be set from one: doing so means a render where the component reports "loading" for an
   * attempt it already knows cannot be opened, plus a `setState` the linter is right to
   * flag as a cascading render. Deriving it lets the effect below concern itself only with
   * the work that genuinely is asynchronous — reading the store.
   *
   * Every hook is still called unconditionally above this point, which is what makes the
   * early return below legal.
   */
  const parsedAttemptId = parseUUID(attemptId)

  /**
   * Open the attempt and its chain.
   *
   * An effect rather than render-time work because reading IndexedDB is asynchronous and
   * unavailable during server rendering. Re-running it on a change of attempt id or storage
   * mode is correct: both mean a different document.
   */
  useEffect(() => {
    let cancelled = false

    // Nothing to load. The render path below reports this case, so the effect stays out of
    // it rather than writing a state value the component already knows.
    if (parsedAttemptId === null) return undefined

    void (async () => {
      const loaded = await session.load(parsedAttemptId)

      if (cancelled) return

      if (loaded === null) {
        setState({ kind: 'not_found' })
        return
      }
      if (!loaded.ok) {
        // A chain that fails hash verification is reported as an error, never as an empty
        // attempt: the learner would otherwise see a blank report for a run they finished
        // and conclude their work vanished.
        setState({
          kind: 'error',
          message: resolveMessage(loaded.error.messageKey, loaded.error.data),
        })
        return
      }

      const records = await session.listEvents(parsedAttemptId)
      if (cancelled) return

      setState({ kind: 'ready', session: loaded.state, timeline: buildTimeline(records) })
    })()

    return () => {
      cancelled = true
    }
  }, [parsedAttemptId, session])

  /** Trigger the browser's own print dialog. §4.7: no server-side PDF service. */
  const print = useCallback(() => {
    globalThis.print()
  }, [])

  // Before the loading check, and not after it: a malformed id never enters the effect, so
  // its state stays `loading` forever and checking `loading` first would render a spinner
  // that no amount of waiting resolves. This is also the case where no load was attempted,
  // which is why it is decided from props rather than from state.
  if (parsedAttemptId === null) return <NotFoundView />

  if (state.kind === 'loading') {
    return (
      <div className="page stack">
        <p className="muted" role="status">
          {APP_STRINGS.workbench.loading}
        </p>
      </div>
    )
  }

  // A well-formed id that this store does not hold: a guest link opened while signed in, a
  // cloud attempt opened as a guest, or a hand-edited UUID. Same view as the malformed case,
  // because §13.2 requires that a guessed id be indistinguishable from an absent one.
  if (state.kind === 'not_found') return <NotFoundView />

  if (state.kind === 'error') {
    return (
      <div className="page-narrow stack">
        <h1>{APP_STRINGS.errors.genericTitle}</h1>
        <p className="alert alert-danger">{state.message}</p>
        <Link className="btn btn-ghost" href="/lab">
          {strings.backToLab}
        </Link>
      </div>
    )
  }

  const { session: loaded, timeline } = state
  const report: FinalReportSnapshot | null = loaded.finalReportSnapshot

  // A report view with no snapshot means the run never completed. §4.2 forbids completing
  // without one, so the absence is not a rendering bug to paper over — it is an unfinished
  // run, and the learner is sent back to finish it rather than shown a partial report that
  // looks authoritative.
  if (view === 'report' && report === null) {
    return (
      <div className="page-narrow stack">
        <h1>{strings.notCompletedTitle}</h1>
        <p className="muted">{strings.notCompletedBody}</p>
        <p className="row">
          <Link
            className="btn btn-primary"
            href={`/simulate/acid-neutralization?attempt=${loaded.attemptId}`}
          >
            {strings.openWorkbench}
          </Link>
          <Link className="btn btn-ghost" href="/lab">
            {strings.backToLab}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <article className="page stack">
      <header className="stack-tight">
        <p className="eyebrow">{strings.title}</p>
        <h1>{view === 'report' ? strings.title : APP_STRINGS.lab.title}</h1>
        <p className="muted">{strings.lede}</p>
        <p className="row">
          <button className="btn" type="button" onClick={print}>
            {strings.print}
          </button>
          <Link className="btn btn-ghost" href="/lab">
            {strings.backToLab}
          </Link>
        </p>
        <p className="tiny faint">{strings.printHint}</p>
      </header>

      {/* §4.7 items 1 and 12: identity and timing. The release id is printed rather than a
          friendly name alone, because a report is the artifact that has to stay
          reproducible — §12 locks engine, scoring, content and evidence behind it. */}
      <section className="card stack-tight">
        <h2>{strings.headings.identity}</h2>
        <dl className="meta-list">
          <dt>{strings.fields.scenario}</dt>
          <dd>{acidText('scenarios.acid-neutralization.title')}</dd>
          <dt>{strings.fields.releaseId}</dt>
          <dd>
            <code>{loaded.releaseId}</code>
          </dd>
          <dt>{strings.fields.attemptId}</dt>
          <dd>
            <code className="tiny">{loaded.attemptId}</code>
          </dd>
          <dt>{strings.fields.status}</dt>
          <dd>
            <span className={`badge ${loaded.status === 'completed' ? 'badge-ok' : ''}`}>
              {APP_STRINGS.lab.status[loaded.status]}
            </span>
          </dd>
          <dt>{APP_STRINGS.storage.localLabel}</dt>
          <dd>{storageModeLabel(storageMode)}</dd>
        </dl>
        {/* §4.7 item 12: when the run started and when it finished. From the session state
            rather than from the event chain, because a chain's last event is the newest
            action — which for an in-progress attempt is not a completion time at all. */}
        <dl className="meta-list">
          <dt>{strings.fields.startedAt}</dt>
          <dd>{loaded.createdAt.toLocaleString('vi-VN')}</dd>
          <dt>{strings.fields.completedAt}</dt>
          <dd>
            {loaded.completedAt === null ? '—' : loaded.completedAt.toLocaleString('vi-VN')}
          </dd>
          {report === null ? null : (
            <>
              <dt>{strings.fields.generatedAt}</dt>
              <dd>{report.generatedAt.toLocaleString('vi-VN')}</dd>
            </>
          )}
        </dl>
      </section>

      {/* §4.7 item 2: initial conditions, from the locked release constants rather than
          from the stored attempt, so the report says what the scenario actually specified. */}
      <section className="card stack-tight">
        <h2>{strings.headings.initialConditions}</h2>
        <dl className="meta-list">
          <dt>Mẫu axit</dt>
          <dd>
            {formatLitresAsMl(ACID_INPUT_DOMAIN.benchmark.acidVolumeL)} HCl{' '}
            {ACID_INPUT_DOMAIN.benchmark.acidConcentrationMolL.toExponential(4)} mol/L
          </dd>
          <dt>pH* mục tiêu</dt>
          <dd>
            {formatPh(ACID_INPUT_DOMAIN.benchmark.targetPH)} ±{' '}
            {formatPh(ACID_INPUT_DOMAIN.benchmark.targetTolerancePH)}
          </dd>
          <dt>Nhiệt độ và áp suất</dt>
          <dd>25 °C, 0,1 MPa</dd>
          <dt>pKw</dt>
          <dd>13,990</dd>
        </dl>
      </section>

      {/* §4.7 item 5: the pH* series. Drawn from `measurements`, which is what the engine
          stored per reading — not recomputed here, because a report must show what the run
          produced rather than what a later engine version would produce (§15.1). */}
      <PhSeries domain={loaded.domain} />

      {/*
        §4.7 items 3 and 4: timeline plus the reagents and parameters behind it. Reverted
        events stay visible, because an undo is part of what happened (§14.2).

        WHY IT COLLAPSES. A careful titration runs to well over a hundred events, and the
        flat list pushed the chart, the final result and the scores several screens down —
        on a real run the timeline was roughly eighty percent of the report's height, so
        the reader met the procedure before ever seeing the outcome. The count and the
        span are stated up front, the full record opens on demand, and nothing is dropped:
        §4.7 requires the timeline, not a summary of it.

        `open` for a short run, because a handful of steps reads better inline than behind
        a control, and because a reader should not have to click to see a five-step
        procedure. Print is unaffected either way — the print stylesheet expands every
        disclosure so a saved PDF always carries the whole record.
      */}
      <section className="card stack-tight">
        <div className="card-header">
          <h2>{strings.headings.timeline}</h2>
          <span className="badge">{formatCount(timeline.length)} thao tác</span>
        </div>

        {timeline.length === 0 ? (
          <p className="muted">{APP_STRINGS.workbench.emptyTimeline}</p>
        ) : (
          <details className="disclosure" open={timeline.length <= TIMELINE_INLINE_LIMIT}>
            <summary>
              Xem toàn bộ {formatCount(timeline.length)} thao tác đã ghi
            </summary>
            <div className="disclosure-body timeline-scroll">
              <ol className="timeline">
                {timeline.map((entry) => (
                  <li
                    data-reverted={entry.revertedBySequence === null ? undefined : 'true'}
                    key={entry.actionId}
                  >
                    <span className="num tiny">{formatCount(entry.sequence)}</span>
                    <span>{actionLabel(entry.actionType)}</span>
                    {entry.summary === null ? null : (
                      <span className="small muted"> · {entry.summary}</span>
                    )}
                    {entry.revertedBySequence === null ? null : (
                      <span className="badge tiny">
                        đã hoàn tác bởi {formatCount(entry.revertedBySequence)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </details>
        )}
      </section>

      {/* §4.7 items 6 to 9: final result, goal, scores, explanation. */}
      <section className="card stack-tight">
        <h2>{strings.headings.final}</h2>
        <p className="ph-readout">
          {formatPh(loaded.projection.phStar)}
          <span className="small faint"> pH*</span>
        </p>
        <dl className="meta-list">
          <dt>{strings.fields.route}</dt>
          <dd>{loaded.projection.route === null ? '—' : routeLabel(loaded.projection.route)}</dd>
          <dt>Giai đoạn</dt>
          <dd>{phaseLabel(loaded.domain.phase)}</dd>
          <dt>Dung dịch bazơ đã thêm</dt>
          <dd>{formatLitresAsMl(loaded.domain.baseVolumeL)}</dd>
          <dt>Axit hiệu chỉnh đã thêm</dt>
          <dd>{formatLitresAsMl(loaded.domain.correctionAcidVolumeL)}</dd>
          <dt>Tổng thể tích</dt>
          <dd>{formatLitresAsMl(loaded.domain.totalVolumeL)}</dd>
          <dt>Số thao tác</dt>
          <dd>{formatCount(loaded.projection.operationCount)}</dd>
        </dl>
      </section>

      <section className="card stack-tight">
        <h2>{strings.headings.goal}</h2>
        <p>
          {goalStatusOf(loaded, report) ? (
            <span className="badge badge-ok">{strings.fields.goalMet}</span>
          ) : (
            <span className="badge badge-warn">{strings.fields.goalNotMet}</span>
          )}
        </p>
        <CriteriaList report={report} />
      </section>

      <section className="card stack-tight">
        <h2>{strings.headings.scores}</h2>
        <dl className="meta-list">
          <dt>Điểm tổng</dt>
          <dd>{formatScore(loaded.projection.overallScore)}</dd>
          <dt>Điểm pH</dt>
          <dd>{formatScore(loaded.projection.phScore)}</dd>
          <dt>Điểm tài nguyên</dt>
          <dd>{formatScore(loaded.projection.resourceScore)}</dd>
          <dt>Điểm quy trình</dt>
          <dd>{formatScore(loaded.projection.processScore)}</dd>
          <dt>Chỉ số chi phí tương đối</dt>
          <dd>{formatIndex(loaded.projection.relativeCostIndex)}</dd>
          <dt>Chỉ số an toàn</dt>
          <dd>{formatIndex(loaded.projection.safetyIndex)}</dd>
          <dt>E* của tuyến</dt>
          <dd>{formatMmol(loaded.projection.targetEquivalentsMmolEq)}</dd>
          <dt>Tổng đương lượng đã dùng</dt>
          <dd>{formatMmol(loaded.projection.grossEquivalentsMmolEq)}</dd>
        </dl>
        {loaded.projection.safetyPenaltyCodes.length === 0 ? null : (
          <ul className="stack-tight">
            {loaded.projection.safetyPenaltyCodes.map((code) => (
              <li className="alert alert-warn small" key={code}>
                {penaltyText(code)}
              </li>
            ))}
          </ul>
        )}
        {/* A null index is "not evaluable", never zero (§10.2). Saying so here is what stops
            a learner reading an N/A as a perfect score. */}
        {loaded.projection.modelValid ? null : (
          <p className="alert alert-danger small">
            Mô hình không hợp lệ ở trạng thái cuối; các chỉ số đánh dấu N/A thay vì tính bằng 0.
          </p>
        )}
      </section>

      {/* §4.7 items 10 and 11: scientific explanation, then sources and limitations. The
          disclosure is always present — a report without it is the one artifact most likely
          to be quoted out of context. */}
      <ScientificDisclosure />
    </article>
  )
}

/**
 * Whether the goal was met.
 *
 * From the report snapshot when there is one, because §4.2 makes that the frozen verdict and
 * §15.1 forbids recomputing it — a later engine version must not change what a finished run
 * achieved. The live projection is the fallback only for an in-progress attempt, which has no
 * snapshot yet.
 */
function goalStatusOf(
  loaded: AcidSessionState,
  report: FinalReportSnapshot | null,
): boolean {
  return report === null ? loaded.projection.goalMet : report.goalStatus.goalMet
}

/** The criteria list from the frozen snapshot, or a note that the run is unfinished. */
function CriteriaList({ report }: { report: FinalReportSnapshot | null }) {
  if (report === null) {
    return <p className="tiny faint">{APP_STRINGS.report.notCompletedBody}</p>
  }

  const rows = [...report.goalStatus.primaryCriteria, ...report.goalStatus.efficiencyCriteria]

  return (
    <>
      <dl className="meta-list">
        {rows.map((criterion) => (
          <CriteriaRow criterion={criterion} key={criterion.key} />
        ))}
      </dl>
      <p className="tiny faint">
        Mức độ hoàn thành: {formatScore(report.goalStatus.achievementPercent)}%
        {report.goalStatus.evaluable ? '' : ' · chưa đủ dữ kiện để đánh giá'}
      </p>
    </>
  )
}

/**
 * One criterion.
 *
 * Renders N/A rather than a pass/fail badge when the criterion is not evaluable, because
 * "not evaluable" is a distinct answer from "failed" (§10.2) and collapsing them would tell
 * a learner they missed a target that was never reachable.
 */
function CriteriaRow({
  criterion,
}: {
  criterion: { key: string; evaluable: boolean; met: boolean; actual: number | string | null; target: number | string; unit: string | null }
}) {
  const unit = criterion.unit === null ? '' : ` ${criterion.unit}`

  return (
    <>
      <dt>{criterion.key}</dt>
      <dd>
        {criterion.evaluable ? (
          <span className={`badge ${criterion.met ? 'badge-ok' : 'badge-warn'}`}>
            {criterion.met ? APP_STRINGS.report.fields.goalMet : APP_STRINGS.report.fields.goalNotMet}
          </span>
        ) : (
          <span className="badge">N/A</span>
        )}{' '}
        <span className="small muted">
          {criterion.actual === null ? '—' : String(criterion.actual)}
          {unit} / mục tiêu {String(criterion.target)}
          {unit}
        </span>
      </dd>
    </>
  )
}

/**
 * The pH* series as an SVG line chart (§4.7 item 10: "relevant charts").
 *
 * Hand-drawn rather than a charting dependency: the series is at most a few dozen readings,
 * the axes are two numbers each, and adding a library to draw one polyline would put more
 * code in the bundle than the chart draws. It is also the only place in the app that needs
 * a plot, so there is no shared abstraction to buy.
 *
 * The target band is shaded, because the band — not a single value — is what the goal is
 * defined against, and a chart without it invites reading the curve against zero.
 *
 * Renders nothing but a note when there are no measurements: an empty plot with axes looks
 * like data that failed to load.
 */
function PhSeries({ domain }: { domain: AcidNeutralizationState }) {
  const strings = APP_STRINGS.report
  const measurements = domain.measurements

  if (measurements.length === 0) {
    return (
      <section className="card stack-tight">
        <h2>{strings.headings.chart}</h2>
        <p className="muted small">{strings.chart.empty}</p>
      </section>
    )
  }

  const width = 640
  const height = 240
  const padding = { top: 16, right: 20, bottom: 32, left: 44 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const phValues = measurements.map((entry) => entry.simulatedPH)
  const band = {
    low: ACID_INPUT_DOMAIN.benchmark.targetPH - ACID_INPUT_DOMAIN.benchmark.targetTolerancePH,
    high: ACID_INPUT_DOMAIN.benchmark.targetPH + ACID_INPUT_DOMAIN.benchmark.targetTolerancePH,
  }

  // The y range covers the data AND the target band, so the band is never clipped out of
  // view — a band off the top of the chart would hide the thing the run is scored against.
  const yMin = Math.min(0, ...phValues, band.low)
  const yMax = Math.max(14, ...phValues, band.high)

  const xFor = (index: number): number =>
    padding.left + (measurements.length === 1 ? plotWidth / 2 : (index / (measurements.length - 1)) * plotWidth)
  const yFor = (ph: number): number =>
    padding.top + plotHeight - ((ph - yMin) / (yMax - yMin)) * plotHeight

  const points = phValues
    .map((ph, index) => `${xFor(index).toFixed(1)},${yFor(ph).toFixed(1)}`)
    .join(' ')

  return (
    <section className="card stack-tight">
      <h2>{strings.headings.chart}</h2>
      <svg
        className="ph-series"
        height={height}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        aria-label={`${strings.chart.phAxis} / ${strings.chart.sequenceAxis}`}
      >
        {/* Target band first, so the line draws over it. */}
        <rect
          className="ph-series-band"
          height={Math.abs(yFor(band.low) - yFor(band.high))}
          width={plotWidth}
          x={padding.left}
          y={yFor(band.high)}
        />
        {/* Axis lines. */}
        <line
          className="ph-series-axis"
          x1={padding.left}
          x2={padding.left + plotWidth}
          y1={padding.top + plotHeight}
          y2={padding.top + plotHeight}
        />
        <line
          className="ph-series-axis"
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + plotHeight}
        />
        <polyline className="ph-series-line" fill="none" points={points} />
        {phValues.map((ph, index) => (
          <circle className="ph-series-dot" cx={xFor(index)} cy={yFor(ph)} key={index} r={2.5} />
        ))}
        {/* y ticks at whole pH values inside the plotted range. */}
        {ticksBetween(yMin, yMax).map((tick) => (
          <text
            className="ph-series-tick"
            key={tick}
            textAnchor="end"
            x={padding.left - 8}
            y={yFor(tick) + 4}
          >
            {tick}
          </text>
        ))}
        <text
          className="ph-series-tick"
          textAnchor="middle"
          x={padding.left + plotWidth / 2}
          y={height - 8}
        >
          {strings.chart.sequenceAxis}
        </text>
      </svg>
      <p className="tiny faint">
        {strings.chart.targetBand}: {formatPh(band.low)} – {formatPh(band.high)} ·{' '}
        {formatCount(measurements.length)} số đọc
      </p>
    </section>
  )
}

/** Whole-number ticks inside an inclusive range, at most eight of them. */
function ticksBetween(min: number, max: number): number[] {
  const span = max - min
  const step = span > 8 ? 2 : 1
  const ticks: number[] = []
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
    ticks.push(value)
  }
  return ticks
}

/**
 * The view for an attempt this screen cannot open.
 *
 * Shared by the two cases that reach it — a malformed id, and a well-formed one the store
 * does not hold — because §13.2 requires them to be indistinguishable: a guessed UUID must
 * not confirm that some attempt exists. Two different messages would confirm it.
 *
 * Both exits lead to real places rather than to a dead end: the lab, and the catalog for a
 * learner who has no lab to return to.
 */
function NotFoundView() {
  const strings = APP_STRINGS.report

  return (
    <div className="page-narrow stack">
      <h1>{APP_STRINGS.workbench.notFoundTitle}</h1>
      <p className="muted">{APP_STRINGS.workbench.notFoundBody}</p>
      <p className="row">
        <Link className="btn btn-primary" href="/lab">
          {strings.backToLab}
        </Link>
        <Link className="btn btn-ghost" href="/experiments">
          {APP_STRINGS.lab.browseCatalog}
        </Link>
      </p>
    </div>
  )
}

