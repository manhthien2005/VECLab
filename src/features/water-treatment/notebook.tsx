'use client'

import { useState } from 'react'
import { GuideIcon, ReportIcon } from '@/features/workbench/icons.js'
import type { SampleApStatus, SampleCalculation } from './sample-apparatus.js'
import type { ApStatus, TreatmentCalculation, FilterHistoryEntry } from './apparatus.js'
import styles from './notebook.module.css'

const fmt = (n: number | null | undefined, digits = 3) => n == null ? '—' : n.toFixed(digits)
const fmtp = (n: number | null | undefined) => n == null ? '—' : n.toFixed(1)
const QCVN_FE = 2
const QCVN_ZN = 3
const QCVN_PB = 0.1
const QCVN_PH_MIN = 6
const QCVN_PH_MAX = 9

function passFail(pass: boolean) {
  return pass
    ? <span className={styles.pass}>✓ Đạt</span>
    : <span className={styles.fail}>✗ Chưa đạt</span>
}

interface StationProps {
  label: string
  description: string
  current: boolean
  done: boolean
  onClick: () => void
  badge?: React.ReactNode
}

function StationNav({ label, description, current, done, onClick, badge }: StationProps) {
  return (
    <button
      type="button"
      className={`${styles.stationNav} ${current ? styles.stationCurrent : ''} ${done ? styles.stationDone : ''}`}
      onClick={onClick}
    >
      <span className={styles.stationDot}>
        {done ? '✓' : current ? '▶' : (label.match(/^\d/) || ['○'])[0].replace(/\D/g, '')}
      </span>
      <span className={styles.stationText}>
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      {badge && <span className={styles.stationBadge}>{badge}</span>}
    </button>
  )
}

interface Props {
  /** Sample preparation state — Bàn 1 */
  sampleStatus: SampleApStatus
  sampleCalculation: SampleCalculation | null
  /** Treatment state — Bàn 2 */
  treatmentStatus: ApStatus
  treatmentCalculation: TreatmentCalculation | null
  filterHistory: FilterHistoryEntry[]
  /** Discharge state — Bàn 3 */
  dischargePhase: 'pending' | 'balancing' | 'discharged'
  dischargePH: number | null
  ban2LockedData: { pH: number; calculation: TreatmentCalculation; filterHistory: FilterHistoryEntry[] } | null
  onStationClick: (station: 'sample' | 'treatment' | 'discharge') => void
  currentStation: 'sample' | 'treatment' | 'discharge'
}

export function WaterTreatmentNotebook({
  sampleStatus,
  sampleCalculation,
  treatmentStatus,
  treatmentCalculation,
  filterHistory,
  dischargePhase,
  dischargePH,
  ban2LockedData,
  onStationClick,
  currentStation,
}: Props) {
  const [activeTab, setActiveTab] = useState<'composition' | 'treatment' | 'results'>('composition')

  // Derived data
  const compDone = sampleCalculation !== null
  const treatDone = ban2LockedData !== null
  const dischargeDone = dischargePhase === 'discharged'

  // Sample composition
  const totalMetals = sampleStatus.feAddedMl + sampleStatus.znAddedMl + sampleStatus.pbAddedMl
  const feCalc = sampleCalculation?.dissolvedMgL.fe ?? null
  const znCalc = sampleCalculation?.dissolvedMgL.zn ?? null
  const pbCalc = sampleCalculation?.dissolvedMgL.pb ?? null

  // Treatment results
  const latestCalc = treatmentCalculation
  const lastHistory = filterHistory[filterHistory.length - 1]
  const treatedFe = lastHistory?.cumulativeRemaining.Fe ?? latestCalc?.filtrate_mgPerL?.Fe ?? treatmentStatus.filteredSolid.Fe
  const treatedZn = lastHistory?.cumulativeRemaining.Zn ?? latestCalc?.filtrate_mgPerL?.Zn ?? treatmentStatus.filteredSolid.Zn
  const treatedPb = lastHistory?.cumulativeRemaining.Pb ?? latestCalc?.filtrate_mgPerL?.Pb ?? treatmentStatus.filteredSolid.Pb
  const finalPH = dischargePH ?? ban2LockedData?.pH ?? treatmentStatus.pH

  const fePass = treatedFe !== null && treatedFe <= QCVN_FE
  const znPass = treatedZn !== null && treatedZn <= QCVN_ZN
  const pbPass = treatedPb !== null && treatedPb <= QCVN_PB
  const phPass = finalPH >= QCVN_PH_MIN && finalPH <= QCVN_PH_MAX
  const allPass = fePass && znPass && pbPass && phPass

  // Tabs per station
  const stationTabs: Record<string, Array<{ id: 'composition' | 'treatment' | 'results'; label: string }>> = {
    sample: [{ id: 'composition', label: 'Pha mẫu' }],
    treatment: [
      { id: 'composition', label: 'Mẫu ban đầu' },
      { id: 'treatment', label: 'Xử lý hydroxide' },
    ],
    discharge: [
      { id: 'composition', label: 'Mẫu ban đầu' },
      { id: 'treatment', label: 'Sau lọc' },
      { id: 'results', label: 'Kết quả cột A' },
    ],
  }

  const tabs = stationTabs[currentStation] || [{ id: 'composition', label: 'Số liệu' }]

  return (
    <div className={styles.notebook}>
      <header className={styles.heading}>
        <h2>Sổ thực hành</h2>
        <span className={styles.revision}>Xử lý nước Fe·Zn·Pb</span>
      </header>

      {/* Station navigation */}
      <nav className={styles.stations} aria-label="Các bàn thí nghiệm">
        <StationNav
          label="Bàn 1"
          description="Pha mẫu nhiễm kim loại"
          current={currentStation === 'sample'}
          done={compDone}
          onClick={() => onStationClick('sample')}
        />
        <div className={styles.stationConnector} aria-hidden="true" />
        <StationNav
          label="Bàn 2"
          description="Xử lý hydroxide"
          current={currentStation === 'treatment'}
          done={treatDone}
          onClick={() => onStationClick('treatment')}
          badge={filterHistory.length > 0 ? `${filterHistory.length} lần lọc` : undefined}
        />
        <div className={styles.stationConnector} aria-hidden="true" />
        <StationNav
          label="Bàn 3"
          description="Cân bằng pH & thải"
          current={currentStation === 'discharge'}
          done={dischargeDone}
          onClick={() => onStationClick('discharge')}
        />
      </nav>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'composition' && (
        <section role="tabpanel" className={styles.panel}>
          <h3 className={styles.panelTitle}>
            <GuideIcon />Mẫu nước ban đầu
          </h3>

          {/* Sample volume & pH */}
          <div className={styles.readoutRow}>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>Thể tích mẫu</span>
              <strong className={styles.readoutValue}>{sampleStatus.targetVolumeMl} mL</strong>
            </div>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>pH ban đầu</span>
              <strong className={styles.readoutValue}>{fmtp(sampleStatus.pH)}</strong>
            </div>
          </div>

          {/* Metal additions */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Thành phần kim loại trong mẫu</caption>
              <thead>
                <tr>
                  <th>Ion</th>
                  <th>Thể tích đã thêm</th>
                  <th>Nồng độ (mg/L)</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ion: 'Fe³⁺', added: sampleStatus.feAddedMl, conc: feCalc, note: 'Sắt(III)' },
                  { ion: 'Zn²⁺', added: sampleStatus.znAddedMl, conc: znCalc, note: 'Kẽm' },
                  { ion: 'Pb²⁺', added: sampleStatus.pbAddedMl, conc: pbCalc, note: 'Chì' },
                ].map(({ ion, added, conc, note }) => (
                  <tr key={ion}>
                    <th scope="row">
                      {ion}
                      <br />
                      <small>{note}</small>
                    </th>
                    <td>{added.toFixed(2)} mL</td>
                    <td>{conc !== null ? fmt(conc) + ' mg/L' : <em>—</em>}</td>
                    <td>
                      {added > 0 ? (
                        <span className={styles.recorded}>Đã ghi</span>
                      ) : (
                        <span className={styles.pending}>Chưa tính</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <th scope="row">Tổng</th>
                  <td>{totalMetals.toFixed(2)} mL</td>
                  <td>
                    {feCalc !== null && znCalc !== null && pbCalc !== null
                      ? fmt(feCalc + znCalc + pbCalc) + ' mg/L'
                      : <em>—</em>}
                  </td>
                  <td>
                    {compDone ? (
                      <span className={styles.recorded}>Hoàn tất</span>
                    ) : (
                      <span className={styles.pending}>Đang pha</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {!compDone && (
            <p className={styles.hint}>
              Nhấn &ldquo;Tính mẫu&rdquo; ở Bàn 1 để ghi nồng độ và chuyển Bàn 2.
            </p>
          )}
        </section>
      )}

      {activeTab === 'treatment' && (
        <section role="tabpanel" className={styles.panel}>
          <h3 className={styles.panelTitle}>
            <GuideIcon />Xử lý hydroxide — Bàn 2
          </h3>

          {/* Current pH */}
          <div className={styles.readoutRow}>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>pH hiện tại</span>
              <strong className={styles.readoutValue}>{fmtp(treatmentStatus.pH)}</strong>
            </div>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>Thể tích mẫu</span>
              <strong className={styles.readoutValue}>{treatmentStatus.volumeMl} mL</strong>
            </div>
            <div className={styles.readout}>
              <span className={styles.readoutLabel}>NaOH đã thêm</span>
              <strong className={styles.readoutValue}>{treatmentStatus.naohAddedMl.toFixed(2)} mL</strong>
            </div>
          </div>

          {/* Stage status */}
          <div className={styles.stageRow}>
            <span className={treatmentStatus.stirring ? styles.stageActive : treatmentStatus.settled ? styles.stageDone : styles.stagePending}>
              {treatmentStatus.stirring ? '⚙ Khuấy…' : treatmentStatus.settled ? '✓ Đã lắng' : '○ Chưa lắng'}
            </span>
            <span className={treatmentStatus.filtered ? styles.stageDone : styles.stagePending}>
              {treatmentStatus.filtered ? '✓ Đã lọc' : '○ Chưa lọc'}
            </span>
          </div>

          {/* Filter history */}
          {filterHistory.length > 0 && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <caption>Lịch sử các lần lọc</caption>
                  <thead>
                    <tr>
                      <th>Lần</th>
                      <th>pH lọc</th>
                      <th>Fe còn</th>
                      <th>Zn còn</th>
                      <th>Pb còn</th>
                      <th>Fe kết tủa</th>
                      <th>Zn kết tủa</th>
                      <th>Pb kết tủa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterHistory.map((h, i) => (
                      <tr key={i}>
                        <th scope="row">{i + 1}</th>
                        <td>{fmtp(h.calculation.pH)}</td>
                        <td>{fmt(h.cumulativeRemaining.Fe)} mg/L</td>
                        <td>{fmt(h.cumulativeRemaining.Zn)} mg/L</td>
                        <td>{fmt(h.cumulativeRemaining.Pb)} mg/L</td>
                        <td>{h.cumulativeFiltered ? fmt(h.cumulativeFiltered.Fe) + ' mg/L' : <em>—</em>}</td>
                        <td>{h.cumulativeFiltered ? fmt(h.cumulativeFiltered.Zn) + ' mg/L' : <em>—</em>}</td>
                        <td>{h.cumulativeFiltered ? fmt(h.cumulativeFiltered.Pb) + ' mg/L' : <em>—</em>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {filterHistory.length === 0 && (
            <p className={styles.hint}>
              Chưa có lần lọc nào. Thêm NaOH, khuấy, lắng và nhấn &ldquo;Lọc&rdquo; ở Bàn 2.
            </p>
          )}

          {filterHistory.length > 0 && lastHistory && (
            <div className={styles.calculationBox}>
              <strong>Kết quả tính gần đây</strong>
              <dl className={styles.calculationDl}>
                <div><dt>Fe sau xử lý</dt><dd>{fmt(lastHistory.cumulativeRemaining.Fe)} mg/L</dd></div>
                <div><dt>Zn sau xử lý</dt><dd>{fmt(lastHistory.cumulativeRemaining.Zn)} mg/L</dd></div>
                <div><dt>Pb sau xử lý</dt><dd>{fmt(lastHistory.cumulativeRemaining.Pb)} mg/L</dd></div>
                <div><dt>Fe kết tủa tổng</dt><dd>{lastHistory.cumulativeFiltered ? fmt(lastHistory.cumulativeFiltered.Fe) + ' mg/L' : <em>—</em>}</dd></div>
                <div><dt>Zn kết tủa tổng</dt><dd>{lastHistory.cumulativeFiltered ? fmt(lastHistory.cumulativeFiltered.Zn) + ' mg/L' : <em>—</em>}</dd></div>
                <div><dt>Pb kết tủa tổng</dt><dd>{lastHistory.cumulativeFiltered ? fmt(lastHistory.cumulativeFiltered.Pb) + ' mg/L' : <em>—</em>}</dd></div>
                <div><dt>HCl đã dùng</dt><dd>{treatmentStatus.hclAddedMl.toFixed(2)} mL</dd></div>
              </dl>
            </div>
          )}
        </section>
      )}

      {activeTab === 'results' && (
        <section role="tabpanel" className={styles.panel}>
          <h3 className={styles.panelTitle}>
            <ReportIcon />Kết quả cuối cùng — Đối chiếu QCVN 40:2025 Cột A
          </h3>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>So sánh nồng độ sau xử lý với chuẩn xả thải công nghiệp</caption>
              <thead>
                <tr>
                  <th>Thông số</th>
                  <th>Sau xử lý</th>
                  <th>Cột A (QCVN)</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Fe', value: treatedFe, limit: QCVN_FE },
                  { label: 'Zn', value: treatedZn, limit: QCVN_ZN },
                  { label: 'Pb', value: treatedPb, limit: QCVN_PB },
                  { label: 'pH cuối', value: finalPH, limitMin: QCVN_PH_MIN, limitMax: QCVN_PH_MAX },
                ].map((row) => {
                  const isPh = 'limitMin' in row
                  const pass = isPh
                    ? row.value >= row.limitMin! && row.value <= row.limitMax!
                    : row.value !== null && row.value <= row.limit
                  return (
                    <tr key={row.label} className={pass ? styles.passRow : styles.failRow}>
                      <th scope="row">{row.label}</th>
                      <td>{row.value !== null ? fmt(row.value) + (isPh ? '' : ' mg/L') : <em>—</em>}</td>
                      <td>{isPh
                        ? `${row.limitMin}–${row.limitMax}`
                        : `≤ ${row.limit} mg/L`}
                      </td>
                      <td>{passFail(pass)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className={`${styles.summaryBox} ${allPass ? styles.summaryPass : styles.summaryFail}`}>
            <strong>{allPass ? '✓ Đạt toàn bộ Cột A QCVN 40:2025' : '✗ Chưa đạt toàn bộ chuẩn'}</strong>
            {!allPass && (
              <p>
                {[!fePass && 'Fe vượt giới hạn', !znPass && 'Zn vượt giới hạn', !pbPass && 'Pb vượt giới hạn', !phPass && 'pH ngoài dải cho phép']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <p className={styles.summaryNote}>
              Chuẩn Cột A là QCVN 40:2025/BTNMT — xả thải công nghiệp. Không dùng cho nước uống.
            </p>
          </div>

          {!ban2LockedData && (
            <p className={styles.hint}>
              Nhấn &ldquo;Khóa Bàn 2 &amp; sang Bàn 3&rdquo; ở Bàn 2 để cố định kết quả và kiểm tra cột A.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
