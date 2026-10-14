import type { Metadata } from 'next'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { ScenarioCard } from '@/features/experiment-catalog/scenario-card.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'

export const metadata: Metadata = {
  title: 'Thí nghiệm',
  description: 'Các bài thực hành mô phỏng xử lý nước: điều chỉnh pH, Jar Test và hấp phụ xanh methylene.',
}

export default function ExperimentsPage() {
  const catalog = listCatalog()
  return (
    <div className="page experiment-library">
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm' }]} />
      <header className="experiment-library-header">
        <h1>Thí nghiệm</h1>
        <p>Chọn một bài để tìm hiểu quy trình, điều chỉnh điều kiện và quan sát kết quả xử lý nước.</p>
      </header>
      <div className="experiment-library-grid">
        {EXPERIMENT_OVERVIEWS.map(overview => <ScenarioCard key={overview.scenarioKey} overview={overview} entry={catalog.find(entry => entry.scenarioKey === overview.scenarioKey)} />)}
      </div>
    </div>
  )
}
