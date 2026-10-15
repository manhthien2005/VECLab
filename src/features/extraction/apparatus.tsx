'use client'
import type { ExtractionProjection } from '@/application/scenarios/extraction-projection.js'
import type { VesselId } from '@/domain/experiments/acid-base-extraction/model.js'
import styles from './workbench.module.css'
export const VESSEL_NAMES: Record<VesselId, string> = { S: 'Mẫu ban đầu', F: 'Phễu chiết', R1: 'Bình thu 1', R2: 'Bình thu 2', R3: 'Bình thu 3', W: 'Bình thải' }
export function ExtractionApparatus({ projection, selected, onSelect, motion }: { projection: ExtractionProjection; selected: VesselId; onSelect: (id: VesselId) => void; motion: string }) {
  const v = projection.vessels.find(item => item.id === selected)!
  const parts=motion.split('-')
  const operation=parts[1]===selected?parts[0]:'idle'
  const last=projection.history.at(-1)
  const total = v.waterMl + v.organicMl
  const waterHeight = total ? Math.min(145, total * 1.8) * v.waterMl / total : 0
  const organicHeight = total ? Math.min(145, total * 1.8) * v.organicMl / total : 0
  const top = 273 - waterHeight - organicHeight
  return <div className={styles.stage}>
    <div className={styles.stageHeading}><div><h2>Khu vực thực hành</h2><p>{VESSEL_NAMES[selected]} · {selected}</p></div><span className={styles.phaseTag}>{total === 0 ? v.solidPresent ? 'Chất rắn' : 'Bình trống' : v.separated ? v.waterMl && v.organicMl ? 'Hai pha đã tách' : 'Một pha lỏng' : 'Chờ phân lớp'}</span></div>
    <div className={styles.apparatus} data-motion={operation}>
      <svg key={motion} viewBox="0 0 580 340" role="img" aria-label={`${VESSEL_NAMES[selected]}: ${v.waterMl.toFixed(1)} mL pha nước, ${v.organicMl.toFixed(1)} mL pha hữu cơ${v.solidPresent ? ', có chất rắn' : ''}`}>
        <defs><clipPath id="extraction-vessel-clip"><path d={selected === 'F' ? 'M215 85Q208 160 250 220L280 265V290H300V265L330 220Q372 160 365 85Z' : 'M215 105H365V275Q290 298 215 275Z'} /></clipPath></defs>
        <path d="M140 310H440" stroke="var(--border-strong)" strokeWidth="5" strokeLinecap="round" />
        {selected === 'F' && <g stroke="var(--ink-faint)" fill="none" strokeWidth="5"><path d="M170 310V45M170 104H214M170 116H214" /><ellipse cx="290" cy="93" rx="86" ry="11" /></g>}
        <g className={styles.vesselMotion}>
          <g clipPath="url(#extraction-vessel-clip)">
            <rect x="210" y="80" width="160" height="230" fill="var(--surface-2)" />
            {v.separated ? <><rect className={styles.liquid} x="210" y={273-waterHeight} width="160" height={waterHeight+8} fill="#9ddbdc" /><rect className={styles.liquid} x="210" y={top} width="160" height={organicHeight} fill="#f1d59f" /></> : <rect x="210" y={top} width="160" height={waterHeight+organicHeight+8} fill="#b9d1d1" />}
            {v.solidPresent && <g fill="#e3ddd0" stroke="#aea896" strokeWidth="1">{Array.from({ length: 13 }, (_, i) => <ellipse key={i} cx={230+i*10} cy={272+(i%3)*4} rx="7" ry="3" />)}</g>}
            <path className={styles.swirl} d="M235 200Q290 180 345 200M240 216Q290 236 340 216" stroke="#fff" strokeWidth="2" fill="none" />
          </g>
          <path d={selected === 'F' ? 'M215 85Q208 160 250 220L280 265V290H300V265L330 220Q372 160 365 85Z' : 'M215 105H365V275Q290 298 215 275Z'} fill="none" stroke="#6d94a5" strokeWidth="2.5" />
          {selected === 'F' ? <><rect x="266" y="65" width="48" height="20" rx="5" fill="#b2c5cc" stroke="#6d94a5" /><path d="M290 290V313M273 298H307" stroke="#6d94a5" strokeWidth="5" strokeLinecap="round" /></> : <path d="M210 105H370M223 116V258" stroke="#8aabb9" strokeWidth="2" fill="none" />}
        </g>
        {operation==='transfer' && <g className={styles.transferTool}>
          <path d="M215 180Q125 115 95 205" fill="none" stroke="#6caeb4" strokeWidth="2" strokeDasharray="5 6"/>
          <path d="M65 215H125V280Q95 291 65 280Z" fill="#d7edef" stroke="#739ba9" strokeWidth="2"/>
          <path className={styles.flowDrops} d="M95 197v12m0 10v9" stroke="#43a2aa" strokeWidth="3" strokeLinecap="round"/>
          <text x="95" y="309" textAnchor="middle" fontSize="12" fill="var(--ink-muted)">Thu vào {last?.to}</text>
        </g>}
        {operation==='filter' && <g>
          <path d="M45 175H145L105 215V235H85V215Z" fill="#f5f7fa" stroke="#7698a6" strokeWidth="2"/>
          <path d="M58 184H132L111 197H79Z" fill="#ddd8c9"/>
          <path d="M65 250H125V280H65Z" fill="#d5ebed" stroke="#7698a6" strokeWidth="2"/>
          <path className={styles.flowDrops} d="M95 238v8" stroke="#43a2aa" strokeWidth="3" strokeLinecap="round"/>
          <text x="95" y="309" textAnchor="middle" fontSize="12" fill="var(--ink-muted)">Bộ lọc hút</text>
        </g>}
        {(operation==='evaporate'||operation==='dry') && <g>
          <path d="M75 205V228A30 30 0 1 0 115 228V205Z" fill="#e5eff2" stroke="#7698a6" strokeWidth="2"/>
          <path d="M55 265H135V283H55Z" fill="#c5dcdf" stroke="#7698a6"/>
          <path className={styles.vapour} d="M84 200q-7-9 0-18t0-18m20 36q7-9 0-18t0-18" fill="none" stroke="#9bbfc7" strokeWidth="2"/>
          <text x="95" y="309" textAnchor="middle" fontSize="12" fill="var(--ink-muted)">{operation==='dry'?'Làm khô mẫu':'Cô dung môi'}</text>
        </g>}
        {operation==='measure' && <g>
          <rect x="48" y="213" width="94" height="68" rx="8" fill="#e0eaee" stroke="#7698a6" strokeWidth="2"/>
          <rect x="60" y="226" width="70" height="26" rx="4" fill="#f8fcfc"/>
          <circle cx="96" cy="266" r="4" fill="#729ca5"/>
          <text x="95" y="244" textAnchor="middle" fontSize="12" fill="var(--ink)">{projection.readings.at(-1)?.value?.toLocaleString('vi-VN',{maximumFractionDigits:2})??'N/A'}</text>
          <text x="95" y="309" textAnchor="middle" fontSize="12" fill="var(--ink-muted)">{projection.readings.at(-1)?.kind==='ph'?'Máy đo pH':'Cân mẫu chuẩn'}</text>
        </g>}
        <g className={styles.ventPuff} fill="#b3cdd4"><circle cx="284" cy="48" r="5" /><circle cx="298" cy="35" r="4" /><circle cx="290" cy="22" r="3" /></g>
        {v.organicMl > 0 && <g><path d={`M368 ${top+organicHeight/2}H420`} stroke="#ad8e56" /><text x="430" y={top+organicHeight/2+4} fontSize="12" fill="var(--ink-muted)">Hữu cơ</text></g>}
        {v.waterMl > 0 && <g><path d={`M368 ${273-waterHeight/2}H420`} stroke="#4f9d9f" /><text x="430" y={273-waterHeight/2+4} fontSize="12" fill="var(--ink-muted)">Nước</text></g>}
      </svg>
      <p className={styles.visualNote}>Minh họa hai pha và chất rắn · Màu chỉ phân biệt pha, không chỉ thành phần.</p>
    </div>
    <div className={styles.readouts}><div><span>Pha nước</span><strong>{v.waterMl.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} <small>mL</small></strong></div><div><span>Pha hữu cơ</span><strong>{v.organicMl.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} <small>mL</small></strong></div><div><span>pH đã đo</span><strong>{projection.readings.filter(r => r.vesselId === selected && r.kind === 'ph').at(-1)?.value?.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) ?? 'Chưa đo'}</strong></div></div>
    <div className={styles.vesselPicker} role="group" aria-label="Chọn bình thao tác">{projection.vessels.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => onSelect(item.id)}><strong>{item.id}</strong><span>{VESSEL_NAMES[item.id]}</span><small>{(item.waterMl+item.organicMl).toLocaleString('vi-VN',{maximumFractionDigits:1})} mL{item.solidPresent ? ' · Có rắn' : ''}</small></button>)}</div>
  </div>
}
