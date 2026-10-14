import type { Metadata } from 'next'
import { currentStorageMode } from '@/features/auth/session.js'
import { JarWorkbench } from '@/features/jar-test/workbench.js'

type JarPageProps = {
  searchParams: Promise<{ attempt?: string | string[] }>
}

export const metadata: Metadata = {
  title: 'Jar Test — Bàn thí nghiệm | VECLab',
  description: 'Bàn Jar Test sáu cốc với chương trình khuấy/lắng và số đo được lưu.',
  robots: { index: false, follow: false },
}

/** Request-scoped storage mode; never select local/cloud from query parameters. */
export default async function JarTestPage({ searchParams }: JarPageProps) {
  const [{ attempt }, storageMode] = await Promise.all([
    searchParams, currentStorageMode(),
  ])
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
      </header>
      <JarWorkbench attemptId={attemptId} invalidAttempt={invalidAttempt}
        storageMode={storageMode} />
    </div>
  )
}
