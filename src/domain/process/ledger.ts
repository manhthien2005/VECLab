import type { ResourceDelta, ResourceLedger } from '@/domain/process/contracts.js'

/**
 * Generic resource ledger accumulation.
 *
 * This lives in the Process Core rather than in a scenario module because it
 * contains no scenario knowledge: it adds up quantities and carries the
 * convention-versioned indices through untouched (docs/system-architecture.md
 * §6). A scenario module owns HOW an index is computed from those quantities;
 * the core only owns accumulating them.
 *
 * The split matters. If accumulation lived in the acid module, the Process Core
 * would import from one scenario, and registering a second scenario would mean
 * either importing a second ledger or moving the code then anyway.
 *
 * Indices are deliberately NOT recomputed here. `relativeCostIndex` is a ratio
 * over totals and `safetyIndex` depends on penalties that commit at completion
 * (acid spec §13.5), so computing either mid-action would be wrong. The scenario
 * recomputes both when the attempt completes.
 */

/** Ledger for a fresh attempt: neutral values, no invented zeros. */
export function createInitialResourceLedger(
  costConventionVersion: string | null = null,
  safetyConventionVersion: string | null = null,
): ResourceLedger {
  return {
    reagents: {},
    waterLiters: 0,
    operationCount: 0,
    // null means "not yet evaluable", which is distinct from 0. A 0 index would
    // read as "free" and "maximally safe" (data model §10.1).
    relativeCostIndex: null,
    costConventionVersion,
    safetyIndex: null,
    safetyConventionVersion,
    safetyPenalties: [],
    secondaryWaste: {},
  }
}

/**
 * Add a quantity map to an accumulated quantity map, keeping the first unit seen
 * for each key. Units are not converted here: a scenario must emit deltas in one
 * unit per key, and mixing units for the same reagent is a scenario bug that
 * shows up as a wrong total rather than a crash.
 */
function accumulateQuantities(
  accumulated: Record<string, { amount: number; unit: string }>,
  delta: Record<string, { amount: number; unit: string }>,
): Record<string, { amount: number; unit: string }> {
  const result: Record<string, { amount: number; unit: string }> = { ...accumulated }

  for (const [key, added] of Object.entries(delta)) {
    const existing = result[key]
    result[key] = existing
      ? { amount: existing.amount + added.amount, unit: existing.unit }
      : { amount: added.amount, unit: added.unit }
  }

  return result
}

/**
 * Fold one accepted action's delta into the running ledger.
 *
 * Penalties are stamped with the sequence they committed at, so a report can
 * place each penalty on the timeline instead of presenting an unattributed total.
 */
export function applyResourceDelta(
  ledger: ResourceLedger,
  delta: ResourceDelta,
  sequence: number,
): ResourceLedger {
  return {
    reagents: accumulateQuantities(ledger.reagents, delta.reagents),
    waterLiters: ledger.waterLiters + delta.waterLiters,
    operationCount: ledger.operationCount + delta.operationCount,
    // Carried through: recomputed by the scenario at completion.
    relativeCostIndex: ledger.relativeCostIndex,
    costConventionVersion: ledger.costConventionVersion,
    safetyIndex: ledger.safetyIndex,
    safetyConventionVersion: ledger.safetyConventionVersion,
    safetyPenalties: [
      ...ledger.safetyPenalties,
      ...delta.safetyPenalties.map((penalty) => ({
        code: penalty.code,
        points: penalty.points,
        committedAtSequence: sequence,
      })),
    ],
    secondaryWaste: accumulateQuantities(ledger.secondaryWaste, delta.secondaryWaste),
  }
}
