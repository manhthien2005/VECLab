import { ActionButton } from '@/features/workbench/action-button.js'
import type { SoapVesselId } from '@/domain/experiments/soap/model.js'
import { VESSEL_NAMES } from './apparatus.js'
import { LyePanel, MixPanel, MoldPanel, OilPanel } from './controls-cups.js'
import type { PanelProps } from './controls-shared.js'
import { FAILURE_REASON } from './progress.js'
import bench from '@/features/extraction/bench.module.css'
import styles from './controls.module.css'

export function SoapControls({ selected, onSelect, onRun, ...panel }: Omit<PanelProps, 'lockReason'> & {
  selected: SoapVesselId | null
  onSelect: (id: SoapVesselId | null) => void
  lockReason: string | null
}) {
  const { projection } = panel
  const lockReason = projection.failure ? 'Thí nghiệm đã thất bại.' : panel.lockReason
  const props = { ...panel, lockReason, onRun }
  return <>
    <div className={bench.controlsHeading}>
      <h2>Thao tác</h2>
      <label className={bench.srOnly} htmlFor="soap-vessel">Cốc đang chọn</label>
      <select id="soap-vessel" className={bench.cupSelect} value={selected ?? ''} onChange={(event) => onSelect(event.target.value === '' ? null : event.target.value as SoapVesselId)}>
        <option value="">Chưa chọn</option>
        {projection.vessels.map((vessel) => <option key={vessel.id} value={vessel.id}>{vessel.id} · {VESSEL_NAMES[vessel.id]}</option>)}
      </select>
    </div>
    {projection.failure && <section className={styles.failure} role="alert">
      <h3>Thí nghiệm thất bại</h3>
      <p>{FAILURE_REASON}</p>
      <ActionButton className={bench.primary} reason={panel.lockReason} reasonClassName={bench.actionReason} onClick={() => onRun('complete')}>Hoàn thành thí nghiệm</ActionButton>
    </section>}
    {selected === null && <p className={bench.empty}>Vui lòng chọn cốc để hiện thao tác của cốc.</p>}
    {selected === 'W' && <LyePanel {...props}/>}
    {selected === 'O' && <OilPanel {...props}/>}
    {selected === 'M' && <MixPanel {...props}/>}
    {selected === 'D' && <MoldPanel projection={projection} lockReason={lockReason} onRun={onRun}/>}
  </>
}
