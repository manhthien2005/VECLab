import type { SoapProjection } from '@/application/scenarios/soap-projection.js'
import bench from '@/features/extraction/bench.module.css'
import styles from './controls.module.css'

export type SoapRun = (
  type: string,
  parameters?: Record<string, string | number | boolean>,
  units?: Record<string, string>,
) => void

export type SoapFields = Record<
  'waterMl' | 'naohG' | 'oilPourMl' | 'lyeToMixMl' | 'oilToMixMl' | 'returnMl', string
>

export const INITIAL_FIELDS: SoapFields = {
  waterMl: '', naohG: '', oilPourMl: '', lyeToMixMl: '', oilToMixMl: '', returnMl: '',
}

export type PanelProps = {
  projection: SoapProjection
  fields: SoapFields
  lockReason: string | null
  onField: (key: keyof SoapFields, value: string) => void
  onRun: SoapRun
}

const AMOUNT = /^\d+([.,]\d{1,2})?$/

export function parseAmount(text: string): number {
  return Number(text.trim().replace(',', '.'))
}

/** Why an amount cannot be sent, or null when it is a positive number with at most two decimals. */
export function amountIssue(text: string, label: string): string | null {
  if (text.trim() === '') return 'Nhập ' + label + '.'
  if (!AMOUNT.test(text.trim())) return label[0]!.toUpperCase() + label.slice(1) + ' là số, tối đa 2 chữ số thập phân.'
  return parseAmount(text) > 0 ? null : label[0]!.toUpperCase() + label.slice(1) + ' phải lớn hơn 0.'
}

export function AmountField({ id, label, unit, value, disabled = false, onChange, onFill }: {
  id: string
  label: string
  unit: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  /** Fills the field with the whole content of the source cup. */
  onFill?: (() => void) | undefined
}) {
  return <div className={bench.inputField}>
    <label htmlFor={id}>{label} ({unit})</label>
    <div className={styles.amount}>
      <input id={id} inputMode="decimal" autoComplete="off" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}/>
      {onFill && <button type="button" className={styles.fill} disabled={disabled} onClick={onFill}>Hết cốc</button>}
    </div>
  </div>
}

/** Largest two-decimal value that does not exceed the cup content. */
export function wholeCup(volumeMl: number): string {
  return String(Math.floor(volumeMl * 100) / 100)
}
