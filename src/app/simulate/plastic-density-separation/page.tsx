import type { Metadata } from 'next'
import { PlasticSeparationWorkbench } from '@/features/plastic-separation/workbench.js'
import { parseUUID } from '@/shared/ids.js'

export const metadata: Metadata = {
  title: 'Phân loại nhựa nguyên sinh',
  description:
    'Mô phỏng phân loại sáu loại nhựa nguyên sinh bằng phương pháp nổi–chìm theo nồng độ dung dịch.',
}

export default async function PlasticDensitySeparationSimulationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { attempt, view } = await searchParams
  const id = typeof attempt === 'string' ? parseUUID(attempt) : null
  return <PlasticSeparationWorkbench attemptId={id} invalidAttempt={attempt !== undefined && id === null}
    openReport={view === 'report'} initialPane={view === 'notebook' ? 'notebook' : 'simulation'} />
}
