import { ACID_DISPLAY_FORMAT } from '@/content/scenarios/acid-neutralization.js'

/**
 * Display formatting for scientific numbers.
 *
 * Rounding is presentation-only: the engine never rounds internal state, and these
 * helpers must not be used to truncate anything that gets stored
 * (docs/content/scenarios/acid-neutralization.ts §"Display rounding").
 *
 * Vietnamese locale is used throughout, so the decimal separator is a comma — which is
 * also what the content bundle writes ("25,00 mL"). Mixing separators between the copy
 * and the computed readouts would look like a bug to a learner even when the number is
 * right.
 */

const VI_LOCALE = 'vi-VN'

/** A pH* value, at the summary precision the workbench shows by default. */
export function formatPh(ph: number | null): string {
  return ph === null ? '—' : fixed(ph, ACID_DISPLAY_FORMAT.phSummaryDecimals)
}

/** A pH* value at full technical precision, for the formulas disclosure. */
export function formatPhTechnical(ph: number | null): string {
  return ph === null ? '—' : fixed(ph, ACID_DISPLAY_FORMAT.phTechnicalDecimals)
}

/** A volume already in mL. */
export function formatMl(ml: number | null | undefined): string {
  return ml === null || ml === undefined
    ? '—'
    : `${fixed(ml, ACID_DISPLAY_FORMAT.volumeMlDecimals)} mL`
}

/** A canonical litre volume, displayed in mL. */
export function formatLitresAsMl(litres: number | null | undefined): string {
  return litres === null || litres === undefined
    ? '—'
    : `${fixed(litres * 1000, ACID_DISPLAY_FORMAT.volumeMlDecimals)} mL`
}

/** An amount in mmol, at the significant-figure precision the register uses. */
export function formatMmol(mmol: number | null | undefined): string {
  if (mmol === null || mmol === undefined) return '—'
  return mmol.toLocaleString(VI_LOCALE, {
    maximumSignificantDigits: ACID_DISPLAY_FORMAT.mmolSignificantFigures,
  })
}

/**
 * A dimensionless index (cost, safety) or a score.
 *
 * `null` renders as an em dash, never as 0: §10.1 of the data model forbids inventing a
 * zero for a quantity that is not evaluable, and "0" on a cost index reads as "free".
 */
export function formatIndex(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : fixed(value, 3)
}

/** A whole score, where 0 is meaningful but null is not. */
export function formatScore(score: number | null | undefined): string {
  return score === null || score === undefined ? '—' : String(Math.round(score))
}

/**
 * A quantity that spans many orders of magnitude: an equilibrium constant, a species
 * concentration, a charge-balance residual.
 *
 * WHY THIS EXISTS. The evidence register's derived-value table was formatting the model's
 * own constants with the pH formatter — five fixed decimals — so K_w (1,023 × 10⁻¹⁴), K_a1,
 * K_a2 and K_H,Ca all printed as "0,00000". On the one page whose entire purpose is
 * scientific traceability, every constant the engine runs on read as zero.
 *
 * Fixed decimals cannot serve both a pH near 7 and a constant near 1e-14; these values
 * need an exponent. The comma is the Vietnamese decimal separator, matching every other
 * number in the product (§9).
 */
export function formatScientific(
  value: number | null | undefined,
  significantDigits = 4,
): string {
  if (value === null || value === undefined) return '—'
  return value.toExponential(significantDigits).replace('.', ',')
}

/** A count, where zero is a real answer. */
export function formatCount(count: number): string {
  return String(count)
}

/** A fixed-decimal number in Vietnamese locale. */
function fixed(value: number, decimals: number): string {
  return value.toLocaleString(VI_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Relative date for list views.
 *
 * The browser formats it: a server-rendered absolute string would be computed against
 * the server's clock and locale, and could disagree with what the learner sees
 * elsewhere in the app.
 */
export function formatRelativeDate(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(VI_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}
