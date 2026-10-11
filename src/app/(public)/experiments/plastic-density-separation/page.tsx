import type { Metadata } from 'next'
import { PlasticSeparationWorkbench } from '@/features/plastic-separation/plastic-separation-workbench.js'

export const metadata: Metadata = {
  title: 'Phân loại nhựa nguyên sinh',
  description:
    'Mô phỏng phân loại sáu loại nhựa nguyên sinh bằng phương pháp nổi–chìm theo nồng độ dung dịch.',
}

/**
 * Dedicated route for the plastic separation prototype.
 * Kept separate from the acid-only scenario catalog/workbench so this feature
 * does not alter source files owned by other team members.
 */
export default function PlasticDensitySeparationPage() {
  return <PlasticSeparationWorkbench />
}
