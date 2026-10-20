import type { Metadata } from 'next'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { ScenarioCard } from '@/features/experiment-catalog/scenario-card.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'

export const metadata: Metadata = {
  title: 'Thí nghiệm',
  description: 'Thực hành Jar Test, chiết tách axit–bazơ và phân loại nhựa nguyên sinh. Hấp phụ xanh methylene chưa triển khai.',
}

export default function ExperimentsPage() {
  const catalog = listCatalog()
  return (
    <div className="page experiment-library">
      <svg className="experiment-library-background" viewBox="0 0 1440 1700" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <path id="library-hexagon" d="M0-24 21-12v24L0 24-21 12v-24Z" />
          <pattern id="library-science-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.8" fill="currentColor" /></pattern>
        </defs>
        <g fill="url(#library-science-dots)" opacity="0.2">
          <rect x="1180" y="12" width="240" height="180" />
          <rect x="0" y="720" width="95" height="200" />
          <rect x="1345" y="1280" width="95" height="220" />
        </g>
        <g fill="var(--accent-soft)" stroke="currentColor" strokeWidth="1.2" opacity="0.35">
          <use href="#library-hexagon" x="1100" y="90" /><use href="#library-hexagon" x="1142" y="90" />
          <use href="#library-hexagon" x="1121" y="126" /><use href="#library-hexagon" x="1163" y="126" />
          <use href="#library-hexagon" x="1184" y="90" /><use href="#library-hexagon" x="1205" y="126" />
          <use href="#library-hexagon" x="1375" y="620" /><use href="#library-hexagon" x="1354" y="656" />
          <use href="#library-hexagon" x="35" y="1120" /><use href="#library-hexagon" x="56" y="1156" />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.28">
          <path d="M1440 40h-110l-24 42h-68M1440 228h-150l-28-48h-110M0 480h24v170l22 38v100M1440 930h-24v170l-22 38v110M0 1600h160l26-45h155M1440 1600h-160l-26-45h-155" />
          <path d="m1278 118 28 16v32l-28 16-28-16v-32Zm28 16 32-18m-32 50 32 18m-88-34h-22" />
        </g>
        <g fill="currentColor" opacity="0.45">
          <circle cx="1238" cy="82" r="3" /><circle cx="1152" cy="180" r="3" />
          <circle cx="1338" cy="116" r="3" /><circle cx="1338" cy="184" r="3" /><circle cx="1228" cy="150" r="3" />
          <circle cx="46" cy="788" r="2.5" /><circle cx="1394" cy="1248" r="2.5" />
        </g>
      </svg>
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm' }]} />
      <header className="experiment-library-header">
        <h1>Thí nghiệm</h1>
        <p>Chọn một bài để tìm hiểu quy trình, điều chỉnh điều kiện và quan sát kết quả.</p>
      </header>
      <div className="experiment-library-grid">
        {EXPERIMENT_OVERVIEWS.map(overview => <ScenarioCard key={overview.scenarioKey} overview={overview} entry={catalog.find(entry => entry.scenarioKey === overview.scenarioKey)} />)}
      </div>
    </div>
  )
}
