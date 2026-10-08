import type { ActionAvailability } from '@/application/simulation/acid-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { APP_STRINGS } from '@/content/index.js'
import type { WorkbenchMode } from '../controller/types.js'

/**
 * The six learner-issued guided actions, in pedagogical order after setup.
 *
 * Engine availability still decides what CAN run. This module only picks the ONE
 * action the workbench should present as “next”, so the rail and the control
 * panel cannot disagree.
 */
export type GuidedActionType =
  | 'select_route'
  | 'calibrate_meter'
  | 'wait_for_stable_reading'
  | 'measure_ph'
  | 'add_base'
  | 'mix'

export type ProtocolStepStatus = 'done' | 'active' | 'upcoming'

export type ProtocolStep = {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly actionType: GuidedActionType | null
  readonly status: ProtocolStepStatus
}

export function workbenchModeLabel(mode: WorkbenchMode): string {
  return mode === 'GUIDED'
    ? APP_STRINGS.workbench.modeGuided
    : APP_STRINGS.workbench.modeExplore
}

function isAvail(
  availableActions: readonly ActionAvailability[],
  type: GuidedActionType,
): boolean {
  return availableActions.some((entry) => entry.actionType === type && entry.available)
}

function isCurrentMeasurement(domain: AcidNeutralizationState | null | undefined): boolean {
  return (
    domain != null &&
    domain.lastMeasuredPH !== null &&
    domain.lastMeasuredCompositionRevision === domain.compositionRevision
  )
}

/**
 * Recommended next guided action.
 *
 * Order: choose reagent (only while none is set) → calibrate (only while the
 * meter is uncalibrated) → (if this composition is unread) mix if needed,
 * wait, measure → otherwise add a dose.
 */
export function resolveNextGuidedAction(
  domain: AcidNeutralizationState | null | undefined,
  availableActions: readonly ActionAvailability[],
): GuidedActionType | null {
  const routeChosen = domain?.route != null
  const meterCalibrated = domain?.meterCalibrated === true
  // Engine still allows changing reagent until the first dose, and allows
  // calibrating again. The one CTA must not stay on those steps after they
  // are already done.
  if (isAvail(availableActions, 'select_route') && !routeChosen) {
    return 'select_route'
  }
  if (isAvail(availableActions, 'calibrate_meter') && !meterCalibrated) {
    return 'calibrate_meter'
  }

  const measured = isCurrentMeasurement(domain)
  const stirred = domain?.mixedSinceLastAddition === true
  const stable = domain?.readingStable === true

  if (!measured) {
    if (isAvail(availableActions, 'mix') && !stirred) return 'mix'
    if (isAvail(availableActions, 'wait_for_stable_reading') && !stable) {
      return 'wait_for_stable_reading'
    }
    if (isAvail(availableActions, 'measure_ph')) return 'measure_ph'
  }

  if (isAvail(availableActions, 'add_base')) return 'add_base'
  return null
}

function stepStatus(
  actionType: GuidedActionType | null,
  next: GuidedActionType | null,
  done: boolean,
): ProtocolStepStatus {
  if (actionType !== null && actionType === next) return 'active'
  if (done) return 'done'
  return 'upcoming'
}

export function buildProtocolSteps(
  domain: AcidNeutralizationState | null | undefined,
  availableActions: readonly ActionAvailability[],
): readonly ProtocolStep[] {
  const next = resolveNextGuidedAction(domain, availableActions)
  const routeSelected = domain?.route !== null && domain?.route !== undefined
  const calibrated = domain?.meterCalibrated === true
  const hasAdded = (domain?.baseVolumeL ?? 0) > 0
  const stirred = domain?.mixedSinceLastAddition === true
  const stable = domain?.readingStable === true
  const measured = isCurrentMeasurement(domain)

  return [
    {
      id: 'step-prep',
      label: '1. Chuẩn bị mẫu HCl',
      description: 'Dung dịch mẫu đã được đong vào cốc phản ứng.',
      actionType: null,
      status: 'done',
    },
    {
      id: 'step-route',
      label: '2. Chọn dung dịch chuẩn (NaOH)',
      description: 'Xác định dung dịch chuẩn trên buret.',
      actionType: 'select_route',
      status: stepStatus('select_route', next, routeSelected),
    },
    {
      id: 'step-calibrate',
      label: '3. Hiệu chuẩn máy đo pH',
      description: 'Chuẩn hóa cảm biến pH trước khi ghi nhận số đo.',
      actionType: 'calibrate_meter',
      status: stepStatus('calibrate_meter', next, calibrated),
    },
    {
      id: 'step-wait',
      label: '4. Chờ số đọc ổn định',
      description: 'Chờ cân bằng nhiệt độ và điện thế màng điện cực.',
      actionType: 'wait_for_stable_reading',
      status: stepStatus('wait_for_stable_reading', next, stable && next !== 'wait_for_stable_reading'),
    },
    {
      id: 'step-measure',
      label: '5. Ghi nhận số đo pH',
      description: 'Ghi số đo pH vào bảng dữ liệu và đường cong.',
      actionType: 'measure_ph',
      status: stepStatus('measure_ph', next, measured && next !== 'measure_ph'),
    },
    {
      id: 'step-add',
      label: '6. Thêm dung dịch NaOH',
      description: 'Nhỏ một lượng từ buret vào cốc.',
      actionType: 'add_base',
      status: stepStatus('add_base', next, hasAdded && next !== 'add_base'),
    },
    {
      id: 'step-mix',
      label: '7. Khuấy đều dung dịch',
      description: 'Bật máy khuấy từ để phản ứng đồng nhất.',
      actionType: 'mix',
      status: stepStatus(
        'mix',
        next,
        stirred && hasAdded && (next === 'wait_for_stable_reading' || next === 'measure_ph'),
      ),
    },
  ]
}

const DONE_FEEDBACK: Record<string, string> = {
  select_route: 'Đã chọn NaOH.',
  calibrate_meter: 'Đã hiệu chuẩn máy đo pH.',
  add_base: 'Đã thêm dung dịch NaOH.',
  mix: 'Đã khuấy dung dịch.',
  wait_for_stable_reading: 'Số đọc đã ổn định.',
  measure_ph: 'Đã ghi nhận số đo pH.',
  undo_last: 'Đã hoàn tác thao tác cuối.',
  complete: 'Đã hoàn thành lượt.',
  completed: 'Đã hoàn thành lượt.',
}

const NEXT_FEEDBACK: Record<GuidedActionType, string> = {
  select_route: 'Tiếp theo: chọn dung dịch chuẩn NaOH.',
  calibrate_meter: 'Tiếp theo: hiệu chuẩn máy đo pH.',
  wait_for_stable_reading: 'Tiếp theo: chờ số đọc ổn định.',
  measure_ph: 'Tiếp theo: đo giá trị pH.',
  add_base: 'Tiếp theo: thêm NaOH.',
  mix: 'Tiếp theo: khuấy dung dịch.',
}

export function guidedFeedbackLine(
  lastActionType: string | null,
  next: GuidedActionType | null,
): string | null {
  if (lastActionType === null && next === null) return null

  const done = lastActionType === null ? null : (DONE_FEEDBACK[lastActionType] ?? null)
  const following = next === null ? null : NEXT_FEEDBACK[next]

  if (done !== null && following !== null) return `${done} ${following}`
  return done ?? following
}
