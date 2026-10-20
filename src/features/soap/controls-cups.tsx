import { ActionButton } from '@/features/workbench/action-button.js'
import type { SoapProjection } from '@/application/scenarios/soap-projection.js'
import { SOAP_OILS, SOAP_PROFILE, isSoapOil, type SoapVesselId } from '@/domain/experiments/soap/model.js'
import { AmountField, amountIssue, parseAmount, wholeCup, type PanelProps } from './controls-shared.js'
import { OIL_LABEL, formatNumber } from './guidance.js'
import { OIL_NOTES } from './oil-notes.js'
import bench from '@/features/extraction/bench.module.css'
import styles from './controls.module.css'

function vesselOf(projection: SoapProjection, id: SoapVesselId) {
  return projection.vessels.find((item) => item.id === id)!
}

export function LyePanel({ projection, fields, lockReason, onField, onRun }: PanelProps) {
  const lye = vesselOf(projection, 'W')
  const water = amountIssue(fields.waterMl, 'thể tích nước')
  const naoh = amountIssue(fields.naohG, 'khối lượng NaOH')
  const pour = amountIssue(fields.lyeToMixMl, 'thể tích dung dịch')
  return <div className={styles.panel}>
    <div className={styles.row}>
      <AmountField id="soap-water" label="Nước" unit="mL" value={fields.waterMl} onChange={(value) => onField('waterMl', value)}/>
      <ActionButton className={bench.button} reason={lockReason ?? water} reasonClassName={bench.actionReason}
        onClick={() => onRun('pour_water', { waterVolumeL: parseAmount(fields.waterMl) }, { waterVolumeL: 'mL' })}>Rót nước</ActionButton>
    </div>
    <div className={styles.row}>
      <AmountField id="soap-naoh" label="NaOH" unit="g" value={fields.naohG} onChange={(value) => onField('naohG', value)}/>
      <ActionButton className={bench.button} reason={lockReason ?? naoh} reasonClassName={bench.actionReason}
        onClick={() => onRun('pour_naoh', { naohMassG: parseAmount(fields.naohG) }, { naohMassG: 'g' })}>Rót kiềm (NaOH)</ActionButton>
    </div>
    <div className={styles.row}>
      <ActionButton className={bench.button} reason={lockReason} reasonClassName={bench.actionReason} onClick={() => onRun('cool_lye')}>Nguội kiềm</ActionButton>
    </div>
    <div className={styles.row}>
      <AmountField id="soap-lye-pour" label="Dung dịch đổ sang cốc trộn" unit="mL" value={fields.lyeToMixMl}
        onChange={(value) => onField('lyeToMixMl', value)} onFill={() => onField('lyeToMixMl', wholeCup(lye.volumeMl))}/>
      <ActionButton className={bench.primary} reason={lockReason ?? pour} reasonClassName={bench.actionReason}
        onClick={() => onRun('pour_to_mix', { from: 'W', volumeL: parseAmount(fields.lyeToMixMl) }, { volumeL: 'mL' })}>Đổ dung dịch</ActionButton>
    </div>
    <ActionButton className={bench.button + ' ' + styles.danger} reason={lockReason} reasonClassName={bench.actionReason} onClick={() => onRun('reset_lye')}>Làm lại</ActionButton>
  </div>
}

export function OilPanel({ projection, fields, lockReason, onField, onRun }: PanelProps) {
  const oilType = projection.oilType
  const limits = SOAP_PROFILE.oils[oilType]
  const pour = amountIssue(fields.oilPourMl, 'thể tích dầu')
  const oil = vesselOf(projection, 'O')
  const grams = pour === null ? parseAmount(fields.oilPourMl) * limits.densityGPerMl : null
  const typeLocked = projection.oilInCup
  const typeReason = typeLocked ? 'Trong cốc còn dầu. Loại bỏ dầu hoặc đổ bỏ hỗn hợp trước khi đổi loại.' : null
  return <div className={styles.panel}>
    <div className={styles.row}>
      <div className={bench.inputField}><label htmlFor="soap-oil">Loại dầu</label>
        <select id="soap-oil" value={oilType} disabled={typeLocked || Boolean(lockReason)}
          onChange={(event) => {
            const next = event.target.value
            if (isSoapOil(next) && next !== oilType) {
              onRun('set_oil', { oilType: next })
            }
          }}>
          {SOAP_OILS.map((key) => <option key={key} value={key}>{OIL_LABEL[key]}</option>)}
        </select></div>
      <p className={styles.note}>{OIL_NOTES[oilType]}{typeReason ? ' ' + typeReason : ''}</p>
    </div>
    <div className={styles.row}>
      <div className={styles.pourLine}>
        <AmountField id="soap-oil-pour" label="Dầu" unit="mL" value={fields.oilPourMl} onChange={(value) => onField('oilPourMl', value)}/>
        <ActionButton className={bench.primary} reason={lockReason ?? pour} reasonClassName={bench.actionReason}
          onClick={() => onRun('pour_oil', { oilVolumeL: parseAmount(fields.oilPourMl) }, { oilVolumeL: 'mL' })}>Rót dầu</ActionButton>
        <div className={styles.conversion} aria-live="polite">
          <strong>{grams === null ? 'N/A' : formatNumber(grams, 2) + ' g'}</strong>
          <small>ρ = {formatNumber(limits.densityGPerMl, 2)} g/mL</small>
        </div>
      </div>
    </div>
    {oil.hasOil && <ActionButton className={bench.button + ' ' + styles.danger} reason={lockReason} reasonClassName={bench.actionReason}
      onClick={() => onRun('discard_oil')}>Loại bỏ dầu cũ</ActionButton>}
  </div>
}

export function MixPanel({ projection, fields, lockReason, onField, onRun }: PanelProps) {
  const lye = vesselOf(projection, 'W')
  const oil = vesselOf(projection, 'O')
  const mixing = vesselOf(projection, 'M')
  const { mix } = projection
  const lyeIssue = amountIssue(fields.lyeToMixMl, 'thể tích dung dịch kiềm')
  const oilIssue = amountIssue(fields.oilToMixMl, 'thể tích dầu')
  const returnIssue = amountIssue(fields.returnMl, 'thể tích đổ lại')
  const returnTo = mixing.hasOil ? 'O' : 'W'
  const thickReason = lockReason ?? (mix.traced ? 'Dung dịch đã đặc lại.' : !mix.stirred ? 'Khuấy hỗn hợp trước. Chỉ khuấy được khi cốc trộn có cả kiềm và dầu.' : null)
  return <div className={styles.panel}>
    <div className={styles.row}>
      <AmountField id="soap-mix-lye" label="Kiềm" unit="mL" value={fields.lyeToMixMl} onChange={(value) => onField('lyeToMixMl', value)}
        onFill={() => onField('lyeToMixMl', wholeCup(lye.volumeMl))}/>
      <ActionButton className={bench.button} reason={lockReason ?? lyeIssue} reasonClassName={bench.actionReason}
        onClick={() => onRun('pour_to_mix', { from: 'W', volumeL: parseAmount(fields.lyeToMixMl) }, { volumeL: 'mL' })}>Rót kiềm</ActionButton>
    </div>
    <div className={styles.row}>
      <AmountField id="soap-mix-oil" label="Dầu" unit="mL" value={fields.oilToMixMl} onChange={(value) => onField('oilToMixMl', value)}
        onFill={() => onField('oilToMixMl', wholeCup(oil.volumeMl))}/>
      <ActionButton className={bench.button} reason={lockReason ?? oilIssue} reasonClassName={bench.actionReason}
        onClick={() => onRun('pour_to_mix', { from: 'O', volumeL: parseAmount(fields.oilToMixMl) }, { volumeL: 'mL' })}>Rót dầu</ActionButton>
    </div>
    {mix.hasBoth
      ? <ActionButton className={bench.button + ' ' + styles.danger} reason={lockReason} reasonClassName={bench.actionReason}
        onClick={() => onRun('discard_mix')}>{mix.stirred ? 'Làm lại hỗn hợp' : 'Đổ bỏ dung dịch'}</ActionButton>
      : <div className={styles.row}>
        <AmountField id="soap-mix-return" label="Dung dịch đổ lại" unit="mL" value={fields.returnMl} onChange={(value) => onField('returnMl', value)}
          onFill={() => onField('returnMl', wholeCup(mixing.volumeMl))}/>
        <ActionButton className={bench.button} reason={lockReason ?? returnIssue} reasonClassName={bench.actionReason}
          onClick={() => onRun('return_to_source', { to: returnTo, volumeL: parseAmount(fields.returnMl) }, { volumeL: 'mL' })}>Đổ lại dung dịch về cốc ban đầu</ActionButton>
      </div>}
    <div className={styles.row}>
      <div className={bench.actionRow}>
        <ActionButton className={bench.button} reason={lockReason} reasonClassName={bench.actionReason} onClick={() => onRun('stir', { mode: 'machine' })}>Khuấy máy</ActionButton>
        <ActionButton className={bench.button} reason={lockReason} reasonClassName={bench.actionReason} onClick={() => onRun('stir', { mode: 'hand' })}>Khuấy tay</ActionButton>
      </div>
      <ActionButton className={bench.primary} reason={thickReason} reasonClassName={bench.actionReason} onClick={() => onRun('advance_trace')}>Chờ dung dịch đặc lại</ActionButton>
    </div>
  </div>
}

const MOLD_STEPS = {
  empty: { action: 'pour_to_mold', label: 'Đổ khuôn' },
  poured: { action: 'advance_gel', label: 'Chờ ' + SOAP_PROFILE.gelHours + ' giờ' },
  gelled: { action: 'unmold', label: 'Tháo khuôn' },
  unmolded: { action: 'advance_cure', label: 'Đợi ' + SOAP_PROFILE.cureWeeks + ' tuần' },
  cured: { action: 'measure_sample', label: 'Đo pH và cân' },
} as const

export function MoldPanel({ projection, lockReason, onRun }: Pick<PanelProps, 'projection' | 'lockReason' | 'onRun'>) {
  const step = MOLD_STEPS[projection.moldStage]
  const full = projection.moldStage === 'empty' && projection.samples.length >= SOAP_PROFILE.maxSamples
  const sampled = projection.canComplete && projection.moldStage === 'empty'
  return <div className={styles.panel}>
    <p className={styles.samples}><span>Mẫu thử đã lưu</span><strong>{projection.samples.length} / {SOAP_PROFILE.maxSamples}</strong></p>
    <div className={styles.row}>
      <ActionButton className={bench.primary} reason={lockReason ?? (full ? 'Đã đủ ' + SOAP_PROFILE.maxSamples + ' mẫu. Hoàn thành thí nghiệm để chấm điểm.' : null)}
        reasonClassName={bench.actionReason} onClick={() => onRun(step.action)}>{step.label}</ActionButton>
    </div>
    {sampled && <div className={styles.row}>
      <p>Có thể làm thêm mẫu hoặc hoàn thành để chấm điểm.</p>
      <ActionButton className={bench.button} reason={lockReason} reasonClassName={bench.actionReason} onClick={() => onRun('complete')}>Hoàn thành thí nghiệm</ActionButton>
    </div>}
  </div>
}
