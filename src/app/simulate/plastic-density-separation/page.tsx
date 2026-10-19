import type { Metadata } from 'next'
import { PlasticSeparationWorkbench } from '@/features/plastic-separation/workbench.js'

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
  const { attempt } = await searchParams
  return <PlasticSeparationWorkbench attemptId={typeof attempt === 'string' ? attempt : null} />
}
