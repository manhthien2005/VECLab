import type { Metadata } from 'next'
import { PlasticSeparationDetail } from '@/features/experiment-catalog/plastic-separation-detail.js'

export const metadata: Metadata = {
  title: 'Phân loại nhựa nguyên sinh · Chi tiết',
  description:
    'Bối cảnh, quy trình nổi–chìm, số liệu thu hồi và giới hạn mô hình phân loại sáu loại nhựa nguyên sinh theo bài báo khoa học.',
}

export default function PlasticDensitySeparationDetailPage() {
  return <PlasticSeparationDetail />
}
