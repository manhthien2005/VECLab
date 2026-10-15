import type { Metadata } from 'next'
import { JarWorkbench } from '@/features/jar-test/workbench.js'

type JarPageProps = {
  searchParams: Promise<{ attempt?: string | string[] }>
}

export const metadata: Metadata = {
  title: 'Jar Test — Bàn thí nghiệm | VECLab',
  description: 'Bàn Jar Test sáu cốc với chương trình khuấy/lắng và số đo được lưu.',
  robots: { index: false, follow: false },
}

/** Temporary UI integration: keep Jar runs local until its BFF is integrated. */
export default async function JarTestPage({ searchParams }: JarPageProps) {
  const { attempt } = await searchParams
  // Missing attempt is a new-run entry, while malformed/repeated values are
  // explicit invalid links and must never mint a replacement attempt.
  const invalidAttempt = attempt !== undefined &&
    (typeof attempt !== 'string' || attempt.length === 0)
  const attemptId = typeof attempt === 'string' && attempt.length > 0 ? attempt : null
  return (
    <div className="page stack">
      <header className="stack-tight">
        <h1>Bàn thí nghiệm Jar Test</h1>
        <p className="muted">Keo tụ · Tạo bông · Lắng · Đo độ đục</p>
        <p className="muted">Bản thực hành thử: lượt Jar Test chỉ lưu trong trình duyệt này,
          kể cả khi đã đăng nhập. Lượt chưa được đồng bộ vào tài khoản.</p>
      </header>
      <JarWorkbench attemptId={attemptId} invalidAttempt={invalidAttempt}
        storageMode="local" />
    </div>
  )
}
