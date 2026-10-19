'use client'

import type { PlasticReportSnapshot } from '@/application/scenarios/plastic-projection.js'
import styles from './workbench.module.css'

type CompletionProps = {
  report: PlasticReportSnapshot
  onClose?: () => void
  onNewAttempt?: () => void
}

export function PlasticCompletionDialog({
  report,
  onClose,
  onNewAttempt,
}: CompletionProps) {
  const allBranchesCompleted = report.projection.completedBranches.length === 2

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                background: allBranchesCompleted ? 'var(--ok)' : 'var(--accent)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}
            >
              {allBranchesCompleted ? 'ĐỦ HAI NHÁNH' : 'ĐÃ HOÀN THÀNH MỘT NHÁNH'}
            </span>
            <h2 className={styles.modalTitle}>Báo cáo kết quả phân loại nhựa nguyên sinh</h2>
          </div>
          {onClose && (
            <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Đóng">
              ✕
            </button>
          )}
        </div>

        {/* Executive summary */}
        <div className={styles.promptCard} style={{ marginBottom: '1.25rem' }}>
          <div className={styles.promptEyebrow}>KẾT QUẢ TỔNG QUAN</div>
          <div className={styles.promptBody}>
            Trạng thái quy trình: <strong>{allBranchesCompleted ? 'đã đi qua cả hai nhánh' : 'đã đi qua một nhánh'}</strong>.
            {allBranchesCompleted
              ? ' Kết quả nổi, chìm và tỷ lệ thu hồi hiển thị theo các preset được báo cáo trong bài báo.'
              : ' Kết quả của nhánh còn lại chưa được ghi nhận trong lượt này.'}
          </div>
        </div>

        {/* Tree of Separation hierarchy */}
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
          Cây phân loại chìm–nổi đã thực hiện
        </h4>
        <div
          style={{
            padding: '1rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
            Hỗn hợp 6 polymer ban đầu (PP, HDPE, PS, ABS, PA, PC · 2,0 kg/loại)
          </div>
          <div style={{ paddingLeft: '1.25rem', borderLeft: '2px solid var(--accent)', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
              1. Nước máy · Bể pilot 800 L hữu ích, khuấy 160 rpm
            </div>
            <div style={{ color: 'var(--ink-muted)' }}>
              • <strong>Phân đoạn nổi (97,5% thu hồi):</strong> PP + HDPE
            </div>
            <div style={{ color: 'var(--ink-muted)' }}>
              • <strong>Phân đoạn chìm:</strong> PS + ABS + PA + PC
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            {/* Ethanol Branch */}
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#7e22ce', marginBottom: '0.25rem' }}>
                Nhánh nhẹ (Ethanol)
              </div>
              <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--ink)' }}>
                <li>23% v/v: <strong>PP nổi</strong> (thu hồi 95,60%)</li>
                <li>31% v/v: <strong>HDPE chìm</strong> (thu hồi 99,70%)</li>
              </ul>
            </div>

            {/* NaCl Branch */}
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f766e', marginBottom: '0.25rem' }}>
                Nhánh nặng (NaCl)
              </div>
              <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--ink)' }}>
                <li>11–12% w/v: <strong>PS nổi</strong> (thu hồi 80,3%)</li>
                <li>20% w/v: <strong>ABS nổi</strong> (thu hồi 84,8%)</li>
                <li>40% w/v: <strong>PA nổi</strong> (70%), <strong>PC chìm</strong> (95,4%)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Source and Scientific disclosures */}
        <div className={styles.conflictAlert}>
          <div>⚠️</div>
          <div>
            <strong>Ghi chú về nguồn khoa học và dữ liệu thực nghiệm:</strong>
            <br />
            Toàn bộ các tỷ lệ phần trăm được bài báo Meneses Quelal và cộng sự (2022, DOI 10.1007/s11356-021-15611-w) báo cáo là <strong>tỷ lệ thu hồi vật liệu (recovery)</strong>, không phải độ tinh khiết hóa học (purity). Báo cáo không tạo khối lượng cân mới; các kết quả ethanol tuân theo phần Results và Hình 6, đồng thời giữ chú thích về mâu thuẫn với Abstract/Conclusion.
          </div>
        </div>

        {/* Modal actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          {onClose && (
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Đóng xem lại bàn
            </button>
          )}
          {onNewAttempt && (
            <button type="button" className={styles.actionBtn} onClick={onNewAttempt}>
              Bắt đầu lượt mới
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
