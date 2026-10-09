'use client'

import { useId } from 'react'
import type { ActionAvailability } from '@/application/simulation/acid-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { PERMITTED_ALIQUOTS_L } from '@/domain/experiments/acid-neutralization/constants.js'
import { formatLitresAsMl } from '@/shared/ui/format.js'
import { APP_STRINGS, resolveMessage } from '@/content/index.js'
import type { OperationStage, WorkbenchMode } from '../controller/types.js'
import {
  guidedFeedbackLine,
  resolveNextGuidedAction,
  type GuidedActionType,
  workbenchModeLabel,
} from '../guidance/protocol.js'

export type TitrationControlsProps = {
  readonly mode: WorkbenchMode
  readonly domain?: AcidNeutralizationState | null
  readonly availableActions: readonly ActionAvailability[]
  readonly selectedAliquotL: number
  readonly busy: boolean
  readonly operationStage: OperationStage
  readonly isPreStart: boolean
  readonly isExploreDispenseAvailable: boolean
  readonly isUndoAvailable: boolean
  readonly isCompleteAvailable: boolean
  readonly lastActionType?: string | null
  readonly dosingFinished?: boolean
  readonly onAliquotChange: (aliquotL: number) => void
  readonly onSelectRoute: () => void
  readonly onCalibrate: () => void
  readonly onAddBase: () => void
  readonly onMix: () => void
  readonly onWait: () => void
  readonly onMeasurePh: () => void
  readonly onAddCorrectionAcid: () => void
  readonly onDispenseAndMeasure: () => void
  readonly onUndo: () => void
  readonly onComplete: () => void
  readonly onFinishDosing: () => void
  readonly className?: string
}

const BUSY_LABEL: Partial<Record<OperationStage, string>> = {
  dispensing: 'Đang thêm dung dịch…',
  mixing: 'Đang khuấy…',
  stabilizing: 'Đang chờ ổn định…',
  measuring: 'Đang đo pH…',
  calibrating: 'Đang hiệu chuẩn…',
  selecting_route: 'Đang nạp buret…',
}

export function TitrationControls({
  mode,
  domain,
  availableActions,
  selectedAliquotL,
  busy,
  operationStage,
  isPreStart,
  isExploreDispenseAvailable,
  isUndoAvailable,
  isCompleteAvailable,
  lastActionType = null,
  dosingFinished = false,
  onAliquotChange,
  onSelectRoute,
  onCalibrate,
  onAddBase,
  onMix,
  onWait,
  onMeasurePh,
  onAddCorrectionAcid,
  onDispenseAndMeasure,
  onUndo,
  onComplete,
  onFinishDosing,
  className = '',
}: TitrationControlsProps) {
  const aliquotFieldsetId = useId()
  const nextGuided = resolveNextGuidedAction(domain, availableActions, { dosingFinished })

  const findAction = (type: string): ActionAvailability | undefined =>
    availableActions.find((entry) => entry.actionType === type)

  const isActionDisabled = (type: string): boolean => {
    if (busy || isPreStart) return true
    return findAction(type)?.available !== true
  }

  const getReason = (type: string): string | null => {
    const entry = findAction(type)
    if (!entry || entry.available || !entry.reasonKey) return null
    return resolveMessage(entry.reasonKey, entry.reasonData)
  }

  if (isPreStart) {
    return (
      <section className={`wb-controls-card card stack ${className}`} aria-labelledby="wb-controls-title">
        <h3 id="wb-controls-title" className="wb-section-heading">
          {APP_STRINGS.workbench.actionsHeading}
        </h3>
        <p className="hint">
          Bảng thao tác chuẩn độ sẽ mở sau khi bạn bấm <strong>“Bắt đầu thí nghiệm”</strong>.
        </p>
      </section>
    )
  }

  const showAliquot = mode === 'EXPLORE' || nextGuided === 'add_base'
  const feedback =
    mode === 'GUIDED'
      ? guidedFeedbackLine(lastActionType, nextGuided)
      : lastActionType === 'measure_ph' || lastActionType === 'add_base'
        ? 'Đã thêm, khuấy, chờ và đo. Chọn thể tích rồi thêm tiếp, hoặc kết thúc lượt.'
        : null

  return (
    <section className={`wb-controls-card card stack ${className}`} aria-labelledby="wb-controls-title">
      <div className="wb-controls-header">
        <h3 id="wb-controls-title" className="wb-section-heading">
          {APP_STRINGS.workbench.actionsHeading}
        </h3>
        <span className="badge badge-accent badge-sm">{workbenchModeLabel(mode)}</span>
      </div>

      {feedback !== null && (
        <p className="wb-action-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      )}

      {showAliquot && (
        <fieldset className="field" id={aliquotFieldsetId} disabled={busy}>
          <legend className="wb-field-label">{APP_STRINGS.workbench.aliquotLegend}</legend>
          <div className="wb-aliquot-segmented" role="radiogroup" aria-label="Chọn thể tích mỗi lần thêm">
            {PERMITTED_ALIQUOTS_L.map((litres) => {
              const isSelected = selectedAliquotL === litres
              const label = formatLitresAsMl(litres)
              return (
                <button
                  key={litres}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`wb-aliquot-button ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onAliquotChange(litres)}
                  disabled={busy}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <p className="hint tiny">
            Đang chọn: <strong>{formatLitresAsMl(selectedAliquotL)}</strong> dung dịch NaOH
          </p>
        </fieldset>
      )}

      {mode === 'EXPLORE' ? (
        <div className="wb-explore-actions stack-tight">
          <div className="wb-primary-action-wrap">
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block wb-btn-hero"
              disabled={busy || !isExploreDispenseAvailable}
              onClick={() => onDispenseAndMeasure()}
              aria-busy={busy}
            >
              {busy ? (
                <span className="wb-spinner-text">
                  {BUSY_LABEL[operationStage] ?? 'Đang xử lý…'}
                </span>
              ) : (
                `Thêm & Đo (${formatLitresAsMl(selectedAliquotL)})`
              )}
            </button>
          </div>
          {getReason('add_base') && (
            <p className="hint tiny text-warn" role="alert">
              {getReason('add_base')}
            </p>
          )}
          <p className="hint tiny">
            Một lần bấm thực hiện: Thêm NaOH → Khuấy → Chờ ổn định → Đo pH.
          </p>
        </div>
      ) : (
        <GuidedPrimaryAction
          next={nextGuided}
          selectedAliquotL={selectedAliquotL}
          busy={busy}
          operationStage={operationStage}
          disabled={nextGuided === null || isActionDisabled(nextGuided)}
          reason={nextGuided === null ? getReason('complete') : getReason(nextGuided)}
          onSelectRoute={onSelectRoute}
          onCalibrate={onCalibrate}
          onAddBase={onAddBase}
          onMix={onMix}
          onWait={onWait}
          onMeasurePh={onMeasurePh}
          showFinishDosing={
            nextGuided === 'add_base' && domain?.mixedSinceLastAddition === false
          }
          onFinishDosing={onFinishDosing}
        />
      )}

      <details className="disclosure wb-other-actions">
        <summary>{APP_STRINGS.workbench.otherActions}</summary>
        <div className="disclosure-body stack-tight">
          <button
            type="button"
            className="btn btn-sm btn-outline-danger btn-block"
            disabled={isActionDisabled('add_correction_acid')}
            onClick={() => onAddCorrectionAcid()}
          >
            Thêm {formatLitresAsMl(selectedAliquotL)} HCl hiệu chỉnh
          </button>
          {!isActionDisabled('add_correction_acid') && (
            <p className="hint tiny text-warn">
              Thêm HCl hiệu chỉnh tính điểm phạt an toàn và không hoàn tác được.
            </p>
          )}
          {!showAliquot && (
            <p className="hint tiny">
              Dùng cỡ {formatLitresAsMl(selectedAliquotL)}. Đổi thể tích khi bước tiếp theo là thêm
              NaOH.
            </p>
          )}
        </div>
      </details>

      <div className="wb-terminal-actions pt-2 border-t stack-tight">
        <div className="wb-secondary-row row">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={busy || !isUndoAvailable}
            onClick={() => onUndo()}
            title={
              isUndoAvailable ? 'Hoàn tác thao tác cuối' : 'Chỉ hoàn tác được trước khi thêm bazơ'
            }
          >
            Hoàn tác
          </button>

          <button
            type="button"
            className="btn btn-sm btn-accent"
            disabled={busy || !isCompleteAvailable}
            onClick={() => onComplete()}
          >
            Hoàn thành thí nghiệm
          </button>
        </div>
        {getReason('complete') && (
          <p className="hint tiny text-muted">{getReason('complete')}</p>
        )}
      </div>
    </section>
  )
}

function GuidedPrimaryAction({
  next,
  selectedAliquotL,
  busy,
  operationStage,
  disabled,
  reason,
  onSelectRoute,
  onCalibrate,
  onAddBase,
  onMix,
  onWait,
  onMeasurePh,
  showFinishDosing,
  onFinishDosing,
}: {
  readonly next: GuidedActionType | null
  readonly selectedAliquotL: number
  readonly busy: boolean
  readonly operationStage: OperationStage
  readonly disabled: boolean
  readonly reason: string | null
  readonly onSelectRoute: () => void
  readonly onCalibrate: () => void
  readonly onAddBase: () => void
  readonly onMix: () => void
  readonly onWait: () => void
  readonly onMeasurePh: () => void
  readonly showFinishDosing: boolean
  readonly onFinishDosing: () => void
}) {
  const run = (): void => {
    switch (next) {
      case 'select_route':
        onSelectRoute()
        return
      case 'calibrate_meter':
        onCalibrate()
        return
      case 'add_base':
        onAddBase()
        return
      case 'mix':
        onMix()
        return
      case 'wait_for_stable_reading':
        onWait()
        return
      case 'measure_ph':
        onMeasurePh()
        return
      case null:
        return
    }
  }

  const label = guidedPrimaryLabel(next, selectedAliquotL)

  return (
    <div className="wb-guided-actions stack-tight">
      {next === null ? (
        <p className="hint">Không còn thao tác chuẩn độ. Kết thúc lượt nếu đã đủ số đo.</p>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block wb-btn-hero"
          disabled={disabled}
          onClick={run}
          aria-busy={busy}
        >
          {busy ? (BUSY_LABEL[operationStage] ?? 'Đang xử lý…') : label}
        </button>
      )}
      {showFinishDosing ? (
        <button
          type="button"
          className="btn btn-outline btn-block"
          disabled={busy}
          onClick={onFinishDosing}
        >
          {APP_STRINGS.workbench.finishDosing}
        </button>
      ) : null}
      {reason !== null && (
        <p className="hint tiny text-warn" role="alert">
          {reason}
        </p>
      )}
    </div>
  )
}

function guidedPrimaryLabel(next: GuidedActionType | null, selectedAliquotL: number): string {
  switch (next) {
    case 'select_route':
      return 'Chọn dung dịch chuẩn NaOH'
    case 'calibrate_meter':
      return 'Hiệu chuẩn máy đo pH'
    case 'add_base':
      return `Thêm ${formatLitresAsMl(selectedAliquotL)} NaOH`
    case 'mix':
      return 'Khuấy dung dịch'
    case 'wait_for_stable_reading':
      return 'Chờ số đọc ổn định'
    case 'measure_ph':
      return 'Đo giá trị pH'
    case null:
      return 'Thao tác tiếp theo'
  }
}
