'use client'

import { useId, useRef, useState, type PointerEvent } from 'react'
import type { PlasticProjection } from '@/application/scenarios/plastic-projection.js'
import { VIRGIN_POLYMERS, PLASTIC_PROFILE, isPolymerId, type PolymerId } from '@/domain/experiments/virgin-plastic-separation/model.js'
import { plasticFractionReadout, plasticWeighingLabel } from './readouts.js'
import { plasticSceneFor, plasticTankParticles, PLASTIC_SCENE_EXPLANATIONS, type PlasticMotion, type PlasticScene } from './motion.js'
import { usePlasticSceneMotion } from './use-scene-motion.js'
import styles from './apparatus.module.css'

type Props = {
  projection: PlasticProjection
  motion: PlasticMotion | null
  onMotionEnd: (key: string) => void
  onSelectPolymer: (id: PolymerId) => void
  selectedPolymerId: PolymerId | null
}
const SCENES = [['samples', 'Mẫu'], ['tank', 'Bể phân loại'], ['weigh', 'Ly tâm & cân'], ['fractions', 'Phân đoạn']] as const
const number = (value: number) => value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
const polymer = (id: PolymerId) => VIRGIN_POLYMERS.find(value => value.id === id)!

/** Pointer hit testing supplements the 44px keyboard/touch controls below each diagram. */
function inspectParticle(event: PointerEvent<SVGSVGElement>, onInspect: (id: PolymerId) => void) {
  const value = event.target instanceof Element ? event.target.closest('[data-polymer]')?.getAttribute('data-polymer') : null
  if (isPolymerId(value)) onInspect(value)
}

function Pellet({ id }: { id: PolymerId }) {
  const p = polymer(id)
  return <g fill={p.colorHex} stroke={p.strokeHex} strokeWidth="1">
    {p.particleShape === 'sphere' ? <><circle r="4.7" /><circle cx="-1.4" cy="-1.5" r="1.1" fill="white" stroke="none" opacity=".7" /></>
      : p.particleShape === 'rectangle' ? <rect x="-5" y="-3.5" width="10" height="7" rx="1" />
      : p.particleShape === 'cylinder' ? <><rect x="-3.5" y="-5.5" width="7" height="11" rx="2.5" /><path d="M-2-3H2" stroke="white" opacity=".6" /></>
      : <><ellipse rx="5.7" ry="3.7" /><path d="M-3-1Q0-3 3-1" fill="none" stroke="white" opacity=".7" /></>}
  </g>
}

function SampleArt({ id, filled, vial = false }: { id: PolymerId; filled: boolean; vial?: boolean }) {
  const uid = useId().replaceAll(':', '')
  return <svg viewBox="0 0 160 95" aria-hidden="true" className={styles.sampleArt}>
    <defs><linearGradient id={uid} x1="0" x2="1"><stop stopColor="#d6e4eb" stopOpacity=".7" /><stop offset=".22" stopColor="#ffffff" stopOpacity=".1" /><stop offset=".8" stopColor="#f0f7f9" stopOpacity=".2" /><stop offset="1" stopColor="#b0c7d2" stopOpacity=".7" /></linearGradient></defs>
    <ellipse cx="80" cy="84" rx={vial ? 36 : 61} ry="4" fill="#dfe9ee" />
    {vial ? <><path d="M50 19V72Q50 81 60 81H100Q110 81 110 72V19" fill={'url(#' + uid + ')'} stroke="#7897a7" strokeWidth="1.5" /><ellipse cx="80" cy="19" rx="30" ry="5" fill="#eff6f8" stroke="#7897a7" /><path d="M56 29V68M101 29V39" stroke="white" strokeWidth="3" /><path d="M96 42H106M96 54H106" stroke="#a0b6c2" /></> : <><path d="M19 41L28 76Q29 81 38 81H122Q131 81 132 76L141 41Z" fill={'url(#' + uid + ')'} stroke="#8fa6b4" strokeWidth="1.5" /><ellipse cx="80" cy="41" rx="61" ry="12" fill="#f7fafb" stroke="#8fa6b4" strokeWidth="1.5" /><ellipse cx="80" cy="42" rx="51" ry="7" fill="#e9f1f5" /></>}
    {filled && Array.from({ length: 8 }, (_, i) => <g key={i} transform={`translate(${(vial ? 63 : 45) + (i % 4) * (vial ? 11 : 22)},${(vial ? 62 : 42) + Math.floor(i / 4) * 10})`}><Pellet id={id} /></g>)}
    {vial && <path d="M51 20H109" stroke="#f8fcff" strokeWidth="2" />}
  </svg>
}

function TankScene({ p, motion, onInspect }: { p: PlasticProjection; motion: PlasticMotion | null; onInspect: (id: PolymerId) => void }) {
  const uid = useId().replaceAll(':', '')
  const points = plasticTankParticles(p)
  const previous = motion ? plasticTankParticles(motion.previous) : points
  return <svg viewBox="0 0 600 385" role="img" aria-label="Bể pilot với cánh khuấy và phân đoạn nổi–chìm" className={styles.tankArt} data-testid="plastic-tank-art" onPointerUp={event => inspectParticle(event, onInspect)}>
    <title>Bể pilot phân loại nhựa · mặt cắt minh họa</title>
    <defs>
      <linearGradient id={uid + '-steel'}><stop stopColor="#91a8b6" /><stop offset=".24" stopColor="#e7f0f5" /><stop offset=".65" stopColor="#d2e1e9" /><stop offset="1" stopColor="#829dac" /></linearGradient>
      <linearGradient id={uid + '-glass'}><stop stopColor="#c6dce7" stopOpacity=".5" /><stop offset=".25" stopColor="#f8fcff" stopOpacity=".1" /><stop offset=".8" stopColor="#f8fcff" stopOpacity=".05" /><stop offset="1" stopColor="#bdd4e0" stopOpacity=".5" /></linearGradient>
      <linearGradient id={uid + '-liquid'} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#e9f7f8" stopOpacity=".8" /><stop offset="1" stopColor="#c3dfe5" stopOpacity=".8" /></linearGradient>
      <clipPath id={uid + '-inside'}><path d="M168 112V298Q168 320 300 320T432 298V112Z" /></clipPath>
    </defs>
    <ellipse cx="300" cy="356" rx="192" ry="8" fill="#dce7ed" opacity=".8" />
    <path d="M190 306L182 351M410 306L418 351" stroke={'url(#' + uid + '-steel)'} strokeWidth="9" strokeLinecap="round" />
    <path d="M155 101V297C155 336 445 336 445 297V101" fill={'url(#' + uid + '-glass)'} stroke="#819eae" strokeWidth="2" />
    <ellipse cx="300" cy="101" rx="145" ry="23" fill="#eff5f8" stroke="#819eae" strokeWidth="2" />
    <ellipse cx="300" cy="103" rx="132" ry="16" fill="#fbfdfe" stroke="#b4c9d4" />
    <g clipPath={'url(#' + uid + '-inside)'}>
      {p.wetted && <g data-liquid-fill className={styles.liquidFill}><rect x="168" y="145" width="264" height="179" fill={'url(#' + uid + '-liquid)'} /><ellipse cx="300" cy="145" rx="133" ry="13" fill="#d4eaf0" stroke="#8bb6c6" strokeWidth="1" /></g>}
      {points.map(point => {
        const from = previous.find(value => value.id === point.id && value.index === point.index)
        const start = from ?? (motion?.actionType === 'load_and_wet' ? { x: 280 + point.index * 6, y: 90 - point.index * 4 } : { x: 182 + (point.index % 8) * 32, y: 196 + Math.floor(VIRGIN_POLYMERS.findIndex(value => value.id === point.id) / 2) * 24 })
        return <g key={point.id + point.index} transform={`translate(${point.x},${point.y})`} data-polymer={point.id} data-location={point.location}>
          <g data-motion-particle data-from-x={start.x - point.x} data-from-y={start.y - point.y}><Pellet id={point.id} /></g>
        </g>
      })}
    </g>
    <path d="M300 51V284" stroke="#8299a8" strokeWidth="5" />
    <path d="M298 55V282" stroke="#e4edf2" strokeWidth="1.2" />
    {[231, 275].map(y => <g key={y} transform={'translate(300,' + y + ')'}><g data-stirrer className={styles.stirrer}><path d="M-51-5L0 0 51-5V3L0 8-51 3Z" fill={'url(#' + uid + '-steel)'} stroke="#6d8b9b" /><ellipse rx="6" ry="8" fill="#a7bac6" /></g></g>)}
    <path d="M208 74V45H392V74" fill="none" stroke="#8ba4b3" strokeWidth="5" />
    <rect x="277" y="22" width="46" height="43" rx="7" fill={'url(#' + uid + '-steel)'} stroke="#718b9b" strokeWidth="1.5" />
    <path d="M285 30H315M285 36H315M285 42H315" stroke="#819cab" /><circle cx="315" cy="55" r="3" fill="#328486" />
    <path d="M445 277H466V292H482" stroke="#9bb1be" strokeWidth="10" fill="none" strokeLinecap="round" /><path d="M458 266H476M467 261V277" stroke="#346e7a" strokeWidth="3" strokeLinecap="round" />
    <path d="M174 123V284M420 126V199" stroke="#fff" strokeWidth="4" opacity=".8" />
    <path d="M181 175H198M181 209H203M181 244H198M181 278H203" stroke="#96afbe" strokeWidth="1.5" />
    <path d="M155 297C155 336 445 336 445 297" fill="none" stroke="#819eae" strokeWidth="2" />
  </svg>
}

function Scale({ x, y, label, mass }: { x: number; y: number; label: string; mass: number | null }) {
  return <g transform={`translate(${x},${y})`}>
    <path d="M19 6H158L171 31V84H7V31Z" fill="#e6eff4" stroke="#8ba4b3" strokeWidth="1.7" />
    <rect x="22" y="33" width="133" height="32" rx="4" fill="#153c49" />
    <text x="89" y="55" textAnchor="middle" fill="#e2f2eb" fontSize="17" fontFamily="ui-monospace,monospace">{mass === null ? '—' : '≈ ' + number(mass)}</text>
    <text x="143" y="77" fill="#4c697a" fontSize="11">kg</text>
    <path d="M17 6H161" stroke="#a4b9c5" strokeWidth="6" strokeLinecap="round" />
    <path d="M60-44V-4Q60 2 90 2T120-4V-44" fill="#f3fafb" fillOpacity=".6" stroke="#8daab9" strokeWidth="1.4" />
    <ellipse cx="90" cy="-44" rx="30" ry="5" fill="#f1f8fa" stroke="#8daab9" /><path d="M66-35V-9" stroke="white" strokeWidth="3" />
    <text x="89" y="105" textAnchor="middle" fill="#496778" fontSize="13">{label}</text>
  </g>
}

function WeighScene({ p, onInspect }: { p: PlasticProjection; onInspect: (id: PolymerId) => void }) {
  const uid = useId().replaceAll(':', '')
  const fractions = Object.entries(p.weighedFractions)
  const split = fractions.length > 1
  const ids = p.weighedPolymerIds
  const scaleYs = split ? [92, 270] : [215]
  return <svg viewBox="0 0 600 410" className={styles.weighArt} role="img" aria-label="Trạm ly tâm và cân khối lượng quy đổi" onPointerUp={event => inspectParticle(event, onInspect)}>
    <title>Ly tâm tách ẩm, sau đó cân từng phân đoạn</title>
    <defs><linearGradient id={uid}><stop stopColor="#c1d1dc" /><stop offset=".35" stopColor="#f4f9fb" /><stop offset="1" stopColor="#b3c8d5" /></linearGradient></defs>
    {(split ? ids : [null]).map((id, index) => <g key={id ?? 'group'} transform={`translate(${76 + index * 60},0)`}>
      <text x="0" y="74" textAnchor="middle" fill="#496778" fontSize="12">{id ?? 'Phân đoạn'}</text>
      <path d="M-22 92V132Q-22 139 0 139T22 132V92" fill="#f0f7f9" stroke="#8daab9" strokeWidth="1.3" />
      <ellipse cy="92" rx="22" ry="4" fill="#f7fbfd" stroke="#8daab9" />
      <path d="M-16 100V128" stroke="white" strokeWidth="2.5" />
    </g>)}
    <path d="M30 357H570" stroke="#d3e1e8" strokeWidth="2" />
    <ellipse cx="155" cy="315" rx="120" ry="7" fill="#e0eaf0" />
    <rect x="49" y="163" width="214" height="145" rx="19" fill={'url(#' + uid + ')'} stroke="#88a1b1" strokeWidth="2" />
    <path d="M59 208H252M59 273H252" stroke="#c9d9e3" />
    <ellipse cx="155" cy="166" rx="106" ry="43" fill="#e2ecf2" stroke="#819cab" strokeWidth="2" />
    <ellipse cx="155" cy="166" rx="88" ry="31" fill="#f8fcfe" stroke="#a5bdcb" />
    <g transform="translate(155,166)"><g data-rotor className={styles.rotor}>
      <circle r="29" fill="#b7cbd7" stroke="#7c98a9" />
      {[0, 60, 120, 180, 240, 300].map(angle => <g key={angle} transform={`rotate(${angle})`}><rect x="-8" y="-26" width="16" height="21" rx="6" fill="#718c9d" stroke="#f2f8fa" strokeWidth="2" /></g>)}
      <circle r="7" fill="#eaf2f7" stroke="#819cab" />
    </g></g>
    <rect x="106" y="241" width="98" height="27" rx="5" fill="#254b5c" /><text x="155" y="260" textAnchor="middle" fill="#d9eee7" fontSize="14">2.950 rpm</text>
    <circle cx="225" cy="254" r="7" fill="#387f83" />
    <text x="155" y="340" textAnchor="middle" fill="#496778" fontSize="13">Rotor · mặt cắt minh họa</text>
    {split ? fractions.map(([id, value], index) => <Scale key={id} x={351} y={scaleYs[index]!} label={id + ' · cân riêng'} mass={value?.massKg ?? null} />) : <Scale x={351} y={scaleYs[0]!} label={p.weighedLabelVi ? p.weighedPolymerIds.join(' + ') : 'Chưa ghi nhận cân'} mass={p.weighedMassKg} />}
    {ids.flatMap((id, groupIndex) => Array.from({ length: 8 }, (_, index) => {
      const x = 423 + (index % 4) * 10
      const y = scaleYs[split ? groupIndex : 0]! - 25 + Math.floor(index / 4) * 9
      return <g key={id + index} transform={`translate(${x},${y})`} data-polymer={id} data-location="weighed">
        <g data-motion-particle data-from-x={64 + (split ? groupIndex * 60 : 0) + (index % 4) * 8 - x} data-from-y={110 + Math.floor(index / 4) * 8 - y} data-via-x={147 + (index % 4) * 5 - x} data-via-y={162 + Math.floor(index / 4) * 7 - y}><Pellet id={id} /></g>
      </g>
    }))}
  </svg>
}

export function PlasticSeparationApparatus({ projection: p, motion, onMotionEnd, onSelectPolymer, selectedPolymerId }: Props) {
  const root = useRef<HTMLElement>(null)
  const infoId = useId()
  const [selection, setSelection] = useState<{ revision: number; scene: PlasticScene } | null>(null)
  const scene = selection?.revision === p.revision ? selection.scene : plasticSceneFor(p, motion?.actionType)
  const currentMotion = motion?.playing ? motion : null
  usePlasticSceneMotion(root, currentMotion, scene, onMotionEnd)
  const inspect = (id: PolymerId) => {
    onSelectPolymer(id)
    requestAnimationFrame(() => root.current?.querySelector('[data-inspection]')?.scrollIntoView({ block: 'nearest', behavior: 'instant' }))
  }
  const selectScene = (value: PlasticScene) => { if (motion?.playing) onMotionEnd(motion.key); setSelection({ revision: p.revision, scene: value }) }
  const selected = selectedPolymerId ? polymer(selectedPolymerId) : null
  const readout = selected ? plasticFractionReadout(p, selected.id, PLASTIC_PROFILE.sampleFeedMassKg) : null
  const cards = scene === 'samples' || scene === 'fractions'
  const explanation = motion ? PLASTIC_SCENE_EXPLANATIONS[motion.actionType] : p.samplesPrepared ? 'Chọn mẫu để xem thông số. Các cảnh thể hiện trạng thái đã ghi nhận của lượt thực hành.' : 'Chuẩn bị sáu mẫu trong bảng Thao tác. Bạn có thể xem trước dụng cụ của bài.'
  return <section ref={root} className={styles.apparatus} data-testid="plastic-apparatus" data-scene={scene} data-motion-state={currentMotion ? 'playing' : 'idle'} data-cue-key={currentMotion?.key ?? ''} data-revision={p.revision} aria-label="Bàn thực hành phân loại nhựa" onKeyDown={event => { if (event.key === 'Escape' && selectedPolymerId) onSelectPolymer(selectedPolymerId) }}>
    <nav className={styles.sceneNav} aria-label="Quan sát dụng cụ">{SCENES.map(([id, label]) => <button key={id} type="button" aria-pressed={scene === id} onClick={() => selectScene(id)}>{label}</button>)}</nav>
    <div className={styles.sceneHeading}><div><h3>{scene === 'samples' ? 'Khay mẫu nguyên sinh' : scene === 'tank' ? 'Bể pilot · phân loại nổi–chìm' : scene === 'weigh' ? 'Ly tâm tách ẩm và cân phân đoạn' : 'Các phân đoạn thu hồi'}</h3><p>{scene === 'tank' ? '800 L · Mặt cắt minh họa' : scene === 'weigh' ? '2.950 rpm · Khối lượng quy đổi' : scene === 'samples' ? 'PP · HDPE · PS · ABS · PA · PC' : 'Chỉ hiện số liệu sau bước ly tâm và cân đã ghi nhận'}</p></div><div className={styles.motionTools}>{currentMotion ? <button className={styles.skip} type="button" onClick={() => onMotionEnd(currentMotion.key)}>Xem trạng thái cuối</button> : <span className={styles.settled}>Trạng thái đã lưu</span>}</div></div>
    {cards ? <div className={styles.sampleGrid}>{VIRGIN_POLYMERS.map(polymer => {
      const fraction = plasticFractionReadout(p, polymer.id, PLASTIC_PROFILE.sampleFeedMassKg)
      return <button key={polymer.id} type="button" className={styles.sampleCard} data-scene-reveal aria-pressed={selectedPolymerId === polymer.id} aria-label={'Xem mẫu ' + polymer.id} aria-expanded={selectedPolymerId === polymer.id} aria-controls={selectedPolymerId === polymer.id ? infoId : undefined} onClick={() => inspect(polymer.id)}>
        <SampleArt id={polymer.id} filled={scene === 'samples' ? p.samplesPrepared : fraction !== null} vial={scene === 'fractions'} />
        <strong>{polymer.id}</strong><span>{scene === 'samples' ? polymer.nominalDensity : fraction?.massKg != null ? '≈ ' + number(fraction.massKg) + ' kg' : 'Chưa ghi nhận'}</span>
      </button>
    })}</div> : scene === 'tank' ? <TankScene p={p} motion={currentMotion} onInspect={inspect} /> : <WeighScene p={p} onInspect={inspect} />}
    {scene === 'weigh' && <p className={styles.weighing} aria-label="Số cân đã ghi nhận">{plasticWeighingLabel(p)}</p>}
    <p className={styles.explanation} role="status" data-scene-reveal>{explanation}</p>
    {!cards && <div className={styles.legend} aria-label="Chọn mẫu để xem thông tin">{VIRGIN_POLYMERS.map(polymer => <button key={polymer.id} type="button" aria-pressed={selectedPolymerId === polymer.id} aria-expanded={selectedPolymerId === polymer.id} aria-controls={selectedPolymerId === polymer.id ? infoId : undefined} onClick={() => inspect(polymer.id)} aria-label={'Thông tin mẫu ' + polymer.id}><i style={{ backgroundColor: polymer.colorHex }} aria-hidden="true" />{polymer.id}</button>)}</div>}
    {selected && <div id={infoId} data-inspection className={styles.inspection} role="region" aria-label={'Thông tin mẫu ' + selected.id}><div><strong>{selected.id} · {selected.name}</strong><button type="button" aria-label="Đóng thông tin mẫu" onClick={() => onSelectPolymer(selected.id)}>Đóng</button></div><dl><div><dt>Khối lượng riêng</dt><dd>{selected.nominalDensity}</dd></div><div><dt>Hình thái</dt><dd>{selected.formVi}</dd></div><div><dt>Phân đoạn đã ghi nhận</dt><dd>{readout ? readout.fraction.mediumUsed + ' · ' + (readout.fraction.behavior === 'floating' ? 'nổi' : 'chìm') : 'Chưa ghi nhận'}</dd></div><div><dt>Khối lượng quy đổi</dt><dd>{readout?.massKg == null ? 'Chưa ghi nhận' : '≈ ' + number(readout.massKg) + ' kg'}</dd></div></dl></div>}
    <p className={styles.note}>Màu hạt dùng để nhận diện mẫu; chất lỏng và số hạt chỉ minh họa. Chuyển động không biểu thị thời gian hay tốc độ phân tách thực.</p>
  </section>
}
