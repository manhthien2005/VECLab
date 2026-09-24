/**
 * Canonical units.
 *
 * Every number entering a domain engine must already be in canonical unit
 * (docs/system-architecture.md §5.1). Unit conversion lives here so engine
 * code never carries a multiplier.
 *
 * Canonical set for MVP:
 *   volume        -> litre (L)
 *   amount        -> mole (mol)
 *   concentration -> mol/L
 *   mass          -> gram (g)
 *   density       -> g/mL  (as reported by polymer datasheets)
 *   temperature   -> degree Celsius (°C)
 *   pressure      -> megapascal (MPa)
 */

export type CanonicalQuantity =
  | 'volume'
  | 'amount'
  | 'concentration'
  | 'mass'
  | 'density'
  | 'temperature'
  | 'pressure'

export type UnitId = string

export type UnitDefinition = {
  quantity: CanonicalQuantity
  /** Factor from this unit to the canonical unit of the quantity. */
  toCanonical: number
  /** For temperature, conversion is affine rather than linear. */
  affine?: {
    scale: number
    offset: number
  }
}

export const CANONICAL_UNITS: Record<CanonicalQuantity, UnitId> = {
  volume: 'L',
  amount: 'mol',
  concentration: 'mol/L',
  mass: 'g',
  density: 'g/mL',
  temperature: 'C',
  pressure: 'MPa',
}

const MILLI = 1e-3
const MICRO = 1e-6

export const UNITS: Record<UnitId, UnitDefinition> = {
  L: { quantity: 'volume', toCanonical: 1 },
  mL: { quantity: 'volume', toCanonical: MILLI },
  uL: { quantity: 'volume', toCanonical: MICRO },
  mol: { quantity: 'amount', toCanonical: 1 },
  mmol: { quantity: 'amount', toCanonical: MILLI },
  umol: { quantity: 'amount', toCanonical: MICRO },
  'mol/L': { quantity: 'concentration', toCanonical: 1 },
  'mmol/L': { quantity: 'concentration', toCanonical: MILLI },
  'mol/mL': { quantity: 'concentration', toCanonical: 1e3 },
  g: { quantity: 'mass', toCanonical: 1 },
  kg: { quantity: 'mass', toCanonical: 1e3 },
  mg: { quantity: 'mass', toCanonical: MILLI },
  'g/mL': { quantity: 'density', toCanonical: 1 },
  'g/L': { quantity: 'density', toCanonical: MILLI },
  'kg/m3': { quantity: 'density', toCanonical: MILLI },
  C: { quantity: 'temperature', toCanonical: 1 },
  K: { quantity: 'temperature', toCanonical: 1, affine: { scale: 1, offset: -273.15 } },
  MPa: { quantity: 'pressure', toCanonical: 1 },
  kPa: { quantity: 'pressure', toCanonical: MILLI },
  bar: { quantity: 'pressure', toCanonical: 0.1 },
}

export class UnitError extends Error {
  constructor(
    readonly code: 'UNKNOWN_UNIT' | 'QUANTITY_MISMATCH' | 'NOT_CANONICALIZABLE',
    message: string,
  ) {
    super(message)
    this.name = 'UnitError'
  }
}

function requireUnit(unit: UnitId): UnitDefinition {
  const definition = UNITS[unit]
  if (!definition) throw new UnitError('UNKNOWN_UNIT', `Unknown unit: ${unit}`)
  return definition
}

/**
 * Non-throwing unit lookup.
 *
 * Callers that must report an unknown unit as a typed DomainError need this
 * instead of `toCanonical`, because `toCanonical` throws UnitError for two
 * distinct conditions — unknown unit AND crossed quantity — and a catch block
 * around it cannot tell them apart. Checking existence first keeps each failure
 * mode separately reportable.
 */
export function lookupUnit(unit: UnitId): UnitDefinition | undefined {
  return UNITS[unit]
}

export function toCanonical(value: number, fromUnit: UnitId): number {
  const definition = requireUnit(fromUnit)
  if (definition.affine) return value * definition.affine.scale + definition.affine.offset
  return value * definition.toCanonical
}

export function fromCanonical(value: number, toUnit: UnitId): number {
  const definition = requireUnit(toUnit)
  if (definition.affine) return (value - definition.affine.offset) / definition.affine.scale
  return value / definition.toCanonical
}

/**
 * Convert only inside the same quantity. Crossing quantities is a bug, not a
 * formatting choice, so it throws instead of silently producing garbage.
 */
export function convert(value: number, fromUnit: UnitId, toUnit: UnitId): number {
  const from = requireUnit(fromUnit)
  const to = requireUnit(toUnit)
  if (from.quantity !== to.quantity) {
    throw new UnitError(
      'QUANTITY_MISMATCH',
      `Cannot convert ${fromUnit} (${from.quantity}) to ${toUnit} (${to.quantity})`,
    )
  }
  return fromCanonical(toCanonical(value, fromUnit), toUnit)
}

export function canonicalUnitOf(unit: UnitId): UnitId {
  return CANONICAL_UNITS[requireUnit(unit).quantity]
}

