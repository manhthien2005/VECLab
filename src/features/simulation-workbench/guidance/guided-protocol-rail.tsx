'use client'

import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import type { ActionAvailability } from '@/application/simulation/acid-session.js'
import { APP_STRINGS } from '@/content/index.js'
import type { WorkbenchMode } from '../controller/types.js'
import { buildProtocolSteps, workbenchModeLabel } from './protocol.js'

export type GuidedProtocolRailProps = {
  readonly mode: WorkbenchMode
  readonly domain?: AcidNeutralizationState | null
  readonly availableActions: readonly ActionAvailability[]
  readonly isPreStart: boolean
  readonly className?: string
}

export function GuidedProtocolRail({
  mode,
  domain,
  availableActions,
  isPreStart,
  className = '',
}: GuidedProtocolRailProps) {
  if (isPreStart) {
    return (
      <section className={`wb-protocol-rail card stack-tight ${className}`}>
        <h3 className="wb-section-heading">{APP_STRINGS.workbench.protocolHeading}</h3>
        <p className="hint">
          Hãy thiết lập thể tích và nồng độ ban đầu, sau đó bấm “Bắt đầu thí nghiệm” để mở quy
          trình thao tác.
        </p>
      </section>
    )
  }

  if (mode === 'EXPLORE') {
    return (
      <section className={`wb-protocol-rail card stack-tight ${className}`}>
        <div className="wb-protocol-header">
          <h3 className="wb-section-heading">{APP_STRINGS.workbench.exploreStatusHeading}</h3>
          <span className="badge badge-accent badge-sm">{workbenchModeLabel(mode)}</span>
        </div>
        <p className="hint">
          Hệ thống đã chọn NaOH và hiệu chuẩn máy đo. Chọn thể tích bên phải và bấm{' '}
          <strong>“Thêm &amp; Đo”</strong> để chạy: thêm dung dịch → khuấy → chờ ổn định → đo pH.
        </p>
        <div className="wb-explore-status-pills pt-2">
          <div className="wb-explore-pill">
            <span className="wb-pill-dot is-done" />
            <span>Chất trung hòa: NaOH (đã chọn)</span>
          </div>
          <div className="wb-explore-pill">
            <span className="wb-pill-dot is-done" />
            <span>Điện cực pH: đã hiệu chuẩn</span>
          </div>
          <div className="wb-explore-pill">
            <span className={`wb-pill-dot ${domain?.measurements.length ? 'is-done' : 'is-pending'}`} />
            <span>Số điểm đo: {domain?.measurements.length ?? 0}</span>
          </div>
        </div>
      </section>
    )
  }

  const steps = buildProtocolSteps(domain, availableActions)

  return (
    <nav className={`wb-protocol-rail card stack-tight ${className}`} aria-label="Quy trình chuẩn độ">
      <div className="wb-protocol-header">
        <h3 className="wb-section-heading">{APP_STRINGS.workbench.protocolHeading}</h3>
        <span className="badge badge-accent badge-sm">{workbenchModeLabel(mode)}</span>
      </div>
      <p className="hint tiny">{APP_STRINGS.workbench.protocolRepeatHint}</p>

      <ol className="wb-protocol-list">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`wb-protocol-item is-${step.status}`}
            aria-current={step.status === 'active' ? 'step' : undefined}
          >
            <div className="wb-protocol-indicator" aria-hidden="true">
              {step.status === 'done' ? (
                <span className="wb-icon-check">✓</span>
              ) : (
                <span className="wb-icon-dot" />
              )}
            </div>
            <div className="wb-protocol-content">
              <span className="wb-protocol-title">
                {step.label}
                {step.status === 'active' ? (
                  <span className="wb-protocol-now"> · tiếp theo</span>
                ) : null}
              </span>
              <span className="wb-protocol-desc">{step.description}</span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
