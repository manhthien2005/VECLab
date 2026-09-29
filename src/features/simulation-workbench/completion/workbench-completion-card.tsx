'use client'

import Link from 'next/link'
import type { UUID } from '@/domain/process/contracts.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import type { AcidProjection } from '@/application/scenarios/acid-projection.js'
import { formatLitresAsMl, formatPh } from '@/shared/ui/format.js'

export type WorkbenchCompletionCardProps = {
  readonly attemptId: UUID
  readonly domain?: AcidNeutralizationState | null
  readonly projection?: AcidProjection | null
  readonly onStartNew?: () => void
  readonly className?: string
}

export function WorkbenchCompletionCard({
  attemptId,
  domain,
  projection,
  onStartNew,
  className = '',
}: WorkbenchCompletionCardProps) {
  const measurementCount = domain?.measurements.length ?? 0
  const finalPh = domain?.lastMeasuredPH ?? projection?.phStar ?? null
  const totalBaseMl = domain?.baseVolumeL ? formatLitresAsMl(domain.baseVolumeL) : '0,0 mL'
  const isGoalMet = projection?.goalMet ?? false

  return (
    <section className={`wb-completion-card card stack-tight ${className}`} aria-labelledby="wb-completion-title">
      <div className="wb-completion-header">
        <div className="wb-completion-badge-wrap">
          <span className="badge badge-ok">Lượt thử đã hoàn thành</span>
          {isGoalMet && <span className="badge badge-accent">Đạt mục tiêu trung hòa</span>}
        </div>
        <h3 id="wb-completion-title" className="wb-section-heading pt-1">
          Tổng kết kết quả thí nghiệm
        </h3>
      </div>

      <p className="hint">
        Thí nghiệm chuẩn độ đã được ghi nhận vào báo cáo khoa học. Bạn có thể xem phân tích chi tiết hoặc bắt đầu một lượt thử mới.
      </p>

      <div className="wb-completion-grid">
        <div className="wb-completion-metric">
          <span className="wb-metric-label">Mã lượt thử</span>
          <span className="wb-metric-value mono tiny">{attemptId}</span>
        </div>
        <div className="wb-completion-metric">
          <span className="wb-metric-label">Số điểm đo</span>
          <span className="wb-metric-value">{measurementCount}</span>
        </div>
        <div className="wb-completion-metric">
          <span className="wb-metric-label">pH cuối cùng</span>
          <span className="wb-metric-value mono">{finalPh !== null ? formatPh(finalPh) : '—'}</span>
        </div>
        <div className="wb-completion-metric">
          <span className="wb-metric-label">Tổng NaOH đã dùng</span>
          <span className="wb-metric-value">{totalBaseMl}</span>
        </div>
      </div>

      <div className="wb-completion-actions row pt-2">
        <Link
          href={`/reports/${attemptId}`}
          className="btn btn-primary"
        >
          Xem báo cáo chi tiết →
        </Link>
        {onStartNew && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={onStartNew}
          >
            Bắt đầu lượt mới
          </button>
        )}
      </div>
    </section>
  )
}
