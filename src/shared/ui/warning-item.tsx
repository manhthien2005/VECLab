import type { DomainWarning } from '@/domain/process/contracts.js'
import { resolveMessage } from '@/content/index.js'

/**
 * One engine warning, rendered (§4.6 item 8, §4.8 "cảnh báo và sai sót").
 *
 * Shared rather than private to the workbench, because the comparison screen has to show the
 * same warnings for a finished run and they must look the same doing it. Two copies of a
 * severity→tone mapping is how one screen starts calling a blocking warning yellow.
 *
 * The engine supplies a `messageKey` and a `data` record and never a sentence — text lives in
 * content, not in engine code (docs/system-architecture.md) — so this component resolves
 * through the same helper every other surface uses. A warning the engine emits but content does
 * not define therefore renders its key rather than a blank line, which is a visible defect
 * rather than a silent one.
 */

/** Severity, mapped to the alert tone the design system already defines. */
function toneFor(severity: DomainWarning['severity']): string {
  // Exhaustive over the three severities the contract allows. A future fourth would fall
  // through to `alert-info`, which is the least alarming tone — deliberate, because an
  // unmapped severity must not be rendered as blocking and frighten a learner about a run
  // that is fine.
  switch (severity) {
    case 'blocking':
      return 'alert-danger'
    case 'warning':
      return 'alert-warn'
    case 'info':
      return 'alert-info'
    default:
      return 'alert-info'
  }
}

export function WarningItem({ warning }: { warning: DomainWarning }) {
  return (
    <p className={`alert ${toneFor(warning.severity)} small`}>
      <span className="badge">{warning.severity}</span>{' '}
      {resolveMessage(warning.messageKey, warning.data)}
    </p>
  )
}

/**
 * Narrow a stored warning to the domain shape, or null when it is not one.
 *
 * Needed because `attempt_events.warnings` is a jsonb column with no schema, so the repository
 * hands it back as `unknown[]` and narrowing is the renderer's job
 * (src/application/attempts/repository.ts). The check is structural rather than a cast: a
 * warning row written by a future release could carry fields this one does not know, and
 * rendering an object without a `messageKey` would throw inside `resolveMessage` for the whole
 * list.
 *
 * Interpolation values are filtered to the types `DomainWarning` declares rather than widened
 * to `unknown` and cast. A stored value of some other type is dropped, which leaves its
 * `{placeholder}` visible in the rendered sentence — a defect a learner or a reviewer can see,
 * where rendering `[object Object]` would look like intended copy.
 */
export function asDomainWarning(value: unknown): DomainWarning | null {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Record<string, unknown>

  if (typeof candidate.code !== 'string') return null
  if (typeof candidate.messageKey !== 'string') return null
  if (
    candidate.severity !== 'info' &&
    candidate.severity !== 'warning' &&
    candidate.severity !== 'blocking'
  ) {
    return null
  }

  const data: Record<string, number | string> = {}
  if (typeof candidate.data === 'object' && candidate.data !== null) {
    for (const [key, item] of Object.entries(candidate.data as Record<string, unknown>)) {
      if (typeof item === 'number' || typeof item === 'string') data[key] = item
    }
  }

  return {
    code: candidate.code,
    severity: candidate.severity,
    messageKey: candidate.messageKey,
    data,
  }
}
