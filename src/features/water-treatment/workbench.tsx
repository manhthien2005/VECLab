'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FlaskIcon,
  LayersIcon,
  ShieldCheckIcon,
  BookIcon,
  RepeatIcon,
} from '@/features/landing/icons.js'
import { TargetIcon, GuideIcon, TheoryIcon, SourcesIcon, ReportIcon, InfoIcon } from '@/features/workbench/icons.js'
import {
  WT_DATABASE,
  WT_KSP_LOGK,
  WT_KSP_REACTION,
  WT_OPEN_BLOCKERS,
  WT_OUTCOME,
  WT_QCVN_COLUMN_A,
  WT_SOLID_PHASE,
  type WaterTreatmentGoalStatus,
  type WaterTreatmentVerificationStatus,
} from './constants.js'
import styles from './workbench.module.css'
import { useWaterTreatmentAttempt, type Composition } from './use-water-treatment-attempt.js'

const WT_PATH = '/simulate/water-treatment'

/**
 * Map a goal status / verification status pair to a stable, accessible label.
 * Spec §4.1: never collapse into a single "đạt / không đạt" pill while P0 blockers
 * remain open.
 */
function goalStatusLabel(status: WaterTreatmentGoalStatus): string {
  switch (status) {
    case 'success':
      return 'Đạt mục tiêu mô phỏng'
    case 'partial-success':
      return 'Đạt một phần'
    case 'failed':
      return 'Không đạt mục tiêu'
    case 'invalid':
      return 'Không hợp lệ'
    case 'pending':
      return 'Đang chờ xử lý'
    case 'unknown':
      return 'Chưa xác định — chờ xác minh'
  }
}

function verificationStatusLabel(status: WaterTreatmentVerificationStatus): string {
  switch (status) {
    case 'pending':
      return 'Chưa kiểm chứng'
    case 'source-checked':
      return 'Đã khóa nguồn, chưa cross-check'
    case 'cross-checked':
      return 'Đã cross-check'
    case 'failed':
      return 'Cross-check thất bại'
  }
}

const GOAL_STATUS_TONE: Record<WaterTreatmentGoalStatus, 'unknown' | 'neutral' | 'positive' | 'negative'> = {
  unknown: 'unknown',
  pending: 'neutral',
  success: 'positive',
  'partial-success': 'neutral',
  failed: 'negative',
  invalid: 'negative',
}

const VERIFICATION_TONE: Record<WaterTreatmentVerificationStatus, 'unknown' | 'neutral' | 'positive' | 'negative'> = {
  pending: 'neutral',
  'source-checked': 'unknown',
  'cross-checked': 'positive',
  failed: 'negative',
}

type Pane = 'simulation' | 'controls' | 'notebook'

type Props = {
  attemptId: string | null
  invalidAttempt?: boolean
  openReport?: boolean
  initialPane?: Pane
}

export function WaterTreatmentWorkbench({
  attemptId,
  invalidAttempt = false,
  openReport = false,
  initialPane = 'simulation',
}: Props) {
  const [pane, setPane] = useState<Pane>(initialPane)
  const [reportOpen, setReportOpen] = useState(openReport)
  const attempt = useWaterTreatmentAttempt()
  const [dose, setDose] = useState(1.0)
  const [volume, setVolume] = useState(1000)
  const phase = 'active' as const
  // Goal status runtime: nếu có attempt history thì lấy latest; nếu chưa thì dùng WT_OUTCOME
  const outcome = attempt.state.history.length > 0 && attempt.state.history[attempt.state.history.length - 1]
    ? {
        ...WT_OUTCOME,
        goalStatus: attempt.state.history[attempt.state.history.length - 1]!.goalStatus,
      }
    : WT_OUTCOME
  const blockers = WT_OPEN_BLOCKERS
  const isCompositionSet = attempt.state.composition.Fe + attempt.state.composition.Zn + attempt.state.composition.Pb > 0
  const isMeasureDone = attempt.state.history.some((r) => r.action === 'measure-initial-ph')
  const isStirDone = attempt.state.history.some((r) => r.action === 'stir')
  const isFilterDone = attempt.state.history.some((r) => r.action === 'filter')

  const isUnavailable = invalidAttempt
  const goalTone = GOAL_STATUS_TONE[outcome.goalStatus]
  const verificationTone = VERIFICATION_TONE[outcome.verificationStatus]

  const header = (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link href="/" className={styles.brand} aria-label="Trang chủ VECLab">
          <span><FlaskIcon /></span>
          <strong>VECLab</strong>
        </Link>
        <Link href="/experiments" className={styles.back}>
          <ArrowRightIcon />Thí nghiệm
        </Link>
        <div className={styles.title}>
          <h1>Xử lý nước Fe, Zn và Pb</h1>
          <p>Hydroxide route · mẫu tổng hợp ảo</p>
        </div>
      </div>
      <div className={styles.headerRight}>
        <span className={styles.phaseBadge} data-phase={phase}>Bàn thực hành</span>
        <button
          type="button"
          className={styles.headerAction}
          aria-label="Xem báo cáo"
          title="Mở báo cáo"
          onClick={() => setReportOpen(true)}
          disabled={attempt.state.history.length === 0}
        >
          <ReportIcon /><span>Báo cáo</span>
        </button>
      </div>
    </header>
  )

  const goal = useMemo(
    () => (
      <section className={styles.goalPanel} aria-label="Mục tiêu & phạm vi">
        <h2><TargetIcon />Mục tiêu & phạm vi</h2>
        <p>
          Loại Fe, Zn và Pb khỏi mẫu nước tổng hợp ảo bằng hydroxide route; đối chiếu kết quả
          sau lọc với Cột A — QCVN 40:2025/BTNMT (Fe ≤ 2,0; Zn ≤ 1,0; Pb ≤ 0,1 mg/L; pH 6–9).
        </p>
        <dl className={styles.goalFacts}>
          <div>
            <dt>Thể tích mẫu</dt>
            <dd>500–2.000 mL · benchmark 1.000 mL</dd>
          </div>
          <div>
            <dt>Nhiệt độ mô hình</dt>
            <dd>25,0 °C (khóa theo bộ hằng số)</dd>
          </div>
          <div>
            <dt>pH ban đầu</dt>
            <dd>Tính từ composition — không phải user input</dd>
          </div>
          <div>
            <dt>Chuẩn mục tiêu</dt>
            <dd>Cột A (đã xác minh pháp lý ngày 16/10/2026)</dd>
          </div>
        </dl>
        <p className={styles.goalNote}>
          Trạng thái “đạt” chỉ có nghĩa là đạt ngưỡng mô phỏng của mục tiêu MVP, không phải
          chứng nhận mẫu nước thật đạt chuẩn.
        </p>
      </section>
    ),
    [],
  )

  const goalStatusBanner = useMemo<ReactNode>(() => {
    if (outcome.goalStatus !== 'unknown') return null
    return (
      <div className={styles.unknownBanner} role="status" aria-live="polite">
        <ShieldCheckIcon />
        <div>
          <p>
            <strong>{goalStatusLabel('unknown')}</strong> — chemistry baseline (D1–D5,
            chốt 16/10/2026) đã được <code>cross-check</code> bằng 7/7 case PHREEQC
            chuyên biệt trên database đã pin và QCVN 40:2025/BTNMT đã xác minh pháp lý.
            <em>Capacity 3 kim loại đồng thời</em> đã đóng 17/10/2026 (closed-form
            AI-prepared + user sign-off, sai số 0.008–0.023 log trong ±0.025) — xem
            {' '}<code>tools/research/phreeqc-pin/3.8.6-17100/cases/P0-C-CROSSCHECK-REPORT.md</code>.
            Còn <em>≥ 3 golden case</em> chưa chạy, nên solver chưa đáng tin cho user-facing.
            Bảng dưới vẫn là <em>xấp xỉ free-ion saturation</em>, chưa tính activity
            correction, complexation sulfate/carbonate, competing phases (Smithsonite,
            Hydrocerussite, Goethite, PbO…), kinetics, mass-balance.
          </p>
          <p className={styles.unknownReason}>
            Lý do giữ trạng thái: <code>{blockers.join(', ')}</code>. P0-F là blocker
            cuối cùng; khi đóng chính thức, <code>goalStatus</code> sẽ rời <code>unknown</code>
            và workbench thực hành được mở.
          </p>
        </div>
      </div>
    )
  }, [outcome.goalStatus, blockers])

  const sample = (
    <section className={styles.section} aria-label="Mẫu đầu vào">
      <header className={styles.sectionHeading}>
        <h2><FlaskIcon />Mẫu đầu vào</h2>
        <p>Nhập Fe / Zn / Pb (mg/L) và thể tích (mL). pH ban đầu mặc định 7,0 — solver sẽ tính pH thật từ composition khi cần.</p>
      </header>
      <div className={styles.sampleGrid}>
        <CompositionInput
          symbol="Fe"
          name="Sắt"
          value={attempt.state.composition.Fe}
          step={attempt.state.composition.Zn + attempt.state.composition.Pb > 0 ? 0.01 : 0.1}
          max={100}
          legal={WT_QCVN_COLUMN_A.Fe_mgPerL}
          onChange={(v) => attempt.setComposition({ ...attempt.state.composition, Fe: v })}
        />
        <CompositionInput
          symbol="Zn"
          name="Kẽm"
          value={attempt.state.composition.Zn}
          step={attempt.state.composition.Fe + attempt.state.composition.Pb > 0 ? 0.01 : 0.1}
          max={100}
          legal={WT_QCVN_COLUMN_A.Zn_mgPerL}
          onChange={(v) => attempt.setComposition({ ...attempt.state.composition, Zn: v })}
        />
        <CompositionInput
          symbol="Pb"
          name="Chì"
          value={attempt.state.composition.Pb}
          step={0.001}
          max={100}
          legal={WT_QCVN_COLUMN_A.Pb_mgPerL}
          onChange={(v) => attempt.setComposition({ ...attempt.state.composition, Pb: v })}
        />
      </div>
      <div className={styles.sampleControls}>
        <label>
          Thể tích mẫu (mL)
          <input
            type="number"
            min={100}
            max={5000}
            step={100}
            value={volume}
            onChange={(e) => setVolume(Math.max(100, Math.min(5000, Number(e.target.value) || 1000)))}
            disabled={attempt.state.isRunning}
          />
        </label>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={() => attempt.run('measure-initial-ph', { volume_mL: volume })}
          disabled={!isCompositionSet || attempt.state.isRunning || isMeasureDone}
        >
          <FlaskIcon />Đo pH ban đầu
        </button>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={attempt.reset}
          disabled={attempt.state.isRunning}
        >
          Reset attempt
        </button>
      </div>
      {attempt.state.error ? (
        <p className={styles.errorMessage} role="alert">Lỗi: {attempt.state.error}</p>
      ) : null}
      <p className={styles.sectionFootnote}>
        Cap slider tuân theo <code>100 / N²</code> với N là số kim loại tick (mục 3.2.2).
        Step Pb cố định 0,001 mg/L mọi mode (P0-H đã khóa).
      </p>
    </section>
  )

  const capacity = (
    <section className={styles.section} aria-label="Bảng capacity tĩnh theo pH">
      <header className={styles.sectionHeading}>
        <h2><LayersIcon />Capacity tĩnh theo pH (baseline §6.5.2)</h2>
        <p>Hiển thị tham khảo — chưa phải kết quả solver. Bảng này tái sử dụng từ
          <code>tools/research/verify-wt-capacity.mjs</code>.</p>
      </header>
      <div className={styles.tableScroll}>
        <table className={styles.capacityTable}>
          <caption className={styles.srOnly}>Nồng độ hòa tan cực đại mol/L tại từng pH theo baseline D1–D5</caption>
          <thead>
            <tr>
              <th scope="col">pH</th>
              <th scope="col">[Fe] free (mol/L)</th>
              <th scope="col">[Zn] free (mol/L)</th>
              <th scope="col">[Pb] free (mol/L)</th>
              <th scope="col">Fe mg/L tối đa</th>
              <th scope="col">Zn mg/L tối đa</th>
              <th scope="col">Pb mg/L tối đa</th>
            </tr>
          </thead>
          <tbody>
            {WT_CAPACITY_TABLE.map((row) => (
              <tr key={row.pH}>
                <th scope="row">{row.pH.toFixed(1)}</th>
                <td>{row.fe.toExponential(2)}</td>
                <td>{row.zn.toExponential(2)}</td>
                <td>{row.pb.toExponential(2)}</td>
                <td>{(row.fe * 55.845 * 1000).toExponential(2)}</td>
                <td>{(row.zn * 65.38 * 1000).toExponential(2)}</td>
                <td>{(row.pb * 207.2 * 1000).toExponential(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.sectionFootnote}>
        Bảng trên từ baseline đã cross-check (D1–D5 + 7/7 case PHREEQC PASS, 16/10/2026).
        Số liệu này <strong>đã được cross-check</strong> với PHREEQC ở tolerance ±0.025 log
        (xem <code>tools/research/phreeqc-pin/3.8.6-17100/cases/P0-C-CROSSCHECK-REPORT.md</code>).
        Khi solver được wire vào sẽ kèm <code>verificationStatus</code>.
      </p>
    </section>
  )

  const reagents = (
    <section className={styles.section} aria-label="Reagent dự kiến">
      <header className={styles.sectionHeading}>
        <h2><RepeatIcon />Reagent dự kiến (chưa mở)</h2>
        <p>MVP hydroxide route chỉ dùng hai reagent ảo. Cap liều và pH guard đã chốt.</p>
      </header>
      <div className={styles.reagentGrid}>
        <article className={styles.reagentCard}>
          <header>
            <h3>HCl 1,0 M</h3>
            <span className={styles.reagentDose}>cap 5 mL / lượt · tổng 10 mL</span>
          </header>
          <dl>
            <div><dt>pH guard</dt><dd>reject khi pH dự đoán &lt; 2,0</dd></div>
            <div><dt>Aliquot</dt><dd>0,05 · 0,10 · 0,50 · 1,00 · 5,00 mL</dd></div>
            <div><dt>Vai trò</dt><dd>Hạ pH khi mẫu ban đầu quá kiềm</dd></div>
          </dl>
        </article>
        <article className={styles.reagentCard}>
          <header>
            <h3>NaOH 1,0 M</h3>
            <span className={styles.reagentDose}>cap 5 mL / lượt · tổng 10 mL</span>
          </header>
          <dl>
            <div><dt>pH guard</dt><dd>reject khi pH dự đoán &gt; 9,0</dd></div>
            <div><dt>Aliquot</dt><dd>0,05 · 0,10 · 0,50 · 1,00 · 5,00 mL</dd></div>
            <div><dt>Vai trò</dt><dd>Nâng pH để Fe/Zn/Pb kết tủa hydroxide</dd></div>
          </dl>
        </article>
      </div>
    </section>
  )

  const phases = (
    <section className={styles.section} aria-label="Quy trình dự kiến">
      <header className={styles.sectionHeading}>
        <h2><RepeatIcon />Quy trình dự kiến</h2>
        <p>Bốn bước MVP (mục 7.4); nút thao tác bật khi sample đã sẵn sàng.</p>
      </header>
      <ol className={styles.phaseList}>
        <li><strong>1. Chuẩn bị mẫu</strong><span>Pick Fe / Zn / Pb + volume; pH ban đầu tính từ composition.</span></li>
        <li><strong>2. Điều chỉnh pH</strong><span>Thêm HCl / NaOH; mô hình pH (mục 6.1.1) dự đoán pH mới trước khi commit.</span></li>
        <li><strong>3. Khuấy · lắng · lọc</strong><span>Solver hydroxide route (mục 6.5) tính lại trạng thái; pha rắn chuyển sang sludge khi lọc.</span></li>
        <li><strong>4. Đo sau xử lý</strong><span>Đo pH và Fe / Zn / Pb; đối chiếu Cột A; sinh báo cáo.</span></li>
      </ol>
    </section>
  )

  const outcomeCard = (
    <section className={`${styles.section} ${styles.outcomeCard}`} aria-label="Trạng thái kết quả">
      <header className={styles.sectionHeading}>
        <h2><CheckCircleIcon />Trạng thái kết quả</h2>
        <p>Ba dòng riêng — theo spec §4.1 và evidence register §7. Không gộp thành một nhãn.</p>
      </header>
      <dl className={styles.outcomeList}>
        <div data-tone={goalTone}>
          <dt>expectedOutcome (mô hình kỳ vọng)</dt>
          <dd>{goalStatusLabel(outcome.expectedOutcome)}</dd>
        </div>
        <div data-tone={goalTone}>
          <dt>goalStatus (trạng thái hiển thị cho người học)</dt>
          <dd>
            <strong>{goalStatusLabel(outcome.goalStatus)}</strong>
            <small>
              Lý do: <code>{outcome.unknownReasonCodes.join(', ')}</code>
            </small>
          </dd>
        </div>
        <div data-tone={verificationTone}>
          <dt>verificationStatus (kiểm chứng)</dt>
          <dd>
            {verificationStatusLabel(outcome.verificationStatus)}
            <small>
              P0-A ✅ (QCVN xác minh pháp lý 16/10/2026); P0-D ✅ (6/6 claim +
              7/7 case PHREEQC PASS trên database đã pin).
            </small>
          </dd>
        </div>
      </dl>
      <p className={styles.outcomeHint}>
        Khi <code>goalStatus = &apos;unknown&apos;</code>, UI <strong>không</strong> hiển thị
        “đạt QCVN” / “không đạt QCVN” ở bất kỳ chỗ nào. Đây là rào chắn pháp lý bắt buộc.
        Với P0-F đã đóng, <code>goalStatus</code> rời <code>unknown</code> cho mọi input
        hợp lệ; input vi phạm pH guard [2; 13] / dose cap sẽ gán <code>invalid</code>.
      </p>
    </section>
  )

  const provenance = (
    <section className={styles.section} aria-label="Provenance hằng số Ksp">
      <header className={styles.sectionHeading}>
        <h2><BookIcon />Provenance hằng số Ksp (baseline đã cross-check)</h2>
        <p>
          Mỗi hằng số phải hiển thị phase + database + version + SHA-256 + trạng thái.
          6/6 claim ở <code>cross-checked</code> (16/10/2026) sau 7/7 case PHREEQC PASS.
        </p>
      </header>
      <div className={styles.tableScroll}>
        <table className={styles.provenanceTable}>
          <caption className={styles.srOnly}>Bảng provenance hằng số Ksp theo baseline D1–D5</caption>
          <thead>
            <tr>
              <th scope="col">Kim loại</th>
              <th scope="col">Pha rắn</th>
              <th scope="col">log K<sub>sp</sub></th>
              <th scope="col">Phản ứng</th>
              <th scope="col">Database (primary)</th>
              <th scope="col">SHA-256</th>
              <th scope="col">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Fe</th>
              <td>{WT_SOLID_PHASE.Fe}</td>
              <td>{WT_KSP_LOGK.Fe.toFixed(3)}</td>
              <td>{WT_KSP_REACTION.Fe}</td>
              <td>{WT_DATABASE.primary}</td>
              <td className={styles.shaCell}><code>{WT_DATABASE.primarySha256}</code></td>
              <td><span className={styles.statusChip} data-status="cross-checked">cross-checked</span></td>
            </tr>
            <tr>
              <th scope="row">Zn</th>
              <td>{WT_SOLID_PHASE.Zn}</td>
              <td>{WT_KSP_LOGK.Zn.toFixed(3)}</td>
              <td>{WT_KSP_REACTION.Zn}</td>
              <td>{WT_DATABASE.primary}</td>
              <td className={styles.shaCell}><code>{WT_DATABASE.primarySha256}</code></td>
              <td><span className={styles.statusChip} data-status="cross-checked">cross-checked</span></td>
            </tr>
            <tr>
              <th scope="row">Pb</th>
              <td>{WT_SOLID_PHASE.Pb}</td>
              <td>{WT_KSP_LOGK.Pb.toFixed(3)}</td>
              <td>{WT_KSP_REACTION.Pb}</td>
              <td>{WT_DATABASE.primary}</td>
              <td className={styles.shaCell}><code>{WT_DATABASE.primarySha256}</code></td>
              <td><span className={styles.statusChip} data-status="cross-checked">cross-checked</span></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={6}>
                Database release: <code>{WT_DATABASE.release}</code> · SHA-256{' '}
                <code>{WT_DATABASE.releaseSha256}</code>
              </th>
              <td><span className={styles.statusChip} data-status="cross-checked">cross-checked</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className={styles.sectionFootnote}>
        Bảng chỉ liệt kê <em>primary source</em>. <code>phreeqc.dat</code> được dùng làm
        alternative storage cùng <code>log_k</code> cho Fe / Zn / Pb trong cùng bản phát
        hành PHREEQC, <strong>không phải</strong> nguồn độc lập. Xem
        {' '}<code>docs/scientific-evidence-register.md</code> §6.7.2 và §7.
      </p>
    </section>
  )

  const references = (
    <section className={styles.section} aria-label="Nguồn & giới hạn">
      <header className={styles.sectionHeading}>
        <h2><SourcesIcon />Nguồn & giới hạn</h2>
      </header>
      <ul className={styles.referenceList}>
        <li>
          <a href="/evidence">Sổ đăng ký bằng chứng khoa học <ArrowRightIcon /></a>
          <p>Tất cả claim WT-CHEM-* và trạng thái kiểm chứng; P0-A + P0-C + P0-D + P0-F đã đóng.</p>
        </li>
        <li>
          <a href={'https://doi.org/' + 'placeholder'}>Thông tư 06/2025/TT-BTNMT (QCVN 40:2025/BTNMT) <ArrowRightIcon /></a>
          <p>SHA-256: <code>{WT_QCVN_COLUMN_A.pdfSha256}</code></p>
        </li>
        <li>
          <a href="/docs/experiments/water-treatment-spec.md">Đặc tả ý tưởng — nội bộ <ArrowRightIcon /></a>
          <p>Phiên bản <code>0.3.0-draft</code>; P0-A ✅, P0-C ✅, P0-D ✅, P0-F ✅ (17/10/2026).</p>
        </li>
      </ul>
    </section>
  )

  const toolbar = (
    <nav className={styles.paneNav} aria-label="Chuyển đổi khu vực làm việc">
      <button type="button" aria-pressed={pane === 'simulation'} onClick={() => setPane('simulation')}>Khu vực thực hành</button>
      <button type="button" aria-pressed={pane === 'controls'} onClick={() => setPane('controls')}>Thao tác</button>
      <button type="button" aria-pressed={pane === 'notebook'} onClick={() => setPane('notebook')}>Sổ đo & nhật ký</button>
    </nav>
  )

  if (isUnavailable) {
    return (
      <div className={styles.page} data-state="missing">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Thí nghiệm', href: '/experiments' },
            { label: 'Xử lý nước Fe, Zn và Pb' },
          ]}
        />
        <div className={styles.missing}>
          <h2>Không tìm thấy lượt thí nghiệm</h2>
          <p>Liên kết không hợp lệ hoặc lượt không còn tồn tại. Skeleton này chưa lưu lượt nào.</p>
          <a href={WT_PATH}>Về màn bàn thực hành</a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page} data-pane={pane}>
      <Breadcrumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Thí nghiệm', href: '/experiments' },
          { label: 'Xử lý nước Fe, Zn và Pb' },
        ]}
      />
      {header}
      {goalStatusBanner}

      <div className={styles.layout}>
        <aside className={styles.rail} aria-label="Mục tiêu & tham chiếu">
          {goal}
          <p className={styles.railHint}>
            <InfoIcon />
            <span>
              Bàn thực hành này <strong>lưu attempt trong client state</strong> (không persist
              DB). Mỗi lần refresh sẽ reset — dùng nút &quot;Reset attempt&quot; để bắt đầu
              lượt mới.
            </span>
          </p>
        </aside>

        <main className={styles.main}>
          {toolbar}
          {pane === 'simulation' ? (
            <div className={styles.stack}>
              {sample}
              {capacity}
              {reagents}
              {phases}
            </div>
          ) : null}
          {pane === 'controls' ? (
            <div className={styles.stack}>
              <section className={styles.section} aria-label="Thao tác (chưa mở)">
                <header className={styles.sectionHeading}>
                  <h2><GuideIcon />Thao tác</h2>
                  <p>
                    Nút thêm reagent, khuấy, lắng, lọc và đo chạy solver mỗi lần click
                    qua server action; lưu attempt vào client state.
                  </p>
                </header>
                <div className={styles.controlsGrid}>
                  <label>
                    Liều HCl / NaOH (mL, stock 1 M)
                    <input
                      type="number"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={dose}
                      onChange={(e) => setDose(Math.max(0.1, Math.min(10, Number(e.target.value) || 1)))}
                      disabled={attempt.state.isRunning}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => attempt.run('add-base', { dose_mL: dose, volume_mL: volume })}
                    disabled={!isMeasureDone || attempt.state.isRunning}
                  >
                    + NaOH (kiềm hóa)
                  </button>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => attempt.run('add-acid', { dose_mL: dose, volume_mL: volume })}
                    disabled={!isMeasureDone || attempt.state.isRunning}
                  >
                    + HCl (axit hóa)
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => attempt.run('stir', { volume_mL: volume })}
                    disabled={!isMeasureDone || isStirDone || attempt.state.isRunning}
                  >
                    Khuấy 5 phút
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => attempt.run('settle', { volume_mL: volume })}
                    disabled={!isStirDone || attempt.state.isRunning}
                  >
                    Lắng 15 phút
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => attempt.run('filter', { volume_mL: volume })}
                    disabled={!isStirDone || isFilterDone || attempt.state.isRunning}
                  >
                    Lọc phase rắn
                  </button>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => attempt.run('measure-final', { volume_mL: volume })}
                    disabled={!isFilterDone || attempt.state.isRunning}
                  >
                    Đo pH & Fe/Zn/Pb cuối
                  </button>
                </div>
                {attempt.state.isRunning ? (
                  <p className={styles.runningNote} role="status" aria-live="polite">
                    Đang chạy solver…
                  </p>
                ) : null}
                {attempt.state.error ? (
                  <p className={styles.errorMessage} role="alert">Lỗi: {attempt.state.error}</p>
                ) : null}
                <p className={styles.sectionFootnote}>
                  Thứ tự đề xuất (mục 7.4): <strong>đo pH → kiềm hóa (NaOH) → khuấy → lắng → lọc → đo cuối</strong>.
                  GoalStatus tính sau bước lọc.
                </p>
              </section>
              <TheoryCard />
            </div>
          ) : null}
          {pane === 'notebook' ? (
            <div className={styles.stack}>
              <section className={styles.section} aria-label="Sổ đo & nhật ký">
                <header className={styles.sectionHeading}>
                  <h2><ReportIcon />Sổ đo & nhật ký</h2>
                  <p>
                    {attempt.state.history.length === 0
                      ? 'Chưa có attempt nào. Thực hiện ít nhất một thao tác ở tab Thao tác để thấy lịch sử.'
                      : `Attempt hiện tại: ${attempt.state.history.length} bước. pH hiện tại: ${attempt.state.pH.toFixed(2)}.`}
                  </p>
                </header>
                {attempt.state.history.length > 0 ? (
                  <ol className={styles.eventLog}>
                    {attempt.state.history.map((r) => (
                      <li key={r.events[0]?.timestamp ?? 0} className={styles.eventItem}>
                        <div>
                          <strong>{r.action}</strong>
                          <span className={styles.eventTime}>
                            {new Date(r.events[0]?.timestamp ?? 0).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                        <p className={styles.eventNote}>{r.events[0]?.note ?? ''}</p>
                        {r.pHGuardHit ? (
                          <p className={styles.guardHit}>
                            ⚠️ pH guard hit: {r.pHGuardHit} (pH {r.pH.toFixed(2)} ngoài [2; 13])
                          </p>
                        ) : null}
                        {r.action === 'measure-final' || r.action === 'filter' ? (
                          <p className={styles.filtrateSummary}>
                            Filtrate kỳ vọng (mg/L): Fe {r.filtrate_mgPerL.Fe.toExponential(2)} ·
                            Zn {r.filtrate_mgPerL.Zn.toExponential(2)} · Pb {r.filtrate_mgPerL.Pb.toExponential(2)}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={styles.controlsPlaceholder}>
                    Lịch sử thao tác, pH guard hits, dose limit hits và report sẽ xuất hiện ở đây sau
                    khi attempt đầu tiên hoàn tất.
                  </p>
                )}
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => setReportOpen(true)}
                  disabled={attempt.state.history.length === 0}
                >
                  <ReportIcon />Mở báo cáo
                </button>
              </section>
              {references}
            </div>
          ) : null}
        </main>
      </div>

      <section className={styles.outcomeRow} aria-label="Tóm tắt trạng thái">
        {outcomeCard}
        {provenance}
      </section>

      <footer className={styles.footer}>
        <p>
          attemptId: <code>{attemptId ?? '—'}</code> · mô hình hóa học baseline D1–D5
          (16/10/2026) · P0-A ✅, P0-C ✅ (17/10/2026), P0-D ✅, P0-F ✅ (17/10/2026).
        </p>
        <p>
          <Link href="/experiments">Về danh sách thí nghiệm <ArrowRightIcon /></Link>
          {' · '}
          <Link href="/evidence">Sổ đăng ký bằng chứng <ArrowRightIcon /></Link>
        </p>
      </footer>

      {reportOpen ? (
        <div role="dialog" aria-modal="true" aria-label="Báo cáo" className={styles.dialog}>
          <div className={styles.dialogBody}>
            <header>
              <h2>Báo cáo</h2>
              <button type="button" onClick={() => setReportOpen(false)} aria-label="Đóng">×</button>
            </header>
            <p>
              Báo cáo hiển thị kết quả solver end-to-end (composition đầu vào, capacity
              closed-form, filtrate kỳ vọng, so sánh Cột A QCVN). Mở từ header khi có attempt.
            </p>
            <ReportBody history={attempt.state.history} composition={attempt.state.composition} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ReportBody({
  history,
  composition,
}: {
  history: ReadonlyArray<{
    action: string
    pH: number
    capacity_mgPerL: { Fe: number; Zn: number; Pb: number }
    filtrate_mgPerL: { Fe: number; Zn: number; Pb: number }
    precipitated_mgPerL: { Fe: number; Zn: number; Pb: number }
    pHGuardHit: 'min' | 'max' | null
    goalStatus: string
    invalidReasonCodes: ReadonlyArray<string>
  }>
  composition: { Fe: number; Zn: number; Pb: number }
}): ReactNode {
  if (history.length === 0) {
    return <p>Chưa có dữ liệu attempt.</p>
  }
  const finalStep = history[history.length - 1]!
  const hasFiltrate =
    finalStep.action === 'filter' ||
    finalStep.action === 'measure-final' ||
    history.some((h) => h.action === 'filter')
  const filtrateStep = [...history].reverse().find((h) => h.action === 'filter' || h.action === 'measure-final')
  return (
    <div className={styles.reportBody}>
      <h3>Tóm tắt attempt</h3>
      <dl className={styles.reportDl}>
        <dt>Composition đầu vào (mg/L)</dt>
        <dd>Fe {composition.Fe} · Zn {composition.Zn} · Pb {composition.Pb}</dd>
        <dt>Số bước đã thực hiện</dt>
        <dd>{history.length}</dd>
        <dt>pH cuối</dt>
        <dd>{finalStep.pH.toFixed(2)}</dd>
        <dt>Trạng thái cuối</dt>
        <dd><strong>{finalStep.goalStatus}</strong></dd>
        {finalStep.invalidReasonCodes.length > 0 ? (
          <>
            <dt>Lý do invalid</dt>
            <dd><code>{finalStep.invalidReasonCodes.join(', ')}</code></dd>
          </>
        ) : null}
      </dl>
      {hasFiltrate && filtrateStep ? (
        <>
          <h3>Filtrate kỳ vọng vs Cột A</h3>
          <table className={styles.reportTable}>
            <thead>
              <tr><th>Kim loại</th><th>Filtrate (mg/L)</th><th>Cột A (mg/L)</th><th>Kết quả</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Fe</td>
                <td>{filtrateStep.filtrate_mgPerL.Fe.toExponential(2)}</td>
                <td>{WT_QCVN_COLUMN_A.Fe_mgPerL}</td>
                <td>{filtrateStep.filtrate_mgPerL.Fe <= WT_QCVN_COLUMN_A.Fe_mgPerL ? '✅' : '❌'}</td>
              </tr>
              <tr>
                <td>Zn</td>
                <td>{filtrateStep.filtrate_mgPerL.Zn.toExponential(2)}</td>
                <td>{WT_QCVN_COLUMN_A.Zn_mgPerL}</td>
                <td>{filtrateStep.filtrate_mgPerL.Zn <= WT_QCVN_COLUMN_A.Zn_mgPerL ? '✅' : '❌'}</td>
              </tr>
              <tr>
                <td>Pb</td>
                <td>{filtrateStep.filtrate_mgPerL.Pb.toExponential(2)}</td>
                <td>{WT_QCVN_COLUMN_A.Pb_mgPerL}</td>
                <td>{filtrateStep.filtrate_mgPerL.Pb <= WT_QCVN_COLUMN_A.Pb_mgPerL ? '✅' : '❌'}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <p>
          Chưa có filtrate. Thực hiện bước <strong>Lọc phase rắn</strong> hoặc{' '}
          <strong>Đo pH &amp; Fe/Zn/Pb cuối</strong> để có kết quả so sánh Cột A.
        </p>
      )}
    </div>
  )
}

function SampleRow({ symbol, name, legal }: { symbol: string; name: string; legal: string }) {
  return (
    <article className={styles.sampleCard} data-symbol={symbol}>
      <header>
        <strong>{symbol}</strong>
        <span>{name}</span>
      </header>
      <dl>
        <div><dt>Giới hạn Cột A</dt><dd>{legal} mg/L</dd></div>
      </dl>
    </article>
  )
}

function CompositionInput({
  symbol,
  name,
  value,
  step,
  max,
  legal,
  onChange,
}: {
  symbol: string
  name: string
  value: number
  step: number
  max: number
  legal: number
  onChange: (next: number) => void
}) {
  const capped = Math.max(0, Math.min(max, value || 0))
  return (
    <article className={styles.sampleCard} data-symbol={symbol}>
      <header>
        <strong>{symbol}</strong>
        <span>{name}</span>
      </header>
      <dl>
        <div>
          <dt>Nồng độ (mg/L)</dt>
          <dd>
            <input
              type="number"
              min={0}
              max={max}
              step={step}
              value={Number.isFinite(capped) ? capped : 0}
              onChange={(e) => {
                const next = Number(e.target.value)
                onChange(Number.isFinite(next) ? Math.max(0, Math.min(max, next)) : 0)
              }}
            />
          </dd>
        </div>
        <div>
          <dt>Step</dt>
          <dd>{step} mg/L</dd>
        </div>
        <div>
          <dt>Giới hạn Cột A</dt>
          <dd>≤ {legal} mg/L</dd>
        </div>
      </dl>
    </article>
  )
}

function TheoryCard() {
  return (
    <section className={styles.section} aria-label="Lý thuyết & cách làm bài">
      <header className={styles.sectionHeading}>
        <h2><TheoryIcon />Lý thuyết & cách làm bài</h2>
        <p>Liên kết đến tài liệu chi tiết khi workbench thực hành mở.</p>
      </header>
      <ul className={styles.theoryList}>
        <li>
          <strong>pH không phải là user input</strong> — pH ban đầu là kết quả tính từ
          composition sau khi pha muối precursor (FeCl₃·6H₂O, ZnSO₄·7H₂O, Pb(NO₃)₂).
        </li>
        <li>
          <strong>Mỗi kim loại có Ksp riêng</strong> — pH cần thiết để đạt Cột A phụ thuộc
          Ksp và nồng độ ban đầu. Skeleton này dùng baseline mới (D1–D5).
        </li>
        <li>
          <strong>Kim loại chuyển sang pha rắn chỉ được tính là đã loại bỏ</strong> sau khi
          có bước tách bùn hoặc lọc (mục 7.4.5).
        </li>
        <li>
          <strong>Mỗi lần đo là một snapshot</strong> — thêm hóa chất hoặc thay đổi quy
          trình làm mất hiệu lực phép đo cũ.
        </li>
      </ul>
    </section>
  )
}
