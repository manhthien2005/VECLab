/** Frozen 0.1.0 behavior for existing attempts; new workflow rules live in engine.ts. */
import type { DomainError, DomainModule, GoalStatus, ResourceDelta, SimulationAction } from '@/domain/process/contracts.js'
import { invalidInput, preconditionFailed } from '@/shared/errors/domain-errors.js'
import { COMPONENTS, VESSEL_IDS, LEGACY_EXTRACTION_PROFILE as EXTRACTION_PROFILE, createInitialExtractionState, equilibrate, inventories, teachingMassMg, zeroAmounts, type Amounts, type Component, type ExtractionState, type VesselId } from './model.js'
const KEYS: Record<string, string[]> = { add_reagent: ['vesselId','reagent','volumeL'], mix: ['vesselId'], vent: ['vesselId'], settle: ['vesselId'], transfer: ['from','to','phase','volumeL'], filter: ['from','to'], evaporate: ['vesselId'], dry: ['vesselId'], measure: ['vesselId','kind'], record_product: ['component','vesselId','answer'], complete: [] }
const error = (code: string) => preconditionFailed(code, 'errors.extraction.' + code)
function validate(state: ExtractionState, action: SimulationAction): DomainError | null {
  if (!Object.hasOwn(KEYS, action.actionType)) return invalidInput('UNKNOWN_ACTION_TYPE', 'errors.unknownAction')
  if (state.phase === 'completed') return error('COMPLETED')
  const p = action.parameters, keys = KEYS[action.actionType]!
  if (Object.keys(p).length !== keys.length || keys.some(key => !Object.hasOwn(p, key))) return error('INVALID_PARAMETERS')
  for (const key of ['from','to','vesselId']) if (key in p && !VESSEL_IDS.includes(p[key] as VesselId)) return error('UNKNOWN_VESSEL')
  if ('volumeL' in p && (typeof p.volumeL !== 'number' || !Number.isFinite(p.volumeL) || p.volumeL <= 0 || p.volumeL > .25)) return error('INVALID_VOLUME')
  if (p.from === p.to && 'from' in p) return error('SAME_VESSEL')
  if (action.actionType === 'add_reagent' && !['acid','base','water','solvent'].includes(String(p.reagent))) return error('UNKNOWN_REAGENT')
  if (action.actionType === 'transfer' && !['aqueous','organic','all'].includes(String(p.phase))) return error('UNKNOWN_PHASE')
  if (action.actionType === 'measure' && !['ph','mass'].includes(String(p.kind))) return error('UNKNOWN_MEASUREMENT')
  if (action.actionType === 'record_product' && (!COMPONENTS.includes(p.component as Component) || !['R1','R2','R3'].includes(String(p.vesselId)) || typeof p.answer !== 'number' || !Number.isFinite(p.answer) || p.answer < 0 || p.answer > 1000)) return error('INVALID_PRODUCT')
  return null
}
export function legacyExtractionGoal(state: ExtractionState): GoalStatus {
  const criteria = COMPONENTS.map(id => {
    const submission = state.submissions[id], vessel = submission ? state.vessels[submission.vesselId] : null
    const reading = submission ? state.readings.filter(r => r.kind === 'mass' && r.vesselId === submission.vesselId && r.valid).at(-1) : null
    const lastChange = submission ? state.history.filter(h => h.from === submission.vesselId || h.to === submission.vesselId).at(-1)?.sequence ?? 0 : 0
    const evaluable = !!submission && !!reading && reading.sequence > lastChange && !!vessel?.dry
    const recovery = vessel ? vessel.moles[id] / .001 * 100 : null
    const total = vessel ? COMPONENTS.reduce((sum, key) => sum + vessel.moles[key], 0) : 0
    const purity = vessel && total > 1e-15 ? vessel.moles[id] / total * 100 : null
    return { key: id, evaluable, met: evaluable && recovery !== null && recovery >= 80 && purity !== null && purity >= 90 && Math.abs(submission!.answer - reading!.value!) <= 1, actual: recovery, target: 80, unit: '%' }
  })
  return { evaluable: criteria.every(c => c.evaluable), goalMet: criteria.every(c => c.met), primaryCriteria: criteria, efficiencyCriteria: [], achievementPercent: criteria.filter(c => c.met).length / 3 * 100 }
}
export function createLegacyExtractionModule(): DomainModule<ExtractionState> {
  return {
    manifest: { scenarioKey: 'acid-base-extraction', releaseId: EXTRACTION_PROFILE.releaseId, modelSpecVersion: EXTRACTION_PROFILE.modelSpecVersion, scoringVersion: '1', stateSchemaVersion: '1', contentVersion: '1', evidenceRegisterVersion: '1', projectionVersion: 1 },
    createInitialState: () => createInitialExtractionState(EXTRACTION_PROFILE), actionTypes: Object.keys(KEYS), parameterQuantities: { volumeL: 'volume' },
    validateAction: (context, action) => validate(context.state, action), evaluateGoalStatus: legacyExtractionGoal,
    run(context, action) {
      const invalid = validate(context.state, action); if (invalid) return invalid
      const state = structuredClone(context.state), p = action.parameters, type = action.actionType
      const vessel = state.vessels[p.vesselId as VesselId]
      let moved = zeroAmounts(), from = String(p.from ?? p.vesselId ?? ''), to = String(p.to ?? p.vesselId ?? '')
      const delta: ResourceDelta = { reagents: {}, waterLiters: 0, operationCount: 1, relativeCostIndexDelta: null, safetyPenalties: [], secondaryWaste: {} }
      if (type === 'add_reagent') {
        const ml = Number(p.volumeL) * 1000
        if (vessel.waterMl + vessel.organicMl + ml > 250 + 1e-9) return error('CAPACITY_EXCEEDED')
        if (p.reagent === 'solvent') vessel.organicMl += ml
        else { vessel.waterMl += ml; if (p.reagent === 'acid') vessel.acidEq += ml / 10000; if (p.reagent === 'base') vessel.acidEq -= ml / 10000 }
        vessel.dry = false; vessel.separated = vessel.waterMl === 0 || vessel.organicMl === 0; vessel.vented = false
        delta.reagents[String(p.reagent)] = { amount: ml / 1000, unit: 'L' }; if (p.reagent === 'water') delta.waterLiters = ml / 1000
      } else if (type === 'mix') { vessel.separated = vessel.waterMl === 0 || vessel.organicMl === 0; vessel.vented = false }
      else if (type === 'vent') vessel.vented = true
      else if (type === 'settle') { if (!vessel.vented) return error('VENT_FIRST'); vessel.separated = true }
      else if (type === 'transfer') {
        const a = state.vessels[p.from as VesselId], b = state.vessels[p.to as VesselId], ml = Number(p.volumeL) * 1000
        if (!a.separated) return error('SEPARATE_FIRST')
        const phase = String(p.phase), available = phase === 'aqueous' ? a.waterMl : phase === 'organic' ? a.organicMl : a.waterMl + a.organicMl
        if (ml > available + 1e-8) return error('NOT_ENOUGH_LIQUID')
        if (b.waterMl + b.organicMl + ml > 250 + 1e-8) return error('CAPACITY_EXCEEDED')
        const ratio = Math.min(1, ml / available), eq = equilibrate(a)
        moved = Object.fromEntries(COMPONENTS.map(id => [id, phase === 'all' ? a.moles[id] * ratio : eq[phase as 'aqueous' | 'organic'][id] * ratio])) as Amounts
        for (const id of COMPONENTS) { a.moles[id] = Math.max(0, a.moles[id] - moved[id]); b.moles[id] += moved[id] }
        const water = phase === 'organic' ? 0 : a.waterMl * ratio, organic = phase === 'aqueous' ? 0 : a.organicMl * ratio
        const acid = phase === 'organic' ? 0 : a.acidEq * ratio
        a.waterMl -= water; a.organicMl -= organic; a.acidEq -= acid; b.waterMl += water; b.organicMl += organic; b.acidEq += acid
        b.dry = false; b.separated = b.waterMl === 0 || b.organicMl === 0; b.vented = true
      } else if (type === 'filter') {
        const a = state.vessels[p.from as VesselId], b = state.vessels[p.to as VesselId], eq = equilibrate(a)
        if (b.waterMl + b.organicMl + Math.min(.5, a.waterMl) > 250 + 1e-8) return error('CAPACITY_EXCEEDED')
        const hold = COMPONENTS.some(id => eq.solid[id] > 1e-10) ? Math.min(.5, a.waterMl) : 0, ratio = a.waterMl > 0 ? hold / a.waterMl : 0
        moved = Object.fromEntries(COMPONENTS.map(id => [id, eq.solid[id] + eq.aqueous[id] * ratio])) as Amounts
        for (const id of COMPONENTS) { a.moles[id] = Math.max(0, a.moles[id] - moved[id]); b.moles[id] += moved[id] }
        b.waterMl += hold; a.waterMl -= hold; b.acidEq += a.acidEq * ratio; a.acidEq *= 1-ratio; b.dry = false
      } else if (type === 'evaporate') {
        if (vessel.waterMl > 1e-8) return error('ORGANIC_ONLY')
        delta.secondaryWaste.recoveredSolvent = { amount: vessel.organicMl / 1000, unit: 'L' }; vessel.organicMl = 0; vessel.dry = false
      } else if (type === 'dry') {
        if (vessel.organicMl > 1e-8 || vessel.waterMl > .5 + 1e-8) return error('FILTER_OR_EVAPORATE_FIRST')
        vessel.waterMl = 0; vessel.acidEq = 0; vessel.dry = true
      } else if (type === 'measure') {
        const value = p.kind === 'mass' ? teachingMassMg(vessel) : equilibrate(vessel).ph
        state.readings.push({ sequence: context.sequence, vesselId: vessel.id, kind: p.kind as 'ph' | 'mass', value, valid: value !== null })
        from = ''; to = ''
      } else if (type === 'record_product') { state.submissions[p.component as Component] = { vesselId: p.vesselId as VesselId, answer: Number(p.answer) }; from = ''; to = '' }
      else if (type === 'complete') state.phase = 'completed'
      if (type !== 'measure' && type !== 'record_product' && type !== 'complete') state.history.push({ sequence: context.sequence, actionType: type, from, to, moved })
      const totals = inventories(state)
      if (COMPONENTS.some(id => Math.abs(totals[id] - .001) > 1e-10)) return error('MASS_BALANCE_FAILED')
      return { nextState: state, resourceDelta: delta, observations: [], calculationTrace: [], warnings: [] }
    },
  }
}


export type { ExtractionState } from './model.js'
