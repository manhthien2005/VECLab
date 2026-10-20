import Link from 'next/link'
import { CheckCircleIcon } from '@/features/landing/icons.js'
import { SOAP_PROFILE, type SoapCriterionKey, type SoapGrade, type SoapSample } from '@/domain/experiments/soap/model.js'
import type { SoapReportSnapshot } from '@/application/scenarios/soap-projection.js'
import { OIL_LABEL, formatNumber, formatPercent } from './guidance.js'
import { SoapBarArt } from './mold-art.js'
import { FAILURE_REASON } from './progress.js'
import styles from '@/features/extraction/report.module.css'
import extra from './workbench.module.css'

const REQ = SOAP_PROFILE.requirements

const GRADE_LABEL: Record<SoapGrade, string> = {
  pass: 'Đạt', fail: 'Chưa đạt', danger: 'Thất bại', incomplete: 'Chưa có mẫu',
}

const DIAGNOSTICS: Record<string, string> = {
  PHASE_SEP_RISK: 'Dầu và kiềm chưa trộn đều khi đổ khuôn: có nguy cơ tách pha.',
  POURED_BEFORE_TRACE: 'Có mẫu được đổ khuôn trước khi dung dịch đặc lại.',
}

type Criterion = { label: string; target: string; show: (actual: number | boolean | null) => string }

const number = (digits: number, unit: string) => (actual: number | boolean | null) =>
  typeof actual === 'number' ? formatNumber(actual, digits) + unit : 'N/A'

const CRITERIA: Record<SoapCriterionKey, Criterion> = {
  lye_concentration: {
    label: 'Nồng độ NaOH', target: formatPercent(REQ.lyeConcentration.min) + ' – ' + formatPercent(REQ.lyeConcentration.max),
    show: (actual) => typeof actual === 'number' ? formatPercent(actual) : 'N/A',
  },
  lye_cooled: { label: 'Nhiệt kiềm khi đổ', target: '≤ ' + REQ.lyeTemperatureMaxC + ' °C', show: number(1, ' °C') },
  delta_t: { label: 'Chênh nhiệt kiềm – dầu', target: '≤ ' + REQ.deltaTMaxC + ' °C', show: number(1, ' °C') },
  superfat: {
    label: 'Superfat thực', target: formatPercent(REQ.superfat.min) + ' – ' + formatPercent(REQ.superfat.max),
    show: (actual) => typeof actual === 'number' ? formatPercent(actual) : 'N/A',
  },
  thickened_before_mold: {
    label: 'Đặc lại trước khi đổ khuôn', target: 'Có',
    show: (actual) => actual === true ? 'Có' : actual === false ? 'Không' : 'N/A',
  },
  ph: { label: 'pH sau ủ', target: REQ.ph.min + ' – ' + REQ.ph.max, show: number(2, '') },
}

function headline(report: SoapReportSnapshot): { title: string; why: string } {
  const passed = report.projection.samples.filter((sample) => sample.passed).length
  switch (report.grade) {
    case 'danger': return { title: 'Thí nghiệm thất bại', why: FAILURE_REASON }
    case 'pass': return { title: 'Thí nghiệm đạt', why: passed + ' mẫu đạt mọi yêu cầu. Chỉ cần một mẫu đạt là thí nghiệm đạt.' }
    case 'fail': return { title: 'Thí nghiệm chưa đạt', why: 'Không mẫu nào đạt mọi yêu cầu. Xem từng yêu cầu bên dưới.' }
    case 'incomplete': return { title: 'Chưa có mẫu thử', why: 'Cần đo ít nhất một mẫu để chấm điểm.' }
  }
}

function SampleTable({ sample }: { sample: SoapSample }) {
  return <div className={styles.tableScroll}><table>
    <caption>Mẫu {sample.index} · {OIL_LABEL[sample.oilType]} · {sample.passed ? 'Đạt' : 'Chưa đạt'}</caption>
    <thead><tr><th>Yêu cầu</th><th>Kết quả</th><th>Đạt</th><th>Mục tiêu</th></tr></thead>
    <tbody>{sample.criteria.map((criterion) => {
      const spec = CRITERIA[criterion.key]
      return <tr key={criterion.key}>
        <th scope="row">{spec.label}</th>
        <td>{spec.show(criterion.actual)}</td>
        <td>{criterion.met ? 'Đạt' : 'Chưa'}</td>
        <td>{spec.target}</td>
      </tr>
    })}</tbody>
  </table></div>
}

export function SoapReport({ report }: { report: SoapReportSnapshot }) {
  const { samples } = report.projection
  const { title, why } = headline(report)
  const best = samples.find((sample) => sample.passed) ?? samples.at(-1)
  return <div className={styles.report}>
    <div className={styles.status} data-met={report.grade === 'pass'}>
      <h2>{title}</h2>
      <p>{why}</p>
      <p className={styles.protocol}><strong>Kết quả: {GRADE_LABEL[report.grade]}</strong> · {samples.length} / {SOAP_PROFILE.maxSamples} mẫu</p>
    </div>
    <Achievement grade={report.grade} sample={best}/>
    {samples.length > 0 && <section className={styles.results} aria-label="Đối chiếu từng mẫu với yêu cầu">
      <h3>Từng mẫu được chấm thế nào</h3>
      <p className={styles.context}>Chỉ số lấy từ thao tác đã lưu và phép đo trong sổ. Hình bánh chỉ minh họa.</p>
      {samples.map((sample) => <SampleTable key={sample.index} sample={sample}/>)}
    </section>}
    {report.diagnostics.length > 0 && <section className={styles.review} aria-label="Cảnh báo đã lưu">
      <h3>Cảnh báo trong lượt</h3>
      <ul className={styles.diagnostics}>{report.diagnostics.map((item) => <li key={item}><p>{DIAGNOSTICS[item] ?? 'Có cảnh báo trong lượt.'}</p></li>)}</ul>
    </section>}
    <p className={styles.note}>Mô hình học tập. Không dùng số này để nấu xà phòng thật.</p>
    <div className={extra.reportActions}>
      <Link className={extra.reportLink} href="/simulate/cold-process-soap">Làm lượt mới</Link>
    </div>
  </div>
}

function Achievement({ grade, sample }: { grade: SoapGrade; sample: SoapSample | undefined }) {
  if (grade === 'danger' || !sample) {
    return <div className={extra.achievement}><p className={extra.grade} data-grade={grade}>{GRADE_LABEL[grade]}</p><p>Không có bánh thành phẩm.</p></div>
  }
  return <div className={extra.achievement}>
    <svg viewBox="-20 -34 190 110" aria-hidden="true"><g className={extra.bar}><SoapBarArt tone="cured" uid="report"/></g></svg>
    <p className={extra.grade} data-grade={grade}>{GRADE_LABEL[grade]}</p>
    {grade === 'pass' && <p><CheckCircleIcon /> Mẫu {sample.index} đạt mọi yêu cầu: pH {formatNumber(sample.soap.ph, 2)}.</p>}
  </div>
}
