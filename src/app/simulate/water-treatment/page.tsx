import type { Metadata } from 'next'
import { WaterTreatmentWorkbench } from '@/features/water-treatment/workbench.js'

/**
 * `/simulate/water-treatment` — bàn thực hành Xử lý nước Fe/Zn/Pb.
 *
 * Skeleton UI cho chemistry baseline D1-D5 (đã chốt ngày 16/10/2026). P0-A
 * (QCVN xác minh pháp lý), P0-C (capacity 3 KL closed-form), P0-D (chemistry
 * pin + 7/7 case PHREEQC PASS) và P0-F (≥ 3 golden case) đã đóng ngày 17/10/2026.
 * Solver có thể tính goalStatus end-to-end (success / partial-success / failed /
 * invalid). UI sẽ chỉ gán `goalStatus = 'unknown'` nếu solver trả về unknown
 * (không xảy ra với input hợp lệ).
 *
 * Xem `docs/experiments/water-treatment-spec.md` §4.1 (two-layer design),
 * §16.1 (P0 table) và `docs/scientific-evidence-register.md` §5.1.3 để biết
 * trạng thái cross-check.
 */
type WaterTreatmentPageProps = {
  searchParams: Promise<{ attempt?: string | string[]; view?: string | string[] }>
}

export const metadata: Metadata = {
  title: 'Xử lý nước Fe, Zn và Pb — Bàn thực hành | VECLab',
  description:
    'Bàn thực hành hydroxide route cho nước chứa Fe, Zn, Pb. Solver end-to-end với capacity closed-form (P0-A + P0-C + P0-D + P0-F đã đóng 17/10/2026).',
  robots: { index: false, follow: false },
}

export default async function WaterTreatmentPage({ searchParams }: WaterTreatmentPageProps) {
  const { attempt, view } = await searchParams
  const invalidAttempt = attempt !== undefined &&
    (typeof attempt !== 'string' || attempt.length === 0)
  const attemptId = typeof attempt === 'string' && attempt.length > 0 ? attempt : null
  return (
    <WaterTreatmentWorkbench
      attemptId={attemptId}
      invalidAttempt={invalidAttempt}
      openReport={view === 'report'}
      initialPane={view === 'notebook' ? 'notebook' : 'simulation'}
    />
  )
}