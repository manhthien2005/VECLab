import type { Metadata } from 'next'
import { WaterTreatmentWorkbench } from '@/features/water-treatment/workbench.js'

export const metadata: Metadata = {
  title: 'Xử lý nước Fe, Zn, Pb — Bàn thực hành',
  description: 'Mô phỏng xử lý nước chứa Fe, Zn, Pb bằng hydroxide route. Keo tụ, lắng, lọc.',
}

export default function WaterTreatmentPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const attemptId = typeof searchParams.attempt === 'string' ? searchParams.attempt : null
  const invalidAttempt = searchParams.invalid === 'true'
  const openReport = searchParams.report === '1'
  const initialPane = 
    typeof searchParams.pane === 'string' && ['simulation', 'controls', 'notebook'].includes(searchParams.pane)
      ? (searchParams.pane as 'simulation' | 'controls' | 'notebook')
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
