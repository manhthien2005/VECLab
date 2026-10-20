import { SOAP_PROFILE, type SoapVesselId } from '@/domain/experiments/soap/model.js'
import { SOAP_SOURCES, SOAP_SOURCED_FORMULAS } from '@/content/evidence/soap.js'
import type { SoapProjection } from '@/application/scenarios/soap-projection.js'
import styles from './apparatus.module.css'

export const OIL_LABEL = { olive: 'Ô liu', coconut: 'Dừa', palm: 'Cọ' } as const

/** Deterministic vi-style number text so SSR and the browser never disagree. */
export function formatNumber(value: number, digits = 1): string {
  const fixed = value.toFixed(digits)
  const trimmed = digits > 0 ? fixed.replace(/\.?0+$/, '') : fixed
  const [whole, fraction] = trimmed.split('.')
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return fraction ? grouped + ',' + fraction : grouped
}

export function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : formatNumber(value * 100, 1) + ' %'
}

const REQ = SOAP_PROFILE.requirements

type Requirement = { label: string; target: string; current?: string | null; ok?: boolean | null }

function state(row: Requirement): string {
  if (row.ok === undefined || row.ok === null) return 'idle'
  return row.ok ? 'ok' : 'bad'
}

function inRange(value: number | null, min: number, max: number): boolean | null {
  return value === null ? null : value >= min && value <= max
}

function requirements(id: SoapVesselId, p: SoapProjection): Requirement[] {
  const lye = p.vessels.find((item) => item.id === 'W')!
  const mixing = p.vessels.find((item) => item.id === 'M')!
  const cupCapacity = (target: SoapVesselId) => formatNumber(p.vessels.find((item) => item.id === target)!.capacityMl, 0) + ' mL'
  const limits = SOAP_PROFILE.oils[p.oilType]
  const conc = REQ.lyeConcentration
  const sap = REQ.superfat
  if (id === 'W') {
    return [
      { label: 'Thứ tự pha', target: 'NaOH vào nước. Nước vào NaOH rắn làm vỡ cốc.' },
      { label: 'Nồng độ NaOH', target: formatPercent(conc.min) + ' – ' + formatPercent(conc.max), current: lye.lyeConcentration === null ? null : formatPercent(lye.lyeConcentration), ok: inRange(lye.lyeConcentration, conc.min, conc.max) },
      { label: 'Nhiệt dung dịch khi đổ sang cốc trộn', target: '≤ ' + REQ.lyeTemperatureMaxC + ' °C', current: lye.hasLye ? formatNumber(lye.temperatureC, 1) + ' °C' : null, ok: lye.hasLye ? lye.temperatureC <= REQ.lyeTemperatureMaxC : null },
      { label: 'Tổng thể tích', target: '≤ ' + cupCapacity('W'), current: lye.volumeMl > 0 ? formatNumber(lye.volumeMl, 1) + ' mL' : null, ok: lye.volumeMl > 0 ? lye.volumeMl <= lye.capacityMl : null },
    ]
  }
  if (id === 'O') {
    const oil = p.vessels.find((item) => item.id === 'O')!
    return [
      { label: 'Loại dầu', target: OIL_LABEL[p.oilType] + ' · ρ = ' + formatNumber(limits.densityGPerMl, 2) + ' g/mL' },
      { label: 'Dầu trong cốc', target: 'Theo mL đã rót (đổi sang g bằng mật độ)', current: oil.hasOil ? formatNumber(oil.oilG, 1) + ' g' : null, ok: oil.hasOil ? true : null },
      { label: 'Tổng thể tích', target: '≤ ' + cupCapacity('O'), current: oil.volumeMl > 0 ? formatNumber(oil.volumeMl, 1) + ' mL' : null, ok: oil.volumeMl > 0 ? oil.volumeMl <= oil.capacityMl : null },
      { label: 'Nhiệt dầu (cố định)', target: SOAP_PROFILE.oilTemperatureC + ' °C' },
    ]
  }
  if (id === 'M') {
    const shown = p.mix.stirred
    return [
      { label: 'Superfat thực của hỗn hợp', target: formatPercent(sap.min) + ' – ' + formatPercent(sap.max), current: shown ? formatPercent(p.mix.superfat) : null, ok: shown ? inRange(p.mix.superfat, sap.min, sap.max) : null },
      { label: 'Nồng độ kiềm', target: formatPercent(conc.min) + ' – ' + formatPercent(conc.max), current: shown ? formatPercent(p.mix.lyeConcentration) : null, ok: shown ? inRange(p.mix.lyeConcentration, conc.min, conc.max) : null },
      { label: 'Chênh nhiệt kiềm – dầu', target: '≤ ' + REQ.deltaTMaxC + ' °C', current: shown && p.mix.deltaTC !== null ? formatNumber(p.mix.deltaTC, 1) + ' °C' : null, ok: shown && p.mix.deltaTC !== null ? p.mix.deltaTC <= REQ.deltaTMaxC : null },
      { label: 'Nhiệt hỗn hợp khi khuấy máy', target: '< ' + SOAP_PROFILE.seizingMixtureC + ' °C (cao hơn: đông cứng)', current: shown ? formatNumber(p.mix.mixtureTempC, 1) + ' °C' : null, ok: shown ? p.mix.mixtureTempC < SOAP_PROFILE.seizingMixtureC : null },
      { label: 'Trước khi đổ khuôn', target: 'Khuấy và chờ dung dịch đặc lại', current: p.mix.traced ? 'Đã đặc lại' : shown ? 'Đã khuấy, chưa đặc' : null, ok: p.mix.traced ? true : null },
      { label: 'Tổng thể tích', target: '≤ ' + cupCapacity('M'), current: mixing.volumeMl > 0 ? formatNumber(mixing.volumeMl, 1) + ' mL' : null, ok: mixing.volumeMl > 0 ? mixing.volumeMl <= mixing.capacityMl : null },
    ]
  }
  return [
    { label: 'Đổ khuôn', target: 'Sau khi dung dịch đặc lại' },
    { label: 'Ủ', target: SOAP_PROFILE.gelHours + ' giờ trong khuôn, tháo khuôn, rồi ' + SOAP_PROFILE.cureWeeks + ' tuần' },
    { label: 'pH sau ủ', target: REQ.ph.min + ' – ' + REQ.ph.max },
    { label: 'Đạt thí nghiệm', target: 'Ít nhất 1 mẫu đạt mọi yêu cầu (tối đa ' + SOAP_PROFILE.maxSamples + ' mẫu)' },
  ]
}

export function SoapRequirements({ id, projection }: { id: SoapVesselId; projection: SoapProjection }) {
  return <aside className={styles.guide} aria-label="Chỉ số yêu cầu để đạt">
    <h3>Yêu cầu để đạt</h3>
    <ul className={styles.reqList}>{requirements(id, projection).map((row) => <li key={row.label} data-state={state(row)}>
      <span>{row.label}</span>
      <strong>{row.target}</strong>
      {row.current ? <small>Hiện tại: {row.current}</small> : null}
    </li>)}</ul>
  </aside>
}

function sourceTitles(keys: readonly string[]): string {
  return keys.map((key) => SOAP_SOURCES.find((item) => item.key === key)?.title ?? key).join(' · ')
}

/** Only status-A formula groups for the selected cup; unsourced lines stay hidden. */
function formulas(id: SoapVesselId): { title: string; lines: string[]; sources: string }[] {
  return SOAP_SOURCED_FORMULAS
    .filter((item) => (item.cups as readonly string[]).includes(id))
    .map((item) => ({ title: item.title, lines: [...item.lines], sources: sourceTitles(item.sourceKeys) }))
}

export function SoapFormulas({ id }: { id: SoapVesselId }) {
  const groups = formulas(id)
  return <aside className={styles.guide} aria-label="Công thức có nguồn">
    <h3>Công thức có nguồn</h3>
    {groups.length === 0
      ? <p>Cốc này chưa có công thức gắn nguồn A. Các giả định game không hiện ở đây.</p>
      : groups.map((group) => <section key={group.title}>
        <h4>{group.title}</h4>
        {group.lines.map((line) => <p key={line}>{line}</p>)}
        <p className={styles.sourceNote}>Nguồn: {group.sources}</p>
      </section>)}
  </aside>
}
