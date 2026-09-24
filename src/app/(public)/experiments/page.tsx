import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { ScenarioCard } from '@/features/experiment-catalog/scenario-card.js'

/**
 * Experiment catalog (docs/web-application-scope.md §4.1).
 *
 * Lists every release this deployment can serve. A scenario appears only when its
 * content manifest AND its engine are both present, so the catalog cannot offer a card
 * whose attempt would fail to run (§2.4).
 *
 * Server Component over the release registries: statically renderable, and adding a
 * scenario needs no edit here.
 */

export const metadata: Metadata = {
  title: APP_STRINGS.nav.experiments,
  description:
    'Các thí nghiệm đã được khóa phiên bản: mô hình, nguồn khoa học và giới hạn công bố của từng kịch bản.',
}

export default function ExperimentsPage() {
  const catalog = listCatalog()

  return (
    <div className="page stack-loose">
      <section className="stack">
        <h1>{APP_STRINGS.nav.experiments}</h1>
        <p className="muted">
          Mỗi thí nghiệm là một phiên bản đã khóa: đặc tả mô hình, quy tắc chấm điểm, nội
          dung và sổ đăng ký bằng chứng đều gắn với một mã phiên bản. Kết quả bạn tạo ra chỉ
          so sánh được với kết quả của cùng phiên bản đó.
        </p>
      </section>

      {catalog.length === 0 ? (
        <p className="alert alert-info">{APP_STRINGS.home.catalogEmpty}</p>
      ) : (
        <div className="catalog-grid">
          {catalog.map((entry) => (
            <ScenarioCard key={entry.releaseId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
