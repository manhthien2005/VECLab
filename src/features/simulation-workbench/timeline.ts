import type { StoredAttemptEventRecord } from '@/application/attempts/repository.js'
import type { AcidNeutralizationState } from '@/domain/experiments/acid-neutralization/state.js'
import { formatLitresAsMl } from '@/shared/ui/format.js'
import { actionLabel, routeLabel } from './copy.js'

/**
 * Build the action timeline from stored event records (§4.6 group 2, §14.2).
 *
 * Lives in `features/`, not `application/`, because it needs localized action labels and a
 * formatted volume — presentation concerns. The application layer hands over raw records;
 * deciding how a record reads in Vietnamese belongs beside the component that renders it.
 *
 * REVERTED EVENTS STAY IN THE LIST. An undo is appended, never deleted (§14.2), so the
 * chain keeps every action the learner ever took. Rendering a reverted action as if it
 * still counted would misrepresent the run — the learner would see a dose they took back
 * and still believe it is in the beaker — while hiding it would erase the audit trail that
 * makes the chain trustworthy. So it is shown, marked, and annotated with which later
 * event reverted it.
 */

/**
 * One timeline row.
 *
 * Declared here rather than in the panel that renders it, because this module produces it:
 * the builder owns the shape of its own output, and a panel importing the type it consumes
 * is the correct direction. Putting it in the panel would make the builder depend on a
 * component for a type it has no other reason to know about.
 */
export type TimelineEntry = {
  sequence: number
  actionId: string
  /** Localized label for the action type. */
  actionLabel: string
  /** The engine's action type, so a caller can decide what is undoable. */
  actionType: string
  /** Short human summary, e.g. the aliquot volume; null when there is nothing to add. */
  summary: string | null
  /** Set on an event a later undo reverted, so the learner sees why it stopped counting. */
  revertedBySequence: number | null
  /** Set on the undo event itself, naming what it reverted. */
  undoOfSequence: number | null
}

/**
 * One record per stored event, in sequence order.
 *
 * `records` must already be ordered; both repositories return them that way because the key
 * is `[attemptId, sequence]`. Re-sorting here would be defensive code that hides an ordering
 * bug instead of surfacing it.
 */
export function buildTimeline(
  records: readonly StoredAttemptEventRecord<AcidNeutralizationState>[],
): TimelineEntry[] {
  // Sequences a later undo reverted, mapped to the event that reverted them. Built in one
  // pass so each record can be annotated without rescanning the chain per entry.
  const revertedBy = new Map<number, number>()
  for (const record of records) {
    if (record.undoOfSequence !== null) {
      revertedBy.set(record.undoOfSequence, record.sequence)
    }
  }

  return records.map((record) => ({
    sequence: record.sequence,
    actionId: record.actionId,
    actionLabel: actionLabel(record.actionType),
    actionType: record.actionType,
    summary: summaryFor(record),
    revertedBySequence: revertedBy.get(record.sequence) ?? null,
    undoOfSequence: record.undoOfSequence,
  }))
}

/**
 * The action type of the newest event, or null for an empty chain.
 *
 * The workbench uses this to decide whether undo applies: `undoLastAction` refuses unless
 * the LAST event's action type is undoable, so that is the fact the control needs — not
 * whether some earlier action was undoable, which would enable a button the engine then
 * rejects.
 */
export function lastActionType(
  entries: readonly TimelineEntry[],
): string | null {
  return entries.length === 0 ? null : entries[entries.length - 1]!.actionType
}

/**
 * A short summary of what the action did, or null when there is nothing to add.
 *
 * Only the dose-bearing actions get one: the aliquot volume is the single number a learner
 * most needs next to "added base", because it is what they chose and what changed the
 * chemistry. Labelling `mix` or `wait_for_stable_reading` would add noise, not information.
 */
function summaryFor(
  record: StoredAttemptEventRecord<AcidNeutralizationState>,
): string | null {
  if (record.undoOfSequence !== null) {
    // No summary: the row's label already reads "Hoàn tác thao tác cuối" and the detail
    // line the panel renders already names the reverted sequence. Returning `event N`
    // here would print the same number twice in one row.
    return null
  }

  // Read volumes from the state the event produced rather than from `inputPayload`: the
  // payload holds what the learner ASKED for (possibly in mL), while the state holds what
  // was actually applied in canonical litres. Showing the applied value means the timeline
  // cannot disagree with the volumes in the state panel.
  const state = record.stateAfter

  switch (record.actionType) {
    case 'add_base':
      return `tổng base ${formatLitresAsMl(state.baseVolumeL)}`
    case 'add_correction_acid':
      return `tổng HCl ${formatLitresAsMl(state.correctionAcidVolumeL)}`
    case 'measure_ph':
      return state.lastMeasuredPH === null
        ? 'không có số đọc'
        : `pH* ${state.lastMeasuredPH.toLocaleString('vi-VN', {
            minimumFractionDigits: 5,
            maximumFractionDigits: 5,
          })}`
    case 'select_route':
      return state.route === null ? null : routeLabel(state.route)
    default:
      return null
  }
}
