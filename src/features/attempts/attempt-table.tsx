import Link from 'next/link'
import { ACID_STRINGS, APP_STRINGS, resolveReleaseManifest } from '@/content/index.js'
import type { UUID } from '@/domain/process/contracts.js'
import type { AttemptSummary } from '@/application/attempts/repository.js'
import { isAcidProjection } from '@/application/scenarios/acid-projection.js'
import { formatRelativeDate, formatPh, formatScore } from '@/shared/ui/format.js'

/**
 * One attempt, reduced to what a list row shows.
 *
 * Shared by My Lab (§4.5) and the account screen (§4.9), both of which list attempts and let
 * the learner delete one. The reason that is worth a shared component rather than two similar
 * ones is narrow but real: pH* and score are `number | null`, where null means "not
 * evaluable" and NOT zero (§10.2). Two implementations would eventually render that
 * differently, and the account screen would then show a score of 0 where the lab shows a dash
 * for the very same attempt.
 */
export type AttemptRow = {
  attemptId: UUID
  status: AttemptSummary['status']
  releaseId: string
  updatedAt: Date
  phStar: number | null
  overallScore: number | null
}

/**
 * Reduce a summary to a row.
 *
 * The projection is narrowed with the projector's own guard rather than duck-typed, so a
 * projection written by a different projector version renders as N/A instead of as numbers
 * that mean something else. §18 notes a list must not load state payloads — this reads only
 * the summary the store already carries.
 */
export function toAttemptRow(summary: AttemptSummary): AttemptRow {
  const projection = isAcidProjection(summary.currentProjection)
    ? summary.currentProjection
    : null

  return {
    attemptId: summary.attemptId,
    status: summary.status,
    releaseId: summary.scenarioReleaseId,
    updatedAt: summary.updatedAt,
    phStar: projection?.phStar ?? null,
    overallScore: projection?.overallScore ?? null,
  }
}

/**
 * The human title behind a release id.
 *
 * Read from the content manifest rather than mapped here, so a re-release that renames the
 * scenario renames it in the lab too. An id with no manifest — a run recorded against a
 * release this deployment no longer serves — falls back to the id itself: §15.1 requires
 * such a report to stay readable, so the row must still render.
 */
function experimentTitle(releaseId: string): string {
  const manifest = resolveReleaseManifest(releaseId)
  if (manifest === null) return releaseId
  const title = ACID_STRINGS[manifest.titleKey as keyof typeof ACID_STRINGS]
  return typeof title === 'string' ? title : releaseId
}

/** An attempt is resumable while it is in progress; the other statuses are terminal. */
export function isInProgress(row: AttemptRow): boolean {
  return row.status === 'in_progress'
}

type AttemptTableProps = {
  /**
   * The table's accessible name, rendered as its `<caption>`. Always required: a table with
   * no caption is a grid of numbers a screen reader cannot say what it is about.
   */
  heading: string
  rows: readonly AttemptRow[]
  /**
   * Called when the learner confirms a delete. The confirmation dialog belongs to the CALLER,
   * not here: the two screens phrase it differently (the lab warns about losing an unfinished
   * run, the account screen about losing data attached to the account), and a shared table
   * should not decide wording it cannot see.
   */
  onRemove: (attemptId: UUID) => Promise<void>
  /** Whether a completed row offers its report. The account screen shows it too; both do. */
  showReportLink?: boolean
  /**
   * Whether to render the heading as a visible `<h2>` as well as the caption.
   *
   * My Lab passes the default, because there the table IS the section and nothing else
   * labels it. The account screen turns it off, because that screen renders one heading over
   * all four of its states — loading, failed, empty and ready — so a second one inside the
   * ready state would repeat the same words twice on the page. The caption is unaffected, so
   * the table stays named either way.
   */
  showHeading?: boolean
}

/**
 * One group of attempts as a table.
 *
 * A real table rather than a list of cards, because §4.5 asks for status, experiment, updated
 * time and completion side by side — columns a learner compares down, not fields they read
 * across one item at a time.
 *
 * An empty group renders nothing at all: a heading over an empty table reads as a failure to
 * load rather than as "you have none of these", which is a different message and the caller
 * decides which one it wants to send.
 */
export function AttemptTable({
  heading,
  rows,
  onRemove,
  showReportLink = true,
  showHeading = true,
}: AttemptTableProps) {
  const strings = APP_STRINGS.lab

  if (rows.length === 0) return null

  return (
    <section className="card stack-tight">
      {showHeading ? <h2>{heading}</h2> : null}
      <table className="lab-table">
        <caption className="visually-hidden">{heading}</caption>
        <thead>
          <tr>
            <th scope="col">{strings.column.experiment}</th>
            <th scope="col">{strings.column.status}</th>
            <th scope="col">{strings.column.phStar}</th>
            <th scope="col">{strings.column.score}</th>
            <th scope="col">{strings.column.updated}</th>
            <th scope="col">
              <span className="visually-hidden">{strings.column.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.attemptId}>
              {/*
                The experiment NAME leads; the release id follows it as metadata.

                §4.5 asks this column for "thí nghiệm", and the cell used to render only
                `acid-neutralization@1.0.0` as the link text — so the lab read as a list of
                version strings, and every link had the same accessible name. The id still
                has to be here, because two runs of the same experiment on different
                releases are not comparable (§4.8) and the learner needs to see which is
                which; it is just no longer the headline.
              */}
              <td>
                <Link href={`/attempts/${row.attemptId}`}>{experimentTitle(row.releaseId)}</Link>
                <br />
                <code className="tiny faint">{row.releaseId}</code>
              </td>
              <td>
                <span className={`badge ${row.status === 'completed' ? 'badge-ok' : ''}`}>
                  {strings.status[row.status]}
                </span>
              </td>
              {/* A null pH* means "not evaluable", never zero (§10.2). `formatPh` renders the
                  dash, so the cell does not have to branch — which is what keeps this screen
                  and the lab in agreement without either of them remembering the rule. */}
              <td className="num">{formatPh(row.phStar)}</td>
              <td className="num">{formatScore(row.overallScore)}</td>
              <td>{formatRelativeDate(row.updatedAt)}</td>
              <td>
                <span className="row">
                  <Link className="btn btn-ghost" href={`/attempts/${row.attemptId}`}>
                    {strings.open}
                  </Link>
                  {showReportLink && row.status === 'completed' && (
                    <Link className="btn btn-ghost" href={`/reports/${row.attemptId}`}>
                      {strings.report}
                    </Link>
                  )}
                  <button
                    className="btn btn-ghost"
                    onClick={() => void onRemove(row.attemptId)}
                    type="button"
                  >
                    {strings.delete}
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
