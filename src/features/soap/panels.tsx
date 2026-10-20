import { useEffect, useRef } from 'react'
import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'
import { SOAP_SOURCED_FORMULAS } from '@/content/evidence/soap.js'
import { TargetIcon, CloseIcon } from '@/features/workbench/icons.js'
import { formatPercent } from './guidance.js'
import bench from '@/features/extraction/bench.module.css'

const REQ = SOAP_PROFILE.requirements

const REQUIREMENTS = [
  'Nồng độ NaOH ' + formatPercent(REQ.lyeConcentration.min) + ' – ' + formatPercent(REQ.lyeConcentration.max) + ' (công thức c% theo IUPAC; khoảng đạt là tiêu chí học tập).',
  'Kiềm nguội tới ≤ ' + REQ.lyeTemperatureMaxC + ' °C trước khi đổ vào cốc trộn (tiêu chí học tập).',
  'Chênh nhiệt kiềm – dầu ≤ ' + REQ.deltaTMaxC + ' °C (dầu ' + SOAP_PROFILE.oilTemperatureC + ' °C; tiêu chí học tập).',
  'Superfat thực ' + formatPercent(REQ.superfat.min) + ' – ' + formatPercent(REQ.superfat.max) + ' (tiêu chí học tập, chưa gắn nguồn A).',
  'Khuấy và chờ dung dịch đặc lại rồi mới đổ khuôn.',
  'pH sau ủ ' + REQ.ph.min + ' – ' + REQ.ph.max + ' (có một nghiên cứu tham chiếu trên trang nguồn).',
]

export function SoapLearningGoal() {
  const details = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (details.current?.open && event.target instanceof Node && !details.current.contains(event.target)) details.current.open = false
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [])
  function close() {
    if (!details.current) return
    details.current.open = false
    details.current.querySelector('summary')?.focus()
  }
  return <div className={bench.goal}><details ref={details} className={bench.goalDetails} suppressHydrationWarning onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}>
    <summary aria-label="Mục tiêu & phạm vi"><TargetIcon/><span className={bench.goalButtonCopy}><strong>Mục tiêu<span className={bench.mobileScopeLabel}> | Phạm vi</span></strong><span>Bánh ủ, pH {REQ.ph.min}–{REQ.ph.max}</span></span><span className={bench.goalDivider} aria-hidden="true">|</span><span className={bench.goalScopeCopy}><strong>Phạm vi</strong><span>Cold process · NaOH</span></span></summary>
    <section className={bench.goalPanel} aria-label="Mục tiêu và phạm vi xà phòng hóa"><div className={bench.goalPanelHeading}><h2>Mục tiêu & phạm vi</h2><button type="button" aria-label="Đóng mục tiêu & phạm vi" onClick={close}><CloseIcon/></button></div>
      <div className={bench.goalIntro}><p className={bench.goalTitle}><strong>Làm ra bánh xà phòng đạt chất lượng</strong></p><p className={bench.goalSubtitle}>Làm tối đa {SOAP_PROFILE.maxSamples} mẫu thử. Chỉ cần một mẫu đạt mọi yêu cầu là thí nghiệm đạt. Công thức bên dưới chỉ hiện mục đã gắn nguồn A.</p></div>
      <div className={bench.goalPanelGrid}>
        <section><h3>Yêu cầu để đạt</h3><ul>{REQUIREMENTS.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><h3>Công thức đã gắn nguồn</h3><ul>{SOAP_SOURCED_FORMULAS.map((item) => <li key={item.key}>{item.title}: {item.lines[0]}</li>)}</ul></section>
        <section><h3>Bạn được chọn</h3><ul><li>Loại dầu và thể tích dầu rót.</li><li>Thể tích nước và khối lượng NaOH.</li><li>Lượng kiềm, dầu rót vào cốc trộn.</li><li>Khuấy tay hoặc khuấy máy.</li></ul></section>
        <section><h3>Điều kiện cố định</h3><dl><div><dt>Nhiệt phòng</dt><dd>{SOAP_PROFILE.roomTemperatureC} °C</dd></div><div><dt>Nhiệt dầu</dt><dd>{SOAP_PROFILE.oilTemperatureC} °C</dd></div><div><dt>Kính và găng</dt><dd>Đã đeo sẵn</dd></div><div><dt>Thứ tự an toàn</dt><dd>NaOH vào nước</dd></div></dl></section>
        <section><h3>Giới hạn mô phỏng</h3><p>Chỉ số game (η, ủ, đường cong pH theo S) không gắn nguồn A. Hình cốc minh họa trạng thái đã lưu, không tạo phép đo.</p></section>
      </div>
    </section>
  </details></div>
}
