import type { Metadata } from 'next'
import { WaterTreatmentWorkbench } from '@/features/water-treatment/workbench.js'

export const runtime = 'nodejs'
export const maxDuration = 30

export const metadata: Metadata = {
  title: 'Xử lý nước Fe, Zn, Pb — Bàn thực hành',
  description: 'Mô phỏng xử lý nước chứa Fe, Zn, Pb bằng hydroxide route. Keo tụ, lắng, lọc.',
}

export default async function WaterTreatmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = await searchParams
  const attemptId = typeof resolved.attempt === 'string' ? resolved.attempt : null
  const invalidAttempt = resolved.invalid === 'true'
  const openReport = resolved.report === '1'
  const initialPane =
    typeof resolved.pane === 'string' && ['simulation', 'controls', 'notebook'].includes(resolved.pane)
      ? (resolved.pane as 'simulation' | 'controls' | 'notebook')
      : 'simulation'

  return (
    <WaterTreatmentWorkbench 
      attemptId={attemptId}
      invalidAttempt={invalidAttempt}
      storageMode="local"
      openReport={openReport}
      initialPane={initialPane}
    />
  )
}
