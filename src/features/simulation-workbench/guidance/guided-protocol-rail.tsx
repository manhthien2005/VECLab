'use client'

import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import type { ActionAvailability } from '@/application/simulation/acid-session.js'
import type { WorkbenchMode } from '../controller/types.js'

export type GuidedProtocolRailProps = {
  readonly mode: WorkbenchMode
  readonly domain?: AcidNeutralizationState | null
  readonly availableActions: readonly ActionAvailability[]
  readonly isPreStart: boolean
  readonly className?: string
}

type ProtocolStep = {
  id: string
  label: string
  actionType?: string
  isDone: boolean
  isCurrent: boolean
  description: string
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
        <h3 className="wb-section-heading">Quy trình phòng thí nghiệm</h3>
        <p className="hint">
          Hãy thiết lập thể tích và nồng độ ban đầu, sau đó bấm &quot;Bắt đầu thí nghiệm&quot; để mở quy trình thao tác.
        </p>
      </section>
    )
  }

  if (mode === 'EXPLORE') {
    return (
      <section className={`wb-protocol-rail card stack-tight ${className}`}>
        <div className="wb-protocol-header">
          <h3 className="wb-section-heading">Trạng thái khám phá (EXPLORE)</h3>
          <span className="badge badge-accent badge-sm">Tự do chuẩn độ</span>
        </div>
        <p className="hint">
          Hệ thống đã tự động chọn NaOH và hiệu chuẩn máy đo. Chọn cỡ aliquot bên phải và bấm <strong>&quot;Thêm &amp; Đo&quot;</strong> để thực hiện đồng thời chuỗi thao tác: thêm dung dịch → khuấy → chờ ổn định → đo pH.
        </p>
        <div className="wb-explore-status-pills pt-2">
          <div className="wb-explore-pill">
            <span className="wb-pill-dot is-done" />
            <span>Chất trung hòa: NaOH (Đã chọn)</span>
          </div>
          <div className="wb-explore-pill">
            <span className="wb-pill-dot is-done" />
            <span>Điện cực pH: Đã hiệu chuẩn</span>
          </div>
          <div className="wb-explore-pill">
            <span className={`wb-pill-dot ${domain?.measurements.length ? 'is-done' : 'is-pending'}`} />
            <span>Số điểm đo: {domain?.measurements.length ?? 0}</span>
          </div>
        </div>
      </section>
    )
  }

  // --- GUIDED Mode Protocol Rail ---
  const routeSelected = domain?.route !== null
  const calibrated = domain?.meterCalibrated === true
  const hasAdded = (domain?.baseVolumeL ?? 0) > 0
  const isStirred = domain?.mixedSinceLastAddition === true
  const isStable = domain?.readingStable === true
  const isMeasured =
    domain?.lastMeasuredPH !== null &&
    domain?.lastMeasuredCompositionRevision === domain?.compositionRevision

  // Determine current recommended action based on availability and state
  const isAvail = (type: string) =>
    availableActions.some((a) => a.actionType === type && a.available)

  const steps: ProtocolStep[] = [
    {
      id: 'step-prep',
      label: '1. Chuẩn bị mẫu HCl',
      isDone: true,
      isCurrent: false,
      description: 'Dung dịch mẫu đã được đong vào cốc phản ứng.',
    },
    {
      id: 'step-route',
      label: '2. Chọn dung dịch chuẩn (NaOH)',
      actionType: 'select_route',
      isDone: routeSelected,
      isCurrent: isAvail('select_route'),
      description: 'Xác định dung dịch chuẩn trên buret.',
    },
    {
      id: 'step-calibrate',
      label: '3. Hiệu chuẩn máy đo pH',
      actionType: 'calibrate_meter',
      isDone: calibrated,
      isCurrent: isAvail('calibrate_meter'),
      description: 'Chuẩn hóa cảm biến pH trước khi ghi nhận số đo.',
    },
    {
      id: 'step-add',
      label: '4. Thêm dung dịch NaOH',
      actionType: 'add_base',
      isDone: hasAdded,
      isCurrent: isAvail('add_base') && (!hasAdded || isMeasured),
      description: 'Nhỏ một lượng aliquot bazơ từ buret vào cốc.',
    },
    {
      id: 'step-mix',
      label: '5. Khuấy đều dung dịch',
      actionType: 'mix',
      isDone: isStirred,
      isCurrent: isAvail('mix') && !isStirred,
      description: 'Bật máy khuấy từ để phản ứng trung hòa đồng nhất.',
    },
    {
      id: 'step-stabilize',
      label: '6. Chờ số đọc ổn định',
      actionType: 'wait_for_stable_reading',
      isDone: isStable,
      isCurrent: isAvail('wait_for_stable_reading') && !isStable,
      description: 'Chờ cân bằng nhiệt độ và điện thế màng điện cực.',
    },
    {
      id: 'step-measure',
      label: '7. Ghi nhận số đo pH',
      actionType: 'measure_ph',
      isDone: isMeasured,
      isCurrent: isAvail('measure_ph'),
      description: 'Ghi số đo pH chính xác vào bảng dữ liệu & đường cong.',
    },
    {
      id: 'step-repeat',
      label: '8. Lặp lại chu kỳ chuẩn độ',
      isDone: (domain?.measurements.length ?? 0) >= 3,
      isCurrent: isMeasured && isAvail('add_base'),
      description: 'Tiếp tục thêm aliquot để quan sát điểm tương đương.',
    },
  ]

  return (
    <nav className={`wb-protocol-rail card stack-tight ${className}`} aria-label="Quy trình chuẩn độ">
      <div className="wb-protocol-header">
        <h3 className="wb-section-heading">Chỉ dẫn quy trình (GUIDED)</h3>
        <span className="badge badge-accent badge-sm">Chế độ hướng dẫn</span>
      </div>
      <p className="hint tiny">
        Thực hiện tuần tự các thao tác chuẩn độ dưới đây. Bạn có thể quan sát thiết bị và biểu đồ bất kỳ lúc nào.
      </p>

      <ol className="wb-protocol-list">
        {steps.map((step) => {
          let statusClass = 'is-upcoming'
          if (step.isDone) statusClass = 'is-done'
          if (step.isCurrent) statusClass = 'is-active'

          return (
            <li
              key={step.id}
              className={`wb-protocol-item ${statusClass}`}
              aria-current={step.isCurrent ? 'step' : undefined}
            >
              <div className="wb-protocol-indicator" aria-hidden="true">
                {step.isDone ? (
                  <span className="wb-icon-check">✓</span>
                ) : (
                  <span className="wb-icon-dot" />
                )}
              </div>
              <div className="wb-protocol-content">
                <span className="wb-protocol-title">{step.label}</span>
                <span className="wb-protocol-desc">{step.description}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
