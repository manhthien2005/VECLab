import { useState } from 'react'
import type { SoapProjection, SoapVesselView } from '@/application/scenarios/soap-projection.js'
import { SOAP_PROFILE, type SoapMoldStage, type SoapVesselId } from '@/domain/experiments/soap/model.js'
import { SoapFormulas, SoapRequirements } from './guidance.js'
import { SoapMoldArt } from './mold-art.js'
import { PourScene, type SoapCue } from './pour-scene.js'
import { FAILURE_REASON, currentStepIndex, soapProgress, soapSteps } from './progress.js'
import { SoapVesselArt } from './vessel-art.js'
import styles from './apparatus.module.css'

export const VESSEL_NAMES: Record<SoapVesselId, string> = {
  W: 'Cốc kiềm', O: 'Cốc dầu', M: 'Cốc trộn', D: 'Khuôn',
}

const PHASE: Record<SoapProjection['phase'], string> = {
  working: 'Đang thực hiện', hazard: 'Thất bại', completed: 'Đã hoàn thành',
}

const MOLD_TEXT: Record<SoapMoldStage, string> = {
  empty: 'Trống', poured: 'Hỗn hợp trong khuôn', gelled: 'Đã đông ' + SOAP_PROFILE.gelHours + ' giờ',
  unmolded: 'Đã tháo khuôn', cured: 'Đã ủ ' + SOAP_PROFILE.cureWeeks + ' tuần',
}

function contents(vessel: SoapVesselView, projection: SoapProjection): string {
  if (vessel.id === 'D') return MOLD_TEXT[projection.moldStage]
  if (vessel.broken) return 'Cốc đã vỡ'
  if (vessel.id === 'M' && projection.mix.traced) return 'Hỗn hợp đã đặc lại'
  if (vessel.id === 'M' && projection.mix.stirred) return 'Hỗn hợp xà phòng'
  if (vessel.hasOil && vessel.hasLye) return 'Dầu trên kiềm · chưa trộn đều'
  if (vessel.hasLye) return 'Dung dịch kiềm'
  if (vessel.hasOil) return 'Dầu'
  if (vessel.hasWater) return 'Nước cất'
  if (vessel.hasSolidNaoh) return 'NaOH rắn'
  return 'Trống'
}

function artKind(cue: SoapCue | null, selected: SoapVesselId): string {
  if (cue?.kind === 'pour') return 'pour'
  return selected === 'D' ? 'mold' : 'cup'
}

export function SoapApparatus({ projection, selected, onSelect, cue }: {
  projection: SoapProjection
  selected: SoapVesselId | null
  onSelect: (id: SoapVesselId | null) => void
  cue: SoapCue | null
}) {
  const steps = soapSteps(projection, projection.phase === 'completed')
  const current = currentStepIndex(projection, steps)
  const [browse, setBrowse] = useState<{ from: number; page: number } | null>(null)
  const page = browse?.from === current ? browse.page : current
  const step = steps[page]!
  const progress = soapProgress(projection)
  const vessel = projection.vessels.find((item) => item.id === selected)
  const turn = (delta: number) => setBrowse({ from: current, page: Math.min(steps.length - 1, Math.max(0, page + delta)) })
  return <section className={styles.stage} aria-label="Khu vực thực hành xà phòng">
    <div className={styles.stageHeading}>
      <div>
        <h2>Khu vực thực hành</h2>
        <p><strong>{vessel ? vessel.id + ' · ' + VESSEL_NAMES[vessel.id] : 'Chưa chọn cốc'}</strong></p>
      </div>
      <span className={styles.phaseTag} data-active={projection.phase === 'working' ? 'true' : 'false'}>{PHASE[projection.phase]}</span>
    </div>
    {projection.failure
      ? <div className={styles.failure} role="alert"><strong>Thí nghiệm thất bại</strong><p>{FAILURE_REASON}</p></div>
      : <section className={styles.steps} aria-label="Các bước thí nghiệm">
        <button type="button" className={styles.stepNav} aria-label="Bước trước" disabled={page === 0} onClick={() => turn(-1)}>‹</button>
        <div className={styles.stepBody}>
          <span>Bước {page + 1} / {steps.length}{page === current ? ' · đang làm' : step.done ? ' · đã xong' : ''}</span>
          <strong>{step.title}</strong>
          <p>{step.summary}</p>
          <ul>{step.tasks.map((task) => <li key={task.label} data-done={task.done ? 'true' : 'false'}>
            <span>{task.label}</span><small>{task.hint}</small>
          </li>)}</ul>
          {page === current && <p className={styles.stepNow}>Việc tiếp theo: <strong>{progress.now}</strong></p>}
          {step.cup && selected !== step.cup && <button type="button" className={styles.stepPick} onClick={() => onSelect(step.cup)}>
            Chọn {VESSEL_NAMES[step.cup].toLowerCase()}
          </button>}
        </div>
        <button type="button" className={styles.stepNav} aria-label="Bước sau" disabled={page === steps.length - 1} onClick={() => turn(1)}>›</button>
      </section>}
    <div className={styles.scene} data-empty={vessel ? 'false' : 'true'}>
      {vessel && selected
        ? <>
          <SoapFormulas id={selected}/>
          <div className={styles.sceneArt} data-kind={artKind(cue, selected)}>
            {cue?.kind === 'pour' && <PourScene key={cue.seq} cue={cue}/>}
            <div className={styles.cupArt + (vessel.hasLye && vessel.temperatureC > SOAP_PROFILE.lyePourWarnC ? ' ' + styles.hot : '')}>
              {selected === 'D'
                ? <SoapMoldArt stage={projection.moldStage} cue={cue?.kind === 'unmold'}/>
                : <SoapVesselArt vessel={vessel} mix={selected === 'M' ? projection.mix : null}
                  cue={selected === 'M' && cue?.kind === 'stir' ? cue.mode : null}/>}
            </div>
          </div>
          <SoapRequirements id={selected} projection={projection}/>
        </>
        : <p className={styles.pickNotice}>Vui lòng chọn cốc để hiện hướng dẫn của cốc</p>}
    </div>
    {vessel && <div className={styles.sceneState}>
      <span>{contents(vessel, projection)} · {Math.round(vessel.temperatureC)} °C</span>
      <small>Màu và mực chất lỏng minh họa trạng thái đã lưu. pH và khối lượng chỉ có sau khi đo.</small>
    </div>}
    <div className={styles.vesselPicker} role="group" aria-label="Chọn cốc thao tác">
      {projection.vessels.map((item) => (
        <button key={item.id} type="button" className={styles.vesselCard} aria-pressed={selected === item.id}
          aria-label={item.id + ' · ' + VESSEL_NAMES[item.id]} onClick={() => onSelect(selected === item.id ? null : item.id)}>
          {item.id === 'D' ? <SoapMoldArt stage={projection.moldStage} compact/> : <SoapVesselArt vessel={item} mix={item.id === 'M' ? projection.mix : null} compact/>}
          <span className={styles.vesselTitle}><strong>{item.id}</strong><span>{VESSEL_NAMES[item.id]}</span></span>
          <small>{contents(item, projection)}</small>
        </button>
      ))}
    </div>
  </section>
}
