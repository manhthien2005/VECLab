'use client'

import { useState, useId } from 'react'
import type { AcidSetupParams } from '@/domain/experiments/acid-neutralization/setup.js'
import {
  validateSetupParams,
} from '@/domain/experiments/acid-neutralization/setup.js'
import {
  EXPLORATION_RANGES,
  LOCKED_CONDITIONS,
} from '@/domain/experiments/acid-neutralization/constants.js'
import type { WorkbenchMode } from '../controller/types.js'

export type ExperimentSetupCardProps = {
  readonly setupDraft: AcidSetupParams
  readonly activeSetup?: AcidSetupParams | null
  readonly isPreStart: boolean
  readonly mode: WorkbenchMode
  readonly busy: boolean
  readonly onSetupChange: (setup: AcidSetupParams) => void
  readonly onModeChange: (mode: WorkbenchMode) => void
  readonly onStart: () => void
  readonly onRestart?: () => void
  readonly onNewSetup?: () => void
  readonly className?: string
}

export function ExperimentSetupCard({
  setupDraft,
  activeSetup,
  isPreStart,
  mode,
  busy,
  onSetupChange,
  onModeChange,
  onStart,
  onRestart,
  onNewSetup,
  className = '',
}: ExperimentSetupCardProps) {
  const volumeId = useId()
  const concId = useId()
  const modeGuidedId = useId()
  const modeExploreId = useId()

  // Use authoritative active setup when attempt is running, else use draft
  const currentSetup = !isPreStart && activeSetup ? activeSetup : setupDraft

  // Local draft values in user-facing units (mL and M)
  const [volumeMlStr, setVolumeMlStr] = useState<string>(
    (currentSetup.acidVolumeL * 1000).toFixed(1),
  )
  const [concMStr, setConcMStr] = useState<string>(
    currentSetup.acidConcentrationMolL.toFixed(3),
  )

  // Derived validation
  const parsedVolumeL = parseFloat(volumeMlStr) / 1000
  const parsedConcM = parseFloat(concMStr)
  const validationResult = validateSetupParams({
    acidVolumeL: parsedVolumeL,
    acidConcentrationMolL: parsedConcM,
  })

  const isValid = validationResult.ok

  const handleVolumeChange = (newValStr: string) => {
    setVolumeMlStr(newValStr)
    const volNum = parseFloat(newValStr)
    if (!isNaN(volNum)) {
      const volL = volNum / 1000
      onSetupChange({
        ...setupDraft,
        acidVolumeL: volL,
      })
    }
  }

  const handleConcChange = (newValStr: string) => {
    setConcMStr(newValStr)
    const concNum = parseFloat(newValStr)
    if (!isNaN(concNum)) {
      onSetupChange({
        ...setupDraft,
        acidConcentrationMolL: concNum,
      })
    }
  }

  const minVolMl = EXPLORATION_RANGES.acidVolumeL.min * 1000
  const maxVolMl = EXPLORATION_RANGES.acidVolumeL.max * 1000
  const minConcM = EXPLORATION_RANGES.acidConcentrationMolL.min
  const maxConcM = EXPLORATION_RANGES.acidConcentrationMolL.max

  return (
    <section className={`wb-setup-card card stack ${className}`} aria-labelledby="wb-setup-title">
      <div className="wb-setup-header">
        <h2 id="wb-setup-title" className="wb-section-heading">
          Thiết lập thí nghiệm
        </h2>
        {!isPreStart && (
          <span className="badge badge-accent badge-sm">Đã khóa thông số</span>
        )}
      </div>

      {isPreStart ? (
        <form
          className="wb-setup-form stack-tight"
          onSubmit={(e) => {
            e.preventDefault()
            if (isValid && !busy) {
              onStart()
            }
          }}
        >
          {/* Mode Selector */}
          <fieldset className="field wb-mode-fieldset" disabled={busy}>
            <legend className="wb-field-label">Chế độ vận hành</legend>
            <div className="wb-mode-segmented">
              <label
                htmlFor={modeGuidedId}
                className={`wb-mode-pill ${mode === 'GUIDED' ? 'is-active' : ''}`}
              >
                <input
                  type="radio"
                  id={modeGuidedId}
                  name="workbench-mode"
                  value="GUIDED"
                  checked={mode === 'GUIDED'}
                  onChange={() => onModeChange('GUIDED')}
                  className="visually-hidden"
                />
                <span className="wb-mode-pill-title">GUIDED</span>
                <span className="wb-mode-pill-desc">Từng bước chuẩn xác</span>
              </label>

              <label
                htmlFor={modeExploreId}
                className={`wb-mode-pill ${mode === 'EXPLORE' ? 'is-active' : ''}`}
              >
                <input
                  type="radio"
                  id={modeExploreId}
                  name="workbench-mode"
                  value="EXPLORE"
                  checked={mode === 'EXPLORE'}
                  onChange={() => onModeChange('EXPLORE')}
                  className="visually-hidden"
                />
                <span className="wb-mode-pill-title">EXPLORE</span>
                <span className="wb-mode-pill-desc">Thêm &amp; Đo nhanh</span>
              </label>
            </div>
          </fieldset>

          {/* HCl Initial Volume */}
          <div className="field">
            <label htmlFor={volumeId} className="wb-field-label">
              Thể tích dung dịch HCl ban đầu (mL)
            </label>
            <div className="input-group">
              <input
                id={volumeId}
                type="number"
                min={minVolMl}
                max={maxVolMl}
                step="0.5"
                value={volumeMlStr}
                disabled={busy}
                onChange={(e) => handleVolumeChange(e.target.value)}
                className={`input ${!isValid && (parsedVolumeL < EXPLORATION_RANGES.acidVolumeL.min || parsedVolumeL > EXPLORATION_RANGES.acidVolumeL.max) ? 'input-error' : ''}`}
                aria-describedby={`${volumeId}-hint`}
                required
              />
              <span className="input-suffix">mL</span>
            </div>
            <p id={`${volumeId}-hint`} className="hint tiny">
              Phạm vi hợp lệ: {minVolMl.toFixed(1)} – {maxVolMl.toFixed(1)} mL (chuẩn hóa: {(currentSetup.acidVolumeL * 1000).toFixed(1)} mL)
            </p>
          </div>

          {/* HCl Concentration */}
          <div className="field">
            <label htmlFor={concId} className="wb-field-label">
              Nồng độ HCl ban đầu (M)
            </label>
            <div className="input-group">
              <input
                id={concId}
                type="number"
                min={minConcM}
                max={maxConcM}
                step="0.001"
                value={concMStr}
                disabled={busy}
                onChange={(e) => handleConcChange(e.target.value)}
                className={`input ${!isValid && (parsedConcM < minConcM || parsedConcM > maxConcM) ? 'input-error' : ''}`}
                aria-describedby={`${concId}-hint`}
                required
              />
              <span className="input-suffix">M</span>
            </div>
            <p id={`${concId}-hint`} className="hint tiny">
              Phạm vi hợp lệ: {minConcM.toFixed(3)} – {maxConcM.toFixed(3)} M
            </p>
          </div>

          {/* Derived Fixed Conditions */}
          <div className="wb-fixed-conditions">
            <div className="wb-fixed-item">
              <span className="wb-fixed-label">Dung dịch chuẩn độ:</span>
              <span className="wb-fixed-value">NaOH {parsedConcM > 0 ? parsedConcM.toFixed(3) : '0.010'} M (cố định)</span>
            </div>
            <div className="wb-fixed-item">
              <span className="wb-fixed-label">Nhiệt độ môi trường:</span>
              <span className="wb-fixed-value">{LOCKED_CONDITIONS.temperatureC.toFixed(1)} °C (cố định)</span>
            </div>
          </div>

          {/* Start Action */}
          <div className="wb-setup-actions pt-2">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={!isValid || busy}
            >
              {busy ? 'Đang khởi tạo…' : 'Bắt đầu thí nghiệm'}
            </button>
          </div>
        </form>
      ) : (
        /* Active Run Summary View */
        <div className="wb-setup-active-summary stack-tight">
          <dl className="wb-param-list">
            <div className="wb-param-row">
              <dt>Chế độ:</dt>
              <dd>
                <span className="badge badge-accent">{mode}</span>
              </dd>
            </div>
            <div className="wb-param-row">
              <dt>Dung dịch mẫu:</dt>
              <dd>
                HCl {(currentSetup.acidVolumeL * 1000).toFixed(1)} mL ({currentSetup.acidConcentrationMolL.toFixed(3)} M)
              </dd>
            </div>
            <div className="wb-param-row">
              <dt>Dung dịch chuẩn:</dt>
              <dd>
                NaOH {currentSetup.acidConcentrationMolL.toFixed(3)} M
              </dd>
            </div>
            <div className="wb-param-row">
              <dt>Nhiệt độ:</dt>
              <dd>{LOCKED_CONDITIONS.temperatureC.toFixed(1)} °C</dd>
            </div>
          </dl>

          <div className="wb-run-secondary-actions pt-3">
            {onRestart && (
              <button
                type="button"
                className="btn btn-sm btn-outline btn-block mb-2"
                onClick={onRestart}
                disabled={busy}
                title="Giữ nguyên thông số nồng độ/thể tích và bắt đầu lượt mới"
              >
                Làm lại cùng cấu hình
              </button>
            )}
            {onNewSetup && (
              <button
                type="button"
                className="btn btn-sm btn-ghost btn-block"
                onClick={onNewSetup}
                disabled={busy}
                title="Quay lại bảng thiết lập để chọn thể tích/nồng độ mới"
              >
                Thiết lập lượt mới
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
