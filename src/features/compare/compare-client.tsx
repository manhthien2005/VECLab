'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import type { UUID } from '@/domain/process/contracts.js'
import type { AcidSession, AcidSessionState } from '@/application/simulation/acid-session.js'
import type { AttemptSummary } from '@/application/attempts/repository.js'
import { createSessionForStorageMode } from '@/features/simulation-session.js'
import { formatPh, formatRelativeDate, formatScore } from '@/shared/ui/format.js'
import { ROUTE_LABEL_KEYS, acidText, routeLabel } from '@/features/simulation-workbench/copy.js'
import { WORKBENCH_SCENARIO_KEY } from '@/features/simulation-workbench/scenario.js'
import {
  assessComparability,
  buildComparison,
  type CompareMetric,
  type CompareSide,
  type IncomparableReason,
} from './comparison.js'

/**
 * Comparison of two attempts (docs/web-application-scope.md §4.8).
 *
 * The comparability RULES and the row construction live in `comparison.ts`, which is pure
 * and unit-tested; this component only picks two attempts, loads them and renders what
 * that module returns. The split matters: §4.8's release rule is the one with teeth — a
 * `@1.0.0` run against a `@1.1.0` run could differ entirely because of the version — and
 * a rule enforced inside a React component is a rule that cannot be tested without a DOM.
 *
 * WHY LOADING IS LAZY. The picker lists attempt SUMMARIES, which the store already holds;
 * a full load replays the whole event chain with every hash verified, which is real work.
 * Loading both sides only after the learner has chosen them keeps the screen responsive
 * with a long attempt history.
 *
 * Client component, because a guest's attempts live in IndexedDB and only the browser can
 * read them. Middleware redirects `/compare` to sign-in for a signed-out learner, but that
 * redirect is a convenience, not the boundary: this screen reads only what the session it
 * holds can see.
 */

type SideKey = 'a' | 'b'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; summaries: readonly AttemptSummary[] }
  | { kind: 'error'; message: string }

/** One chosen side, once its full state has been read back from the store. */
type LoadedSide =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; state: AcidSessionState }
  | { kind: 'error'; message: string }

export function CompareClient({ storageMode }: { storageMode: 'local' | 'cloud' }) {
  const strings = APP_STRINGS.compare

  const session = useMemo<AcidSession>(
    () => createSessionForStorageMode(storageMode),
    [storageMode],
  )

  const [list, setList] = useState<LoadState>({ kind: 'loading' })
  const [chosen, setChosen] = useState<Record<SideKey, string>>({ a: '', b: '' })
  const [sides, setSides] = useState<Record<SideKey, LoadedSide>>({
    a: { kind: 'idle' },
    b: { kind: 'idle' },
  })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const summaries = await session.list()
        if (!cancelled) setList({ kind: 'ready', summaries })
      } catch (error) {
        // A failed list read is NOT an empty history. Telling a learner they have nothing
        // to compare when the truth is that the store could not be read would send them to
        // re-run experiments they have already finished.
        if (!cancelled) {
          setList({
            kind: 'error',
            message:
              error instanceof Error ? error.message : APP_STRINGS.errors.genericTitle,
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session])

  /**
   * Only completed attempts are selectable.
   *
   * §4.8 restricts comparison to finished runs because the frozen report is what makes two
   * results comparable at all. Filtering here rather than only refusing afterwards means
   * the picker cannot offer a choice that is guaranteed to fail.
   */
  const completed = useMemo(
    () =>
      list.kind === 'ready'
        ? list.summaries.filter((summary) => summary.status === 'completed')
        : [],
    [list],
  )

  const choose = useCallback(
    async (side: SideKey, attemptId: string) => {
      setChosen((current) => ({ ...current, [side]: attemptId }))

      if (attemptId === '') {
        setSides((current) => ({ ...current, [side]: { kind: 'idle' } }))
        return
      }

      setSides((current) => ({ ...current, [side]: { kind: 'loading' } }))

      try {
        const loaded = await session.load(attemptId as UUID)

        if (loaded === null) {
          setSides((current) => ({
            ...current,
            [side]: { kind: 'error', message: APP_STRINGS.workbench.notFoundBody },
          }))
          return
        }
        if (!loaded.ok) {
          // A chain that fails hash verification must not be rendered as a comparable
          // result: the numbers would describe a state the stored events do not support.
          setSides((current) => ({
            ...current,
            [side]: { kind: 'error', message: loaded.error.code },
          }))
          return
        }

        setSides((current) => ({ ...current, [side]: { kind: 'ready', state: loaded.state } }))
      } catch (error) {
        setSides((current) => ({
          ...current,
          [side]: {
            kind: 'error',
            message: error instanceof Error ? error.message : APP_STRINGS.errors.genericTitle,
          },
        }))
      }
    },
    [session],
  )

  if (list.kind === 'error') {
    return (
      <div className="page page-narrow stack">
        <h1>{strings.title}</h1>
        <p className="alert alert-danger" role="alert">
          {list.message}
        </p>
        <p>
          <Link className="btn btn-primary" href="/lab">
            {APP_STRINGS.nav.lab}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="page stack-loose">
      <header className="stack rise">
        <p className="eyebrow">{APP_STRINGS.brandTag}</p>
        <h1>{strings.title}</h1>
        <p className="lede">{strings.lede}</p>
      </header>

      {list.kind === 'loading' ? (
        <CompareSkeleton />
      ) : completed.length < 2 ? (
        <NotEnoughAttempts count={completed.length} />
      ) : (
        <>
          <section className="card card-pad stack rise rise-1">
            <h2>Chọn hai lượt</h2>
            <div className="compare-picker">
              <SidePicker
                label={strings.pickA}
                name="compare-a"
                options={completed}
                value={chosen.a}
                onChange={(value) => void choose('a', value)}
              />
              <SidePicker
                label={strings.pickB}
                name="compare-b"
                options={completed}
                value={chosen.b}
                onChange={(value) => void choose('b', value)}
              />
            </div>
            <p className="hint">
              Chỉ lượt đã hoàn thành và cùng exact mã phiên bản kịch bản mới so sánh trực
              tiếp được. Danh sách trên đã lọc sẵn các lượt đã hoàn thành.
            </p>
          </section>

          <ComparisonBody sides={sides} />
        </>
      )}
    </div>
  )
}

/** One attempt chooser. A native `select`, which is the control a phone renders best. */
function SidePicker({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string
  name: string
  options: readonly AttemptSummary[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{APP_STRINGS.compare.choose}</option>
        {options.map((summary) => (
          <option key={summary.attemptId} value={summary.attemptId}>
            {optionLabel(summary)}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * A one-line description of an attempt for the picker.
 *
 * Release id and update time, because those are exactly the two facts that decide whether
 * a pair CAN be compared and which of two similar runs this is. The attempt id is reduced
 * to its first segment: a full UUID in a select option pushes the meaningful part off the
 * visible width on a phone.
 */
function optionLabel(summary: AttemptSummary): string {
  const shortId = summary.attemptId.slice(0, 8)
  return `${summary.scenarioReleaseId} · ${formatRelativeDate(summary.updatedAt)} · ${shortId}`
}

/** The comparison itself, once both sides are chosen and loaded. */
function ComparisonBody({ sides }: { sides: Record<SideKey, LoadedSide> }) {
  const strings = APP_STRINGS.compare

  if (sides.a.kind === 'idle' || sides.b.kind === 'idle') {
    return (
      <div className="empty-state rise rise-2">
        <p className="eyebrow">Chưa đủ lựa chọn</p>
        <p>Chọn một lượt ở mỗi ô để xem bảng so sánh.</p>
      </div>
    )
  }

  if (sides.a.kind === 'loading' || sides.b.kind === 'loading') {
    return <CompareSkeleton />
  }

  if (sides.a.kind === 'error' || sides.b.kind === 'error') {
    const message = sides.a.kind === 'error' ? sides.a.message : (sides.b as { message: string }).message
    return (
      <p className="alert alert-danger" role="alert">
        Không đọc được một trong hai lượt: {message}
      </p>
    )
  }

  const a = toCompareSide(sides.a.state)
  const b = toCompareSide(sides.b.state)
  const verdict = assessComparability(a, b)

  if (!verdict.comparable) {
    return <Incomparable reason={verdict.reason} a={a} b={b} />
  }

  const comparison = buildComparison(a, b)

  return (
    <div className="stack-loose">
      <section className="stack rise rise-2">
        <div className="section-head">
          <h2>{strings.headings.initialConditions}</h2>
          <span className="badge badge-mono badge-accent">{a.releaseId}</span>
        </div>
        <div className="grid-2">
          <AttemptCard side={a} label={strings.pickA} />
          <AttemptCard side={b} label={strings.pickB} />
        </div>
      </section>

      <MetricTable heading={strings.headings.scores} rows={comparison.scores} />
      <MetricTable heading={strings.headings.efficiency} rows={comparison.efficiency} />
      <MetricTable heading={strings.headings.reagents} rows={comparison.reagents} />
      <MetricTable heading={strings.headings.steps} rows={comparison.steps} />

      <section className="stack">
        <div className="section-head">
          <h2>{strings.headings.warnings}</h2>
        </div>
        <div className="grid-2">
          <WarningCard side={a} label={strings.pickA} />
          <WarningCard side={b} label={strings.pickB} />
        </div>
      </section>
    </div>
  )
}

/**
 * Narrow a loaded session state to the shape the comparison rules take.
 *
 * Everything here comes from the stored attempt — the frozen report where one exists, the
 * ledger rebuilt by verified replay, the reason codes the model recorded. Nothing is
 * recomputed: §15.1 forbids a newer engine from changing what two finished runs achieved.
 */
function toCompareSide(state: AcidSessionState): CompareSide {
  return {
    attemptId: state.attemptId,
    scenarioKey: WORKBENCH_SCENARIO_KEY,
    releaseId: state.releaseId,
    status: state.status,
    report: state.finalReportSnapshot,
    ledger: state.ledger,
    projection: state.projection,
    invalidReasonCodes: state.domain.invalidReasonCodes,
  }
}

/** One side's identity and headline result. */
function AttemptCard({ side, label }: { side: CompareSide; label: string }) {
  const projection = side.report?.projection ?? side.projection
  const goal = side.report?.goalStatus

  return (
    <article className="card stack-tight">
      <div className="card-header">
        <h3>{label}</h3>
        <span className="badge badge-mono">{side.attemptId.slice(0, 8)}</span>
      </div>

      <dl className="meta-list">
        <dt>Phiên bản</dt>
        <dd className="small">{side.releaseId}</dd>
        <dt>{APP_STRINGS.workbench.route}</dt>
        <dd>
          {projection.route === null
            ? APP_STRINGS.workbench.noRoute
            : routeLabel(projection.route)}
        </dd>
        <dt>pH* cuối</dt>
        <dd>{formatPh(projection.phStar)}</dd>
        <dt>{APP_STRINGS.workbench.overallScore}</dt>
        <dd>
          {projection.overallScore === null
            ? APP_STRINGS.compare.notEvaluable
            : formatScore(projection.overallScore)}
        </dd>
      </dl>

      {/* A run the model could not evaluate is NOT a failed run (§10.2). The three
          outcomes are distinct, so they get three distinct labels rather than collapsing
          "not evaluable" into "not met". */}
      <p>
        {goal === undefined || !goal.evaluable ? (
          <span className="badge">{APP_STRINGS.workbench.notEvaluable}</span>
        ) : goal.goalMet ? (
          <span className="badge badge-ok">✓ {APP_STRINGS.report.fields.goalMet}</span>
        ) : (
          <span className="badge badge-warn">{APP_STRINGS.report.fields.goalNotMet}</span>
        )}
      </p>

      <p>
        <Link className="btn btn-sm" href={`/reports/${side.attemptId}`}>
          {APP_STRINGS.lab.report}
        </Link>
      </p>
    </article>
  )
}

/** The reason codes a run recorded, or an explicit statement that there were none. */
function WarningCard({ side, label }: { side: CompareSide; label: string }) {
  return (
    <article className="card stack-tight">
      <h3>{label}</h3>
      {side.invalidReasonCodes.length === 0 ? (
        <p className="small muted">{APP_STRINGS.compare.noWarnings}</p>
      ) : (
        <ul className="stack-tight small">
          {side.invalidReasonCodes.map((code) => (
            <li key={code}>
              <span className="badge badge-warn">{code}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

/**
 * One group of metrics as a four-column table.
 *
 * The difference column is computed HERE rather than in `comparison.ts`, because it is a
 * presentation decision: the rules module returns both values and which direction is
 * better, and how that becomes "+0,42 tốt hơn" is wording. A null on either side produces
 * no difference at all — §10.2 is explicit that "not evaluable" is not zero, and
 * subtracting from it would invent a number.
 */
function MetricTable({
  heading,
  rows,
}: {
  heading: string
  rows: readonly CompareMetric[]
}) {
  const columns = APP_STRINGS.compare.columns

  return (
    <section className="stack">
      <div className="section-head">
        <h2>{heading}</h2>
      </div>
      <div className="card">
        <div className="table-scroll">
          <table className="compare-table">
            <caption className="visually-hidden">{heading}</caption>
            <thead>
              <tr>
                <th scope="col">{columns.field}</th>
                <th scope="col">{columns.a}</th>
                <th scope="col">{columns.b}</th>
                <th scope="col">{columns.difference}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <MetricRow key={row.key} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function MetricRow({ row }: { row: CompareMetric }) {
  const delta = row.a === null || row.b === null ? null : row.b - row.a

  /**
   * Precision is decided per ROW, from both values together.
   *
   * Formatting each cell from its own magnitude made one row read as "0,650 vs 1,00" —
   * two precisions for the same quantity, which looks like two different measurements.
   * One decision per row keeps the columns comparable, which is the point of the screen.
   */
  const digits = rowDigits(row)

  /**
   * A difference that rounds away is NOT a difference.
   *
   * E* for two routes that agree to five decimals still differs by a float residue, and
   * the sign of that residue was rendered as "-0,00000 kém hơn" — noise presented as a
   * verdict about the learner's technique. The judgement is made on the DISPLAYED values,
   * so what the table calls equal is exactly what it shows as equal.
   */
  const shown = delta === null ? null : round(delta, digits)

  /**
   * Which side is ahead, in words as well as in colour.
   *
   * §10.2's accessibility requirement is that colour is never the only carrier of meaning,
   * so the cell says "tốt hơn"/"kém hơn" and the class only reinforces it.
   */
  const tone =
    shown === null || shown === 0
      ? 'same'
      : (shown > 0) === row.higherIsBetter
        ? 'better'
        : 'worse'

  return (
    <tr>
      <th scope="row">{metricLabel(row.key)}</th>
      <td>{formatValue(row.a, row.unit, digits)}</td>
      <td>{formatValue(row.b, row.unit, digits)}</td>
      <td className={`delta-${tone}`}>
        {shown === null ? (
          <span className="faint">—</span>
        ) : shown === 0 ? (
          <span className="faint">không đổi</span>
        ) : (
          <>
            {shown > 0 ? '+' : ''}
            {formatNumber(shown, digits)}
            {row.unit !== null && ` ${row.unit}`}
            <span className="tiny"> {tone === 'better' ? 'tốt hơn' : 'kém hơn'}</span>
          </>
        )}
      </td>
    </tr>
  )
}

/**
 * How many decimals this row's values need.
 *
 * Counts are whole things and must not read as "139,00 thao tác". Everything else takes
 * its precision from the smaller magnitude on the row, so a small dose keeps its
 * significant figures while a score does not grow a tail of zeros.
 */
function rowDigits(row: CompareMetric): number {
  if (INTEGER_METRIC_KEYS.has(row.key)) return 0

  const magnitudes = [row.a, row.b]
    .filter((value): value is number => value !== null)
    .map(Math.abs)
    .filter((value) => value > 0)

  if (magnitudes.length === 0) return 0

  const smallest = Math.min(...magnitudes)
  return smallest < 0.01 ? 5 : smallest < 1 ? 3 : 2
}

/** Metrics that count discrete things and therefore have no fractional part. */
const INTEGER_METRIC_KEYS: ReadonlySet<string> = new Set(['operationCount'])

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits))
}

/**
 * Row labels.
 *
 * Reuses the wording already published for the workbench and the report rather than
 * inventing a third phrasing for the same quantity — a learner who sees "Điểm tài nguyên"
 * on the workbench must not meet "Resource score" here.
 */
function metricLabel(key: string): string {
  const workbench = APP_STRINGS.workbench

  switch (key) {
    case 'overallScore':
      return workbench.overallScore
    case 'phScore':
      return 'Điểm pH'
    case 'resourceScore':
      return 'Điểm tài nguyên'
    case 'processScore':
      return 'Điểm quy trình'
    case 'achievementPercent':
      return 'Mức độ hoàn thành'
    case 'relativeCostIndex':
      return workbench.costIndex
    case 'safetyIndex':
      return 'Chỉ số an toàn sư phạm'
    case 'grossEquivalentsMmolEq':
      return 'Đương lượng base đã dùng'
    case 'targetEquivalentsMmolEq':
      return 'Đương lượng mục tiêu E*'
    case 'operationCount':
      return workbench.operationCount
    case 'waterLiters':
      return 'Nước'
    default:
      return reagentLabel(key)
  }
}

/**
 * A reagent row's label.
 *
 * Ledger keys are engine identifiers (`naoh`, `calciumHydroxide`), and printing them raw
 * produced a row headed "CALCIUMHYDROXIDE" — the table's uppercase heading style turned an
 * internal camelCase id into a word. The route labels already published in the content
 * bundle are the names the learner met on the workbench, so the same names are used here.
 * An unknown key falls back to the raw id rather than vanishing: a reagent nobody mapped
 * is still part of what was dosed.
 */
function reagentLabel(key: string): string {
  if (!key.startsWith('reagent.')) return key

  const id = key.slice('reagent.'.length)

  switch (id) {
    case 'naoh':
      return acidText(ROUTE_LABEL_KEYS.naoh)
    case 'calciumHydroxide':
      return acidText(ROUTE_LABEL_KEYS['calcium-hydroxide'])
    case 'sodiumCarbonate':
      return acidText(ROUTE_LABEL_KEYS['sodium-carbonate'])
    case 'correctionHcl':
      return 'HCl hiệu chỉnh'
    default:
      return id
  }
}

/** Null renders as an explicit "not evaluable", never as a dash that could read as zero. */
function formatValue(
  value: number | null,
  unit: string | null,
  digits: number,
): React.ReactNode {
  if (value === null) {
    return <span className="faint tiny">{APP_STRINGS.compare.notEvaluable}</span>
  }
  return (
    <>
      {formatNumber(value, digits)}
      {unit !== null && <span className="faint"> {unit}</span>}
    </>
  )
}

/** Vietnamese decimal comma, at the precision the row decided. */
function formatNumber(value: number, digits: number): string {
  return value.toFixed(digits).replace('.', ',')
}

/** §4.8: the web must EXPLAIN when two runs cannot be compared directly. */
function Incomparable({
  reason,
  a,
  b,
}: {
  reason: IncomparableReason
  a: CompareSide
  b: CompareSide
}) {
  const strings = APP_STRINGS.compare

  const body: Record<IncomparableReason, string> = {
    same_attempt: strings.sameChoice,
    incomplete: strings.notComparableIncomplete,
    scenario: strings.notComparableScenario,
    release: strings.notComparableRelease,
  }

  return (
    <section className="card card-pad card-accent stack rise rise-2" role="status">
      <h2>{strings.notComparableTitle}</h2>
      <p className="muted">{body[reason]}</p>

      {reason === 'release' && (
        <dl className="meta-list">
          <dt>{strings.pickA}</dt>
          <dd className="small">{a.releaseId}</dd>
          <dt>{strings.pickB}</dt>
          <dd className="small">{b.releaseId}</dd>
        </dl>
      )}

      <p className="row">
        <Link className="btn" href={`/reports/${a.attemptId}`}>
          Báo cáo lượt A
        </Link>
        <Link className="btn" href={`/reports/${b.attemptId}`}>
          Báo cáo lượt B
        </Link>
      </p>
    </section>
  )
}

/** Fewer than two finished runs: say what is missing and offer the one action that fixes it. */
function NotEnoughAttempts({ count }: { count: number }) {
  return (
    <div className="empty-state rise rise-1">
      <p className="eyebrow">Chưa so sánh được</p>
      <h2>{APP_STRINGS.compare.needTwo}</h2>
      {/* Two sentences rather than one interpolated clause: substituting a phrase into
          "Bạn đang có …" produced "Bạn đang có chưa có lượt nào đã hoàn thành" when the
          count was zero. Vietnamese negation does not fit that slot, so the zero case
          gets its own sentence. */}
      <p>
        {count === 0
          ? 'Bạn chưa hoàn thành lượt nào.'
          : `Bạn đã hoàn thành ${count} lượt.`}{' '}
        Hoàn thành thêm một lượt của cùng phiên bản kịch bản để mở bảng so sánh.
      </p>
      <div className="row">
        <Link className="btn btn-primary" href={`/simulate/${WORKBENCH_SCENARIO_KEY}`}>
          {APP_STRINGS.lab.startNew}
        </Link>
        <Link className="btn" href="/lab">
          {APP_STRINGS.nav.lab}
        </Link>
      </div>
    </div>
  )
}

function CompareSkeleton() {
  return (
    <div className="stack" aria-hidden="true">
      <div className="card stack">
        <div className="skeleton skeleton-line" style={{ width: '30%' }} />
        <div className="skeleton skeleton-block" />
      </div>
    </div>
  )
}
