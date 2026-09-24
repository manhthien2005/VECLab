'use client'

import {
  ACID_INPUT_DOMAIN,
  resolveMessage,
} from '@/content/index.js'
import type { AcidStringKey } from '@/content/index.js'
import {
  computeReagentMassG,
  computeReagentMmol,
} from '@/domain/experiments/acid-neutralization/index.js'
import type { CalculationTrace, Observation } from '@/domain/process/contracts.js'
import type {
  AcidNeutralizationState,
  AcidRoute,
} from '@/domain/experiments/acid-neutralization/state.js'
import type {
  AcidSessionState,
  ActionFeedback,
} from '@/application/simulation/acid-session.js'
import type { AcidProjection } from '@/application/scenarios/acid-projection.js'
import {
  formatCount,
  formatIndex,
  formatLitresAsMl,
  formatMmol,
  formatPh,
  formatPhTechnical,
  formatScientific,
  formatScore,
} from '@/shared/ui/format.js'
import {
  CHARGE_BALANCE_KEYS,
  ROUTE_DESCRIPTION_KEYS,
  ROUTE_LABEL_KEYS,
  acidText,
  penaltyText,
  phaseLabel,
  routeClarification,
} from './copy.js'
import type { TimelineEntry } from './timeline.js'
import { WarningItem } from '@/shared/ui/warning-item.js'
import { PhMeter } from '@/shared/ui/ph-meter.js'

/**
 * Presentational panels of the simulation workbench (docs/web-application-scope.md §4.6).
 *
 * Client components, but stateless: they render a session state and nothing else, and
 * they dispatch no actions. Keeping them pure is what makes the state machine in
 * `workbench-client.tsx` the single place that knows about storage, busy flags and
 * conflicts — a panel that fetched or mutated on its own would be a second source of
 * truth about what the learner has done.
 *
 * Each panel corresponds to one of the twelve mandatory information groups, so a
 * reviewer can check §4.6 coverage against this file alone.
 */

/** §4.6 group 1 — goal and scenario version. */
export function GoalPanel({ projection }: { projection: AcidProjection }) {
  const benchmark = ACID_INPUT_DOMAIN.benchmark

  return (
    <section className="card stack-tight">
      {/* The release id used to sit here as a badge. It is shown once on the workbench's
          status bar instead — repeating it on every panel that could claim it made the
          screen look like three different documents. */}
      <h2>{acidText('scenarios.acid-neutralization.target-label')}</h2>

      <p className="ph-readout" aria-label={acidText('scenarios.acid-neutralization.ph-label')}>
        {formatPh(projection.phStar)}
        <span className="small faint"> pH*</span>
      </p>

      <PhMeter phStar={projection.phStar} />

      <dl className="meta-list">
        <dt>{acidText('scenarios.acid-neutralization.target-label')}</dt>
        <dd>{formatPh(benchmark.targetPH)}</dd>
        <dt>Dung sai</dt>
        <dd>± {formatPh(benchmark.targetTolerancePH)}</dd>
        <dt>Trạng thái</dt>
        <dd>
          {projection.goalMet ? (
            <span className="badge badge-ok">đạt mục tiêu</span>
          ) : (
            <span className="badge">chưa đạt</span>
          )}
        </dd>
      </dl>

      {/* §4.6 group 3: a reading that no longer describes the sample must say so at the
          point of display, not only in a footnote. The engine clears lastMeasuredPH on
          composition change, so a stale number is impossible — but a measurement of the
          CURRENT composition is still worth confirming. */}
      {projection.phStar !== null && !projection.measurementCurrent && (
        <p className="alert alert-warn small">Số đo không còn mô tả mẫu hiện tại.</p>
      )}

      <p className="tiny faint">{acidText('scenarios.acid-neutralization.ph-explanation')}</p>
      <p className="tiny faint">{acidText('scenarios.acid-neutralization.target-band')}</p>
    </section>
  )
}

/** §4.6 group 2 — progress and action history. */
export function ProgressPanel({
  session,
  events,
}: {
  session: AcidSessionState
  events: readonly TimelineEntry[]
}) {
  return (
    <section className="card stack-tight">
      <div className="card-header">
        <h2>Tiến trình</h2>
        <span className={`badge ${session.status === 'completed' ? 'badge-ok' : ''}`}>
          {phaseLabel(session.domain.phase)}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="timeline-empty">
          Chưa có thao tác nào. Bắt đầu bằng cách chọn chất trung hòa.
        </p>
      ) : (
        <ol className="timeline">
          {events.map((event, index) => (
            <li
              key={`${event.sequence}-${event.actionId}`}
              data-current={index === events.length - 1 ? 'true' : undefined}
            >
              <strong>{event.actionLabel}</strong>
              {event.summary !== null && (
                <span className="faint small"> — {event.summary}</span>
              )}
              <br />
              <span className="tiny faint">
                event {event.sequence}
                {event.revertedBySequence !== null && ` · đã hoàn tác ở ${event.revertedBySequence}`}
                {event.undoOfSequence !== null && ` · hoàn tác event ${event.undoOfSequence}`}
              </span>
            </li>
          ))}
        </ol>
      )}

      <dl className="meta-list">
        <dt>Số thao tác đã ghi</dt>
        <dd>{formatCount(session.lastSequence)}</dd>
        <dt>{acidText('resources.operation-count-label')}</dt>
        <dd>{formatCount(session.projection.operationCount)}</dd>
        <dt>{acidText('resources.aliquot-count-label')}</dt>
        <dd>
          {formatCount(session.domain.aliquotHistory.length)} /{' '}
          {ACID_INPUT_DOMAIN.limits.maxReagentAdditions}
        </dd>
      </dl>
    </section>
  )
}

/** §4.6 group 3 — current state of the experiment. */
export function StatePanel({ session }: { session: AcidSessionState }) {
  const state = session.domain
  const projection = session.projection

  return (
    <section className="card stack-tight">
      <h2>Trạng thái hiện tại</h2>

      <dl className="meta-list">
        <dt>Chất trung hòa</dt>
        <dd>{state.route === null ? 'chưa chọn' : acidText(ROUTE_LABEL_KEYS[state.route])}</dd>
        <dt>Bước hiện tại</dt>
        <dd>{phaseLabel(state.phase)}</dd>
        <dt>Máy đo đã hiệu chuẩn</dt>
        <dd>{state.meterCalibrated ? 'có' : 'chưa'}</dd>
        <dt>Đã khuấy sau lần thêm cuối</dt>
        <dd>{state.mixedSinceLastAddition ? 'có' : 'chưa'}</dd>
        <dt>Số đọc ổn định</dt>
        <dd>{state.readingStable ? 'có' : 'chưa'}</dd>
        <dt>Tổng thể tích</dt>
        <dd>{formatLitresAsMl(state.totalVolumeL)}</dd>
        <dt>Thể tích base</dt>
        <dd>{formatLitresAsMl(state.baseVolumeL)}</dd>
        <dt>HCl hiệu chỉnh</dt>
        <dd>{formatLitresAsMl(state.correctionAcidVolumeL)}</dd>
        <dt>Lần sửa thành phần</dt>
        <dd>{formatCount(state.compositionRevision)}</dd>
      </dl>

      {/* §4.6 group 4 — expected observable phenomena. Driven by the route rather than
          by a hardcoded list, because only Ca(OH)₂ forms a hydroxo complex and only
          Na₂CO₃ is a closed-system carbonate buffer: telling a learner to expect
          effervescence on the NaOH route would be a false observation. */}
      <div>
        <h3 className="eyebrow">Hiện tượng dự kiến</h3>
        <ul className="stack-tight small">
          {expectedPhenomena(state).map((key) => (
            <li key={key}>{acidText(key)}</li>
          ))}
        </ul>
      </div>

      {/*
        NOT-YET-EVALUATED IS NOT INVALID.

        `modelValid` starts false on a fresh attempt because nothing has been solved yet
        (engine.ts: "modelValid starts false because there is nothing evaluated yet"), and
        it goes false again after every composition change until the next `measure_ph`.
        Rendering that as a red "Mô hình không hợp lệ" told a learner their run was broken
        before they had done anything at all — the first thing on screen was an error about
        a state that is completely normal.

        The two cases are distinguished by whether the engine recorded a REASON. Reason
        codes present means an invariant was actually violated and the run is blocked;
        none means the model simply has nothing to solve yet, which is a neutral fact and
        is stated as the next step instead of as a failure.
      */}
      {!state.modelValid &&
        (state.invalidReasonCodes.length > 0 ? (
          <p className="alert alert-danger small" role="alert">
            <strong>Mô hình không hợp lệ:</strong> {state.invalidReasonCodes.join(', ')}
            {projection.overallScore === null &&
              ` — ${acidText('resources.not-evaluable-explanation')}`}
          </p>
        ) : (
          <p className="alert alert-info small">
            Chưa có nghiệm cân bằng cho thành phần hiện tại. Khuấy và đo pH để mô hình tính
            lại; các chỉ số phụ thuộc phép đo sẽ để trống cho tới lúc đó.
          </p>
        ))}

      {state.route !== null && (
        <p className="tiny faint">{routeClarification(state.route)}</p>
      )}
    </section>
  )
}

/** §4.6 group 5 — the key scientific metrics. */
export function MetricsPanel({ session }: { session: AcidSessionState }) {
  const projection = session.projection

  return (
    <section className="card stack-tight">
      <h2>Chỉ số khoa học</h2>

      <dl className="meta-list">
        <dt>{acidText('scoring.overall-label')}</dt>
        <dd>
          {projection.overallScore === null
            ? acidText('resources.not-evaluable')
            : formatScore(projection.overallScore)}
        </dd>
        <dt>{acidText('scoring.ph-component')}</dt>
        <dd>{formatScore(projection.phScore)}</dd>
        <dt>{acidText('scoring.resource-component')}</dt>
        <dd>
          {projection.resourceScore === null
            ? acidText('resources.not-evaluable')
            : formatScore(projection.resourceScore)}
        </dd>
        <dt>{acidText('scoring.process-component')}</dt>
        <dd>{formatScore(projection.processScore)}</dd>
        <dt>{acidText('resources.cost-index-label')}</dt>
        <dd>{formatIndex(projection.relativeCostIndex)}</dd>
        <dt>{acidText('resources.safety-index-label')}</dt>
        <dd>{formatIndex(projection.safetyIndex)}</dd>
      </dl>

      {/* The score breakdown is shown in full, never as one collapsed number: §4.6
          group 5 requires the important scientific metrics, and a learner who cannot
          see why resource score is N/A cannot act on it. */}
      <table>
        <caption className="visually-hidden">
          Đương lượng đã dùng so với đương lượng mục tiêu
        </caption>
        <thead>
          <tr>
            <th scope="col">Đại lượng</th>
            <th scope="col" className="num">
              Giá trị
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Đương lượng mục tiêu E* (mmol eq)</td>
            <td className="num">{formatMmol(projection.targetEquivalentsMmolEq)}</td>
          </tr>
          <tr>
            <td>Đương lượng base đã dùng (mmol eq)</td>
            <td className="num">{formatMmol(projection.grossEquivalentsMmolEq)}</td>
          </tr>
          <tr>
            <td>pH* (đầy đủ chữ số)</td>
            <td className="num">{formatPhTechnical(projection.phStar)}</td>
          </tr>
          <tr>
            <td>{acidText('resources.reagent-mass-label')}</td>
            <td className="num">
              {reagentMasses(session.domain)
                .map((entry) => `${entry.label} ${formatMmol(entry.grams)} g`)
                .join(' · ') || '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {projection.safetyPenaltyCodes.length > 0 && (
        <ul className="stack-tight small">
          {projection.safetyPenaltyCodes.map((code) => (
            <li key={code}>
              <span className="badge badge-warn">{code}</span>{' '}
              {penaltyText(code)}
            </li>
          ))}
        </ul>
      )}

      <p className="tiny faint">{acidText('scoring.rubric-disclosure')}</p>
      <p className="tiny faint">{acidText('resources.cost-index-explanation')}</p>
      <p className="tiny faint">{acidText('resources.safety-index-explanation')}</p>
    </section>
  )
}

/** §4.6 group 8 — feedback after an action. */
export function FeedbackPanel({ feedback }: { feedback: ActionFeedback }) {
  return (
    <section className="card stack-tight" aria-live="polite">
      <h2>Phản hồi sau thao tác</h2>

      <p className="small muted">
        Đã ghi <strong>{feedback.actionType}</strong> (event {feedback.sequence})
        {feedback.idempotentReplay && (
          <> — thao tác này đã được ghi trước đó nên không lưu lần nữa.</>
        )}
      </p>

      {feedback.observations.length > 0 && (
        <ul className="stack-tight small">
          {feedback.observations.map((observation) => (
            <ObservationItem key={observation.code} observation={observation} />
          ))}
        </ul>
      )}

      {feedback.warnings.map((warning) => (
        <WarningItem key={`${feedback.sequence}-${warning.code}`} warning={warning} />
      ))}

      {feedback.calculationTrace.length > 0 && (
        <details className="disclosure">
          <summary>Công thức và dữ liệu trung gian</summary>
          <div className="disclosure-body">
            <TraceList trace={feedback.calculationTrace} />
          </div>
        </details>
      )}
    </section>
  )
}

function ObservationItem({ observation }: { observation: Observation }) {
  return (
    <li>
      <strong>{resolveMessage(observation.titleKey, observation.data)}</strong>
      <br />
      <span className="muted">{resolveMessage(observation.detailKey, observation.data)}</span>
    </li>
  )
}

/** §4.6 group 9 — formulas and intermediate data, behind progressive disclosure. */
export function FormulasPanel({ session }: { session: AcidSessionState }) {
  const route = session.domain.route
  const equilibrium = session.domain.equilibrium

  return (
    <section className="card stack-tight">
      <h2>Công thức và dữ liệu trung gian</h2>

      <p className="small">{acidText('formulas.ph-definition')}</p>
      <p className="small">{acidText('formulas.kw')}</p>
      <p className="small">{acidText('formulas.equivalent-dose')}</p>

      {/* Only the charge balance for the route actually in effect is shown. Printing all
          three would imply the model averages them, and printing none would leave the
          learner without the equation that produced their number. */}
      {route !== null && (
        <p className="small">{acidText(CHARGE_BALANCE_KEYS[route])}</p>
      )}
      {route === 'sodium-carbonate' && (
        <p className="small">{acidText('formulas.carbon-fractions')}</p>
      )}
      <p className="small">{acidText('formulas.charge-residual')}</p>

      {equilibrium !== null && (
        <details className="disclosure" open>
          <summary>Nghiệm cân bằng hiện tại</summary>
          <div className="disclosure-body">
            <table>
              <caption className="visually-hidden">
                Nồng độ các loài và phần dư cân bằng điện tích
              </caption>
              <thead>
                <tr>
                  <th scope="col">Đại lượng</th>
                  <th scope="col" className="num">
                    Giá trị (mol/L)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>[H⁺]</td>
                  <td className="num">{formatScientific(equilibrium.hydrogenMolL)}</td>
                </tr>
                <tr>
                  <td>[OH⁻]</td>
                  <td className="num">{formatScientific(equilibrium.hydroxideMolL)}</td>
                </tr>
                {equilibrium.calciumMolL !== undefined && (
                  <tr>
                    <td>[Ca²⁺]</td>
                    <td className="num">{formatScientific(equilibrium.calciumMolL)}</td>
                  </tr>
                )}
                {equilibrium.calciumHydroxideComplexMolL !== undefined && (
                  <tr>
                    <td>[CaOH⁺]</td>
                    <td className="num">
                      {formatScientific(equilibrium.calciumHydroxideComplexMolL)}
                    </td>
                  </tr>
                )}
                {equilibrium.totalInorganicCarbonMolL !== undefined && (
                  <tr>
                    <td>C_T (carbon vô cơ tổng)</td>
                    <td className="num">
                      {formatScientific(equilibrium.totalInorganicCarbonMolL)}
                    </td>
                  </tr>
                )}
                {equilibrium.carbonFractions !== undefined && (
                  <>
                    <tr>
                      <td>α CO₂*</td>
                      <td className="num">
                        {formatScientific(equilibrium.carbonFractions.co2Star)}
                      </td>
                    </tr>
                    <tr>
                      <td>α HCO₃⁻</td>
                      <td className="num">
                        {formatScientific(equilibrium.carbonFractions.bicarbonate)}
                      </td>
                    </tr>
                    <tr>
                      <td>α CO₃²⁻</td>
                      <td className="num">
                        {formatScientific(equilibrium.carbonFractions.carbonate)}
                      </td>
                    </tr>
                  </>
                )}
                <tr>
                  <td>Phần dư cân bằng điện tích</td>
                  <td className="num">
                    {formatScientific(equilibrium.chargeBalanceResidualMolL)}
                  </td>
                </tr>
                <tr>
                  <td>pH* (5 chữ số)</td>
                  <td className="num">{formatPhTechnical(equilibrium.simulatedPH)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  )
}

/** The calculation trace of one action, as the formulas disclosure renders it. */
export function TraceList({ trace }: { trace: readonly CalculationTrace[] }) {
  if (trace.length === 0) return null

  return (
    <table>
      <caption className="visually-hidden">
        Phương trình đã dùng, đầu vào, đầu ra và nguồn
      </caption>
      <thead>
        <tr>
          <th scope="col">Phương trình</th>
          <th scope="col">Đầu vào</th>
          <th scope="col">Đầu ra</th>
          <th scope="col">Nguồn</th>
        </tr>
      </thead>
      <tbody>
        {trace.map((entry, index) => (
          <tr key={`${entry.equationKey}-${index}`}>
            <td>
              <code>{entry.equationKey}</code>
            </td>
            <td className="small">{formatPairs(entry.inputs)}</td>
            <td className="small">{formatPairs(entry.outputs)}</td>
            <td className="small faint">{entry.sourceKeys.join(', ') || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * The phenomena a learner should expect for the route in effect.
 *
 * Route-conditional on purpose (§4.6 group 4). The carbonate clarification mentions a
 * pH* near 4.48 at 25 mL, which is only true of Na₂CO₃; showing it on the NaOH route
 * would contradict the number on screen.
 */
function expectedPhenomena(state: AcidNeutralizationState): AcidStringKey[] {
  const keys: AcidStringKey[] = []

  if (state.route === null) {
    keys.push('routes.naoh.description', 'routes.calcium-hydroxide.description', 'routes.sodium-carbonate.description')
    return keys
  }

  keys.push(ROUTE_DESCRIPTION_KEYS[state.route])

  if (state.route === 'calcium-hydroxide') {
    keys.push('observations.calcium.complex', 'routes.calcium-hydroxide.clarification')
  }
  if (state.route === 'sodium-carbonate') {
    keys.push('observations.carbonate.equilibrium')
  }
  if (state.correctionAcidVolumeL > 0) {
    keys.push('observations.correction.applied')
  }

  return keys
}

/** Reagent masses actually consumed, for the metrics panel. */
function reagentMasses(
  state: AcidNeutralizationState,
): Array<{ label: string; grams: number }> {
  // Computed through the domain's own functions rather than from literals copied here.
  // Molar masses and stock concentrations are LOCKED release constants; restating them
  // in a component would make the panel show a different mass than the report the moment
  // either value changed, and nothing would catch it.
  const mmol = computeReagentMmol(state)
  const grams = computeReagentMassG(mmol)

  const out: Array<{ label: string; grams: number }> = []

  if (state.route !== null && mmol[routeToMmolKey(state.route)] > 0) {
    out.push({
      label: acidText(ROUTE_LABEL_KEYS[state.route]),
      grams: grams[routeToMmolKey(state.route)] ?? 0,
    })
  }

  if (mmol.correctionHcl > 0) {
    out.push({
      label: 'HCl',
      grams: grams.correctionHcl ?? 0,
    })
  }

  return out
}

/** Route id to the key used by `computeReagentMmol`'s output record. */
function routeToMmolKey(route: AcidRoute): 'naoh' | 'calciumHydroxide' | 'sodiumCarbonate' {
  switch (route) {
    case 'calcium-hydroxide':
      return 'calciumHydroxide'
    case 'sodium-carbonate':
      return 'sodiumCarbonate'
    case 'naoh':
      return 'naoh'
  }
}

/** A key/value record as a readable single line. */
function formatPairs(pairs: Record<string, number | string>): string {
  const entries = Object.entries(pairs)
  if (entries.length === 0) return '—'
  return entries.map(([key, value]) => `${key}=${value}`).join('; ')
}
