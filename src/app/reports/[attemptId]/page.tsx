import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { currentStorageMode } from '@/features/auth/session.js'
import { AttemptShell } from '@/features/reports/attempt-shell.js'

/**
 * `/reports/[attemptId]` — the completed run's report (web scope §4.7).
 *
 * The same shell as `/attempts/[attemptId]` with `view="report"`, which is the difference
 * between the two routes: the report view refuses to render a run that has no frozen
 * snapshot and instead sends the learner back to finish it (§4.2 makes the snapshot
 * mandatory at completion, so its absence means the run is unfinished, not broken).
 *
 * Printable through the browser's own dialog. §4.7 is explicit that there is no
 * server-side PDF service, so this route renders HTML and the print stylesheet does the
 * rest — which is why the chart keeps its ink in `@media print` rather than being an
 * on-screen-only decoration.
 */

type ReportPageProps = {
  params: Promise<{ attemptId: string }>
}

export const metadata: Metadata = {
  title: APP_STRINGS.report.title,
  // One learner's finished run: never indexed, never followed.
  robots: { index: false, follow: false },
}

export default async function ReportPage({ params }: ReportPageProps) {
  const [{ attemptId }, storageMode] = await Promise.all([params, currentStorageMode()])

  return <AttemptShell attemptId={attemptId} storageMode={storageMode} view="report" />
}
