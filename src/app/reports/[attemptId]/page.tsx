import type { Metadata } from 'next'
import { AttemptShell } from '@/features/reports/attempt-shell.js'

export const metadata: Metadata = { title: 'Báo cáo thực hành | VECLab', robots: { index: false, follow: false } }

export default async function ReportPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params
  return <AttemptShell key={attemptId} attemptId={attemptId} view="report" />
}
