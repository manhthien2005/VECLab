import type { Metadata } from 'next'
import { SoapGuide } from '@/features/soap/guide.js'

export const metadata: Metadata = {
  title: 'Lý thuyết & cách làm xà phòng hóa',
  description: 'Hướng dẫn xà phòng cold process từng bước: pha kiềm, trộn dầu, đổ khuôn, đo mẫu và đọc báo cáo.',
  robots: { index: false, follow: false },
}

export default async function SoapGuidePage({ searchParams }: { searchParams: Promise<{ attempt?: string | string[] }> }) {
  const params = await searchParams
  return <SoapGuide attemptId={typeof params.attempt === 'string' ? params.attempt : undefined} />
}
