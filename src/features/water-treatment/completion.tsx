import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import type { WaterTreatmentReportSnapshot } from './report-types.js'
import { CloseIcon, SubmitIcon, ReportIcon, InfoIcon } from '@/features/workbench/icons.js'
import { WaterTreatmentReport } from './report.js'
import styles from './completion.module.css'

const fmt = (value: number | null | undefined, digits = 2): string =>
  value == null ? 'N/A' : value.toLocaleString('vi-VN', { maximumFractionDigits: digits })

function CompletionDialog({
  title,
  icon,
  onClose,
  busy = false,
  children,
  footer,
}: {
  title: string
  icon: ReactNode
  onClose: () => void
  busy?: boolean
  children: ReactNode
  footer: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const outside = useRef(false)
  const titleId = useId()

  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onPointerDown={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        outside.current =
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
      }}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        if (
          !busy &&
          outside.current &&
          (event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom)
        )
          onClose()
        outside.current = false
      }}
    >
      <div className={styles.layout}>
        <header className={styles.header}>
          <h2 id={titleId}>
            {icon}
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            disabled={busy}
            onClick={onClose}
            aria-label={'Đóng ' + title}
          >
            <CloseIcon />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>{footer}</footer>
      </div>
    </dialog>
  )
}

type SubmitDialogProps = {
  sampleCalculation: { dissolvedMgL: { fe: number; zn: number; pb: number } } | null
  ban2LockedData: {
    pH: number
    calculation: {
      filtrate_mgPerL: { Fe: number; Zn: number; Pb: number }
    }
  } | null
  dischargePhase: 'pending' | 'balancing' | 'discharged'
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}

export function WaterTreatmentSubmitDialog({
  sampleCalculation,
  ban2LockedData,
  dischargePhase,
  busy,
  onClose,
  onConfirm,
}: SubmitDialogProps) {
  const missing: string[] = []

  if (!sampleCalculation) {
    missing.push('Chưa tính mẫu ban đầu ở Bàn 1')
  }
  if (!ban2LockedData) {
    missing.push('Chưa khóa kết quả xử lý ở Bàn 2')
  }
  if (dischargePhase !== 'discharged') {
    missing.push('Chưa hoàn thành xả thải ở Bàn 3')
  }

  return (
    <CompletionDialog
      title="Nộp bài xử lý nước"
      icon={<SubmitIcon />}
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={styles.secondary} disabled={busy} onClick={onClose} autoFocus>
            Tiếp tục làm bài
          </button>
          <button type="button" className={styles.primary} disabled={busy} onClick={onConfirm}>
            {busy ? 'Đang lưu bài…' : 'Xác nhận nộp bài'}
          </button>
        </>
      }
    >
      <p className={styles.intro}>Kiểm tra bài trước khi nộp. Sau khi xác nhận, lượt này sẽ chỉ có thể xem lại.</p>

      <dl className={styles.summary}>
        <div>
          <dt>Mẫu ban đầu</dt>
          <dd>
            {sampleCalculation
              ? `Fe ${fmt(sampleCalculation.dissolvedMgL.fe)} · Zn ${fmt(sampleCalculation.dissolvedMgL.zn)} · Pb ${fmt(sampleCalculation.dissolvedMgL.pb)} mg/L`
              : 'Chưa tính'}
          </dd>
        </div>
        <div>
          <dt>Sau xử lý</dt>
          <dd>
            {ban2LockedData && ban2LockedData.calculation
              ? `Fe ${fmt(ban2LockedData.calculation.filtrate_mgPerL.Fe)} · Zn ${fmt(ban2LockedData.calculation.filtrate_mgPerL.Zn)} · Pb ${fmt(ban2LockedData.calculation.filtrate_mgPerL.Pb)} mg/L`
              : 'Chưa khóa'}
          </dd>
        </div>
        <div>
          <dt>pH cuối</dt>
          <dd>{ban2LockedData ? fmt(ban2LockedData.pH) : 'Chưa khóa'}</dd>
        </div>
        <div>
          <dt>Xả thải</dt>
          <dd>
            {dischargePhase === 'discharged'
              ? 'Đã hoàn thành'
              : dischargePhase === 'balancing'
                ? 'Đang cân bằng pH'
                : 'Chưa khóa Bàn 2'}
          </dd>
        </div>
      </dl>

      {missing.length > 0 && (
        <section className={styles.warning} aria-label="Thông tin còn thiếu">
          <h3>Cần kiểm tra trước khi nộp</h3>
          <ul>
            {missing.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <p>Bạn vẫn có thể nộp. Báo cáo chỉ đánh giá phần có đủ dữ liệu.</p>
        </section>
      )}

      <p className={styles.note}>
        Mục tiêu: Giảm Fe ≤ 2 mg/L, Zn ≤ 1 mg/L, Pb ≤ 0.1 mg/L, pH 6–9 (QCVN 40:2025 Cột A).
      </p>
    </CompletionDialog>
  )
}

type ReportDialogProps = {
  report: WaterTreatmentReportSnapshot
  onClose: () => void
  onNotebook: () => void
}

export function WaterTreatmentReportDialog({ report, onClose, onNotebook }: ReportDialogProps) {
  return (
    <CompletionDialog
      title="Báo cáo xử lý nước"
      icon={<ReportIcon />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={styles.secondary} onClick={onNotebook}>
            Xem sổ đo
          </button>
          <button type="button" className={styles.primary} onClick={onClose}>
            Về bàn thí nghiệm
          </button>
        </>
      }
    >
      <WaterTreatmentReport report={report} />
    </CompletionDialog>
  )
}
