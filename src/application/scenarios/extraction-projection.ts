import type { ResourceLedger, UUID } from '@/domain/process/contracts.js'
import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import { COMPONENTS, VESSEL_IDS, EXTRACTION_PROFILE, equilibrate, type Component, type ExtractionState, type VesselId } from '@/domain/experiments/acid-base-extraction/model.js'
import { extractionGoal } from '@/domain/experiments/acid-base-extraction/engine.js'
export const EXTRACTION_PROJECTION_VERSION = 1
export const EXTRACTION_REPORT_SCHEMA_VERSION = 1
export function projectExtraction(state: ExtractionState) {
  return {
    scenarioKey: 'acid-base-extraction' as const, scenarioReleaseId: EXTRACTION_PROFILE.releaseId, projectionVersion: 1,
    phase: state.phase,
    vessels: VESSEL_IDS.map(id => {
      const v = state.vessels[id], eq = equilibrate(v)
      return { id, waterMl: v.waterMl, organicMl: v.organicMl, separated: v.separated, vented: v.vented, dry: v.dry, solidPresent: COMPONENTS.some(key => eq.solid[key] > 1e-8) }
    }),
    readings: state.readings.map(r => ({ ...r })), submissions: structuredClone(state.submissions),
    history: state.history.map(h => ({ sequence: h.sequence, actionType: h.actionType, from: h.from, to: h.to })),
  }
}
export type ExtractionProjection = ReturnType<typeof projectExtraction>
export type ExtractionReportSnapshot = {
  schemaVersion: number; scenarioKey: 'acid-base-extraction'; releaseId: string; generatedAt: Date;
  versions: { profileVersion: string; modelSpecVersion: string }; projection: ExtractionProjection;
  products: { component: Component; vesselId: VesselId | null; measuredMassMg: number | null; recoveredMg: number | null; recovery: number | null; purity: number | null; answer: number | null; expectedAnswer: number | null; answerError: number | null; dry: boolean; currentMeasurement: boolean }[];
  distribution: { vesselId: VesselId; amountsMg: Record<Component, number> }[];
  goalStatus: ReturnType<typeof extractionGoal>; resources: ResourceLedger;
  diagnostics: { message: string; actionIds: UUID[] }[];
}
export function buildExtractionReport(state: ExtractionState, ledger: ResourceLedger, events: readonly StoredAttemptEventRecord<ExtractionState>[], generatedAt: Date): ExtractionReportSnapshot {
  if (state.phase !== 'completed') throw new Error('Completion required')
  const products = COMPONENTS.map(component => {
    const submission = state.submissions[component], v = submission ? state.vessels[submission.vesselId] : null
    const reading = submission ? state.readings.filter(r => r.vesselId === submission.vesselId && r.kind === 'mass' && r.valid).at(-1) : null
    const lastChange = v ? state.history.filter(h => h.from === v.id || h.to === v.id).at(-1)?.sequence ?? 0 : 0
    const total = v ? COMPONENTS.reduce((sum, id) => sum + v.moles[id], 0) : 0
    const recovery = v ? v.moles[component] / .001 * 100 : null
    const expectedAnswer = reading?.value ?? null // Initial mass is 100 mg: mass / 100 × 100.
    return { component, vesselId: v?.id ?? null, measuredMassMg: reading?.value ?? null, recoveredMg: v ? v.moles[component] * 100_000 : null, recovery, purity: total > 1e-15 && v ? v.moles[component] / total * 100 : null, answer: submission?.answer ?? null, expectedAnswer, answerError: submission && expectedAnswer !== null ? Math.abs(submission.answer - expectedAnswer) : null, dry: v?.dry ?? false, currentMeasurement: !!reading && reading.sequence > lastChange }
  })
  const diagnostics: ExtractionReportSnapshot['diagnostics'] = []
  for (const product of products) {
    if (!product.vesselId) diagnostics.push({ message: `Chưa khai báo bình sản phẩm ${product.component}.`, actionIds: [] })
    else {
      if (!product.currentMeasurement) diagnostics.push({ message: `Sản phẩm ${product.component}: chưa có phép cân sau thao tác cuối.`, actionIds: [] })
      if (product.answerError !== null && product.answerError > 1) diagnostics.push({ message: `Sản phẩm ${product.component}: đáp số lệch ${product.answerError.toFixed(2)} điểm % so với phép cân đã lưu.`, actionIds: events.filter(e => e.actionType === 'record_product' && (e.inputPayload as { parameters?: { component?: unknown } })?.parameters?.component === product.component).map(e => e.actionId) })
      if (!product.dry) diagnostics.push({ message: `Sản phẩm ${product.component}: chưa làm khô; khối lượng cân có thể gồm dung môi.`, actionIds: [] })
      if (product.purity !== null && product.purity < 90) diagnostics.push({ message: `Bình ${product.vesselId} còn lẫn cấu tử khác; xem cân bằng lượng chất để xác định phần bị gộp.`, actionIds: events.filter(e => state.history.some(h => h.sequence === e.sequence && h.to === product.vesselId)).map(e => e.actionId) })
    }
  }
  const wasteEvents = state.history.filter(h => h.to === 'W' && COMPONENTS.some(id => h.moved[id] > 1e-10))
  if (wasteEvents.length && COMPONENTS.some(id => state.vessels.W.moles[id] > 1e-10)) diagnostics.push({ message: 'Có cấu tử mục tiêu đã được chuyển vào bình thải W.', actionIds: events.filter(e => wasteEvents.some(h => h.sequence === e.sequence)).map(e => e.actionId) })
  return { schemaVersion: 1, scenarioKey: 'acid-base-extraction', releaseId: EXTRACTION_PROFILE.releaseId, generatedAt, versions: { profileVersion: '1', modelSpecVersion: EXTRACTION_PROFILE.modelSpecVersion }, projection: projectExtraction(state), products, distribution: VESSEL_IDS.map(id => ({ vesselId: id, amountsMg: Object.fromEntries(COMPONENTS.map(key => [key, state.vessels[id].moles[key] * 100_000])) as Record<Component, number> })), goalStatus: extractionGoal(state), resources: structuredClone(ledger), diagnostics }
}
