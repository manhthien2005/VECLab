'use client'

import { useId } from 'react'
import type { ActionAvailability } from '@/application/simulation/acid-session.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { PERMITTED_ALIQUOTS_L } from '@/domain/experiments/acid-neutralization/constants.js'
import { formatLitresAsMl } from '@/shared/ui/format.js'
import { resolveMessage } from '@/content/index.js'
import type { OperationStage, WorkbenchMode } from '../controller/types.js'

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
  readonly className?: string
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
  className = '',
}: TitrationControlsProps) {
  const aliquotFieldsetId = useId()

  const findAction = (type: string): ActionAvailability | undefined =>
    availableActions.find((a) => a.actionType === type)

  const isActionDisabled = (type: string): boolean => {
    if (busy || isPreStart) return true
    const entry = findAction(type)
    return entry?.available !== true
  }

  const getReason = (type: string): string | null => {
    const entry = findAction(type)
    if (!entry || entry.available || !entry.reasonKey) return null
    return resolveMessage(entry.reasonKey, entry.reasonData)
  }

  if (isPreStart) {
    return (
      <section className={`wb-controls-card card stack ${className}`} aria-labelledby="wb-controls-title">
        <h3 id="wb-controls-title" className="wb-section-heading">Bảng điều khiển thao tác</h3>
        <p className="hint">
          Bảng thao tác chuẩn độ sẽ mở sau khi bạn bấm <strong>&quot;Bắt đầu thí nghiệm&quot;</strong>.
        </p>
      </section>
    )
  }

  return (
    <section className={`wb-controls-card card stack ${className}`} aria-labelledby="wb-controls-title">
      <div className="wb-controls-header">
        <h3 id="wb-controls-title" className="wb-section-heading">Bảng điều khiển thao tác</h3>
        <span className="badge badge-accent badge-sm">{mode}</span>
      </div>

      {/* Aliquot Selector - Segmented compact preset controls */}
      <fieldset className="field" id={aliquotFieldsetId} disabled={busy}>
        <legend className="wb-field-label">Thể tích mỗi lần thêm (Aliquot)</legend>
        <div className="wb-aliquot-segmented" role="radiogroup" aria-label="Chọn thể tích aliquot">
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

      {/* Mode-Specific Actions */}
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
                  {operationStage === 'dispensing' && 'Đang thêm dung dịch…'}
                  {operationStage === 'mixing' && 'Đang khuấy…'}
                  {operationStage === 'stabilizing' && 'Đang chờ ổn định…'}
                  {operationStage === 'measuring' && 'Đang đo pH…'}
                  {operationStage !== 'dispensing' &&
                    operationStage !== 'mixing' &&
                    operationStage !== 'stabilizing' &&
                    operationStage !== 'measuring' &&
                    'Đang xử lý…'}
                </span>
              ) : (
                `Thêm & Đo (${formatLitresAsMl(selectedAliquotL)})`
              )}
            </button>
          </div>
          {getReason('add_base') && (
            <p className="hint tiny text-warn" role="alert">{getReason('add_base')}</p>
          )}
          <p className="hint tiny">
            Một lần bấm thực hiện tự động: Thêm NaOH → Khuấy → Chờ ổn định → Đo pH.
          </p>
        </div>
      ) : (
        /* GUIDED Mode Action List */
        <div className="wb-guided-actions stack-tight">
          {/* Preparation Buttons (Route & Calibrate) */}
          {domain?.route === null && (
            <div className="wb-action-row">
              <button
                type="button"
                className="btn btn-outline btn-block"
                disabled={isActionDisabled('select_route')}
                onClick={() => onSelectRoute()}
              >
                Chọn dung dịch chuẩn NaOH
              </button>
              {getReason('select_route') && (
                <p className="hint tiny">{getReason('select_route')}</p>
              )}
            </div>
          )}

          {!domain?.meterCalibrated && (
            <div className="wb-action-row">
              <button
                type="button"
                className="btn btn-outline btn-block"
                disabled={isActionDisabled('calibrate_meter')}
                onClick={() => onCalibrate()}
              >
                Hiệu chuẩn máy đo pH
              </button>
              {getReason('calibrate_meter') && (
                <p className="hint tiny">{getReason('calibrate_meter')}</p>
              )}
            </div>
          )}

          {/* Dosing, Mixing, Waiting, Measuring */}
          <div className="wb-action-group stack-tight">
            <div className="wb-action-row">
              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={isActionDisabled('add_base')}
                onClick={() => onAddBase()}
              >
                Thêm {formatLitresAsMl(selectedAliquotL)} NaOH
              </button>
              {getReason('add_base') && (
                <p className="hint tiny">{getReason('add_base')}</p>
              )}
            </div>

            <div className="wb-action-row">
              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={isActionDisabled('mix')}
                onClick={() => onMix()}
              >
                Khuấy dung dịch
              </button>
              {getReason('mix') && <p className="hint tiny">{getReason('mix')}</p>}
            </div>

            <div className="wb-action-row">
              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={isActionDisabled('wait_for_stable_reading')}
                onClick={() => onWait()}
              >
                Chờ số đọc ổn định
              </button>
              {getReason('wait_for_stable_reading') && (
                <p className="hint tiny">{getReason('wait_for_stable_reading')}</p>
              )}
            </div>

            <div className="wb-action-row">
              <button
                type="button"
                className="btn btn-primary btn-block wb-measure-btn"
                disabled={isActionDisabled('measure_ph')}
                onClick={() => onMeasurePh()}
              >
                Đo giá trị pH
              </button>
              {getReason('measure_ph') && (
                <p className="hint tiny">{getReason('measure_ph')}</p>
              )}
            </div>

            {/* Optional Correction Acid */}
            <div className="wb-action-row pt-1">
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
                  Chú ý: Thêm HCl hiệu chỉnh sẽ tính điểm phạt an toàn và không thể hoàn tác.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terminal Actions: Undo & Complete */}
      <div className="wb-terminal-actions pt-2 border-t stack-tight">
        <div className="wb-secondary-row row">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={busy || !isUndoAvailable}
            onClick={() => onUndo()}
            title={isUndoAvailable ? 'Hoàn tác thao tác cuối' : 'Chỉ hoàn tác được trước khi thêm bazơ'}
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
