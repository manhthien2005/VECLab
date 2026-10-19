'use client'

import type { PlasticProjection } from '@/application/scenarios/plastic-projection.js'
import { VIRGIN_POLYMERS } from '@/domain/experiments/virgin-plastic-separation/index.js'
import styles from './workbench.module.css'

type NotebookProps = {
  projection: PlasticProjection
}

export function PlasticNotebook({ projection }: NotebookProps) {
  return (
    <div className={styles.resultsMatrixCard}>
      <h3 className={styles.matrixTitle}>Sổ tay thực hành · Theo dõi phân đoạn và thu hồi</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
        Ghi chép các bước tách, môi trường tỷ trọng, hiện tượng nổi–chìm quan sát được và số liệu thu hồi công bố trong bài báo Meneses Quelal và cộng sự (2022).
      </p>

      {/* Polymer baseline table */}
      <div className={styles.tableScroll}>
      <table className={styles.matrixTable} style={{ marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th>Mã polymer</th>
            <th>Tên đầy đủ</th>
            <th>Khối lượng riêng (g/cm³)</th>
            <th>Hình thái hạt</th>
            <th>Khối lượng mẫu</th>
            <th>Trạng thái hiện tại</th>
          </tr>
        </thead>
        <tbody>
          {VIRGIN_POLYMERS.map((p) => {
            const visual = projection.polymers.find((item) => item.id === p.id)
            return (
              <tr key={p.id}>
                <td>
                  <span style={{ fontWeight: 700, color: p.colorHex }}>{p.id}</span>
                </td>
                <td>{p.name}</td>
                <td style={{ fontFamily: 'monospace' }}>{p.nominalDensity}</td>
                <td>{p.formVi}</td>
                <td>2,0 kg</td>
                <td>
                  {visual?.recovered ? (
                    <span style={{ color: 'var(--ok)', fontWeight: 600 }}>
                      Đã thu hồi ({visual.recoveryPercent}%)
                    </span>
                  ) : visual?.location === 'water_floating' ? (
                    <span style={{ color: 'var(--accent)' }}>Đang nổi trong nước</span>
                  ) : visual?.location === 'water_sinking' ? (
                    <span style={{ color: 'var(--ink-faint)' }}>Đang chìm trong nước</span>
                  ) : visual?.location === 'separated_floating' ? (
                    <span style={{ color: 'var(--accent)' }}>Nổi trong dung dịch nhánh</span>
                  ) : visual?.location === 'separated_sinking' ? (
                    <span style={{ color: 'var(--ink-faint)' }}>Chìm trong dung dịch nhánh</span>
                  ) : (
                    <span>Trong khay mẫu</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      {/* History of separation outcomes */}
      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>
        Nhật ký các phân đoạn đã tách
      </h4>
      {projection.outcomesHistory.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-faint)' }}>
          Chưa thực hiện bước tách nào. Hãy bắt đầu từ khâu làm ướt mẫu trong bể pilot.
        </p>
      ) : (
        <div className={styles.tableScroll}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th>Giai đoạn</th>
              <th>Môi trường dung dịch</th>
              <th>Phân đoạn nổi (Floating)</th>
              <th>Phân đoạn chìm (Sinking)</th>
              <th>Số liệu thu hồi (theo bài báo)</th>
            </tr>
          </thead>
          <tbody>
            {projection.outcomesHistory.map((outcome, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{outcome.titleVi}</td>
                <td>{outcome.mediumVi}</td>
                <td>
                  {outcome.floating.map((f) => (
                    <span
                      key={f}
                      style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        margin: '2px',
                        borderRadius: '3px',
                        background: 'var(--accent-softer)',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </td>
                <td>
                  {outcome.sinking.map((s) => (
                    <span
                      key={s}
                      style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        margin: '2px',
                        borderRadius: '3px',
                        background: 'var(--surface-3)',
                        color: 'var(--ink-muted)',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </td>
                <td>
                  {outcome.recoveryTextVi.map((t, i) => (
                    <div key={i} className={styles.matrixRecoveryBadge}>
                      {t}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Ethanol Label Conflict Disclosure */}
      <div className={styles.conflictAlert} style={{ marginTop: '1.5rem' }}>
        <div>⚠️</div>
        <div>
          <strong>Minh bạch về mâu thuẫn trong bài báo nguồn:</strong> Phần Tóm tắt và Kết luận có cách gán nhãn polymer ở nhánh ethanol khác với phần Kết quả và Hình 6. Bảng dữ liệu theo phần Kết quả và Hình 6; số liệu thu hồi chỉ hiện sau khi chạy và hoàn tất ly tâm, cân theo Meneses Quelal và cộng sự (2022).
        </div>
      </div>
    </div>
  )
}

