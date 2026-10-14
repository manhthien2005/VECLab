import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { APP_STRINGS, ACID_STRINGS, ACID_INPUT_DOMAIN, ACID_ROUTE_CHOICES, ACID_DISPLAY_FORMAT, ACID_SOURCES } from '@/content/index.js'
import { findCatalogEntry, listActions, manifestFor } from '@/features/experiment-catalog/catalog.js'
import { ArrowRightIcon, FlaskIcon, CheckCircleIcon, ShieldCheckIcon, RepeatIcon, LayersIcon, CalculatorIcon, WarningIcon, BookIcon } from '@/features/landing/icons.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { SourceList, ClaimList } from '@/shared/ui/scientific-disclosure.js'
import { formatLitresAsMl, formatPh } from '@/shared/ui/format.js'

type DetailPageProps = { params: Promise<{ scenarioKey: string }> }
const DETAIL_SUMMARY = 'Thêm từng lượng NaOH vào mẫu axit, theo dõi pH và tìm cách đạt mục tiêu mà không dùng dư hóa chất.'

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { scenarioKey } = await params
  const entry = findCatalogEntry(scenarioKey)
  return {
    title: APP_STRINGS.home.showcaseCards.find(card => card.scenarioKey === scenarioKey)?.title ?? entry?.title ?? APP_STRINGS.experimentDetail.notFoundTitle,
    description: entry ? DETAIL_SUMMARY : undefined,
  }
}

/** Read-first overview. Chemistry, limits and release identity come from the locked bundle. */
export default async function ExperimentDetailPage({ params }: DetailPageProps) {
  const { scenarioKey } = await params
  const entry = findCatalogEntry(scenarioKey)
  if (entry === null) notFound()
  const manifest = manifestFor(entry.releaseId)
  if (manifest === null) notFound()

  const actions = listActions(entry.scenarioKey)
  const displayTitle = APP_STRINGS.home.showcaseCards.find(card => card.scenarioKey === scenarioKey)?.title ?? entry.title
  const benchmark = ACID_INPUT_DOMAIN.benchmark
  const limits = ACID_INPUT_DOMAIN.limits
  const startHref = `/simulate/${entry.scenarioKey}`
  const precisePh = (value: number) => value.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
  const band = `${precisePh(benchmark.targetPH - benchmark.targetTolerancePH)}–${precisePh(benchmark.targetPH + benchmark.targetTolerancePH)}`

  return (
    <div className="page experiment-detail">
      <DetailBackground />
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: displayTitle }]} />
      <header className="experiment-detail-header">
        <div>
          <div className="experiment-detail-tags"><span className="experiment-topic">Axit – bazơ</span><span className="experiment-availability is-available"><span />Thực hành với NaOH</span></div>
          <h1>{displayTitle}</h1>
          <p>{DETAIL_SUMMARY}</p>
        </div>
        <Link className="btn experiment-library-start" href={startHref}>Bắt đầu thực hành <ArrowRightIcon /></Link>
      </header>

      <div className="experiment-detail-grid">
        <section className="experiment-detail-panel experiment-detail-goal" aria-labelledby="goal-title">
          <h2 id="goal-title"><CheckCircleIcon />Đưa mẫu axit về pH mục tiêu</h2>
          <p>Điều chỉnh pH là một công đoạn trong xử lý nước. Ở bài này, bạn thực hành với mẫu HCl có thành phần đã biết để hiểu cách chọn liều, đo và điều chỉnh.</p>
          <div className="experiment-detail-target">
            <div><span>Mục tiêu mẫu chuẩn</span><strong>pH* {formatPh(benchmark.targetPH)}</strong><small>Dung sai ± {formatPh(benchmark.targetTolerancePH)}</small></div>
            <div><span>Dải đạt chính xác</span><strong>{band}</strong><small>Tâm {precisePh(benchmark.targetPH)} · trước khi làm tròn</small></div>
          </div>
          <p className="experiment-detail-note">Đây là tiêu chí học tập trong mô phỏng, không phải ngưỡng quy định hoặc kết luận nước đã an toàn.</p>
          <div className="experiment-detail-learning"><CheckCircleIcon /><p>Sau bài này, bạn biết đọc số đo hợp lệ, chọn lượng hóa chất mỗi lần thêm và nhận ra tác động của việc thêm quá tay.</p></div>
        </section>

        <section className="experiment-detail-panel experiment-detail-sample" aria-labelledby="sample-title">
          <div className="experiment-detail-sample-image"><Image src="/assets/experiments/ph.webp" alt="Cốc phản ứng, buret và điện cực đo pH trong mô phỏng" fill sizes="(max-width: 60rem) 90vw, 30vw" /></div>
          <div className="experiment-detail-sample-body">
            <h2 id="sample-title"><FlaskIcon />Mẫu đầu vào</h2>
            <dl className="experiment-detail-values">
              <div><dt>Dung dịch HCl</dt><dd>{formatLitresAsMl(benchmark.acidVolumeL)}</dd></div>
              <div><dt>Nồng độ</dt><dd>{benchmark.acidConcentrationMolL.toLocaleString('vi-VN', { minimumFractionDigits: 5 })} mol/L</dd></div>
              <div><dt>Điều kiện</dt><dd>25 °C · 0,1 MPa</dd></div>
            </dl>
            <p className="experiment-detail-note">Thông số trên là mẫu chuẩn. Bạn có thể tùy chỉnh mẫu trong phạm vi cho phép khi bắt đầu.</p>
          </div>
        </section>

        <section className="experiment-detail-panel experiment-detail-process" aria-labelledby="process-title">
          <h2 id="process-title"><RepeatIcon />Bạn sẽ làm gì?</h2>
          <p>Chuẩn bị, thêm hóa chất, đo rồi quyết định bước tiếp theo. Mỗi lần thêm sẽ làm thay đổi mẫu.</p>
          <ol className="experiment-detail-steps">
            <li><div><h3>Chuẩn bị lượt thực hành</h3><p>Chọn mẫu chuẩn hoặc tùy chỉnh mẫu, dùng NaOH làm chất trung hòa và hiệu chuẩn máy đo pH.</p></div></li>
            <li><div><h3>Thêm một lượng NaOH</h3><p>Chọn thể tích mỗi lần thêm. Sau đó khuấy và chờ số đọc ổn định.</p></div></li>
            <li><div><h3>Đo và điều chỉnh</h3><p>Đọc pH* để chọn liều tiếp theo. Nếu vượt mục tiêu, có thể dùng HCl hiệu chỉnh rồi khuấy, chờ và đo lại.</p></div></li>
            <li><div><h3>Hoàn thành và đối chiếu</h3><p>Xem kết quả cuối cùng cùng lượng hóa chất và lịch sử thao tác của bạn.</p></div></li>
          </ol>
          <details className="experiment-detail-disclosure">
            <summary>Thao tác và điều kiện thực hiện <ArrowRightIcon /></summary>
            <div className="experiment-detail-expanded">
              <ul className="experiment-detail-action-list">{actions.map(action => <li key={action.actionType}><strong>{action.label}</strong><p>{action.precondition}</p></li>)}</ul>
              <p className="experiment-detail-note">Không hoàn tác phản ứng đã xảy ra. Chỉ có thể hoàn tác việc chọn chất trung hòa trước khi thêm bazơ.</p>
            </div>
          </details>
        </section>

        <section className="experiment-detail-panel experiment-detail-outcome" aria-labelledby="outcome-title">
          <h2 id="outcome-title"><LayersIcon />Kết quả bạn nhận được</h2>
          <ul className="experiment-detail-results">
            <li><span>pH cuối và mức đạt mục tiêu</span><p>Đối chiếu số đo cuối với dải mục tiêu; phân biệt đạt mục tiêu với điểm tổng.</p></li>
            <li><span>Lượng hóa chất đã dùng</span><p>Theo dõi lượng NaOH, HCl hiệu chỉnh và chỉ số chi phí tương đối.</p></li>
            <li><span>Lịch sử và đánh giá thao tác</span><p>Xem lại cách thực hiện, điểm thành phần và chỉ số an toàn sư phạm.</p></li>
          </ul>
          <details className="experiment-detail-disclosure">
            <summary>Cách đọc đánh giá <ArrowRightIcon /></summary>
            <div className="experiment-detail-expanded">
              <ul className="experiment-detail-score-list"><li>{acidText('scoring.ph-component')}</li><li>{acidText('scoring.resource-component')}</li><li>{acidText('scoring.process-component')}</li></ul>
              <p>{acidText('scoring.rubric-disclosure')}</p><p>{acidText('scoring.achievement-explanation')}</p><p>{acidText('scoring.success-explanation')}</p>
              <p>{acidText('resources.cost-index-explanation')}</p><p>{acidText('resources.safety-index-explanation')}</p>
            </div>
          </details>
        </section>

        <section className="experiment-detail-panel experiment-detail-parameters" aria-labelledby="parameters-title">
          <h2 id="parameters-title"><CalculatorIcon />Hóa chất và thông số</h2>
          <p>{acidText('routes.naoh.description')}</p>
          <dl className="experiment-detail-values">
            <div><dt>Thể tích mỗi lần thêm</dt><dd>{ACID_INPUT_DOMAIN.permittedAliquotsL.map(litres => (litres * 1000).toLocaleString('vi-VN')).join(' · ')} mL</dd></div>
            <div><dt>NaOH tối đa / mẫu chuẩn</dt><dd>{formatLitresAsMl(ACID_INPUT_DOMAIN.maxVolumeLByRoute.naoh)}</dd></div>
            <div><dt>HCl hiệu chỉnh tối đa / mẫu chuẩn</dt><dd>{formatLitresAsMl(ACID_INPUT_DOMAIN.maxCorrectionAcidVolumeL)}</dd></div>
          </dl>
          <p className="experiment-detail-note">Giới hạn tổng thể tích hóa chất thay đổi theo thể tích mẫu khi tùy chỉnh.</p>
          <details className="experiment-detail-disclosure">
            <summary>Phạm vi và giới hạn thao tác <ArrowRightIcon /></summary>
            <div className="experiment-detail-expanded">
              <dl className="experiment-detail-values">
                <div><dt>Thể tích mẫu HCl</dt><dd>{formatLitresAsMl(ACID_INPUT_DOMAIN.exploration.acidVolumeL.min)}–{formatLitresAsMl(ACID_INPUT_DOMAIN.exploration.acidVolumeL.max)}</dd></div>
                <div><dt>Nồng độ HCl</dt><dd>{ACID_INPUT_DOMAIN.exploration.acidConcentrationMolL.min.toLocaleString('vi-VN')}–{ACID_INPUT_DOMAIN.exploration.acidConcentrationMolL.max.toLocaleString('vi-VN')} mol/L</dd></div>
                <div><dt>Số lần thêm hóa chất tối đa</dt><dd>{limits.maxReagentAdditions}</dd></div>
                <div><dt>Số sự kiện tối đa mỗi lượt</dt><dd>{limits.maxAcceptedEvents}</dd></div>
              </dl>
              <h3>Các phương án chưa mở trên workbench</h3>
              <ul className="experiment-detail-action-list">{ACID_ROUTE_CHOICES.filter(route => route !== 'naoh').map(route => <li key={route}><strong>{acidText(`routes.${route}.label`)}</strong><p>{acidText(`routes.${route}.description`)}</p>{route === 'calcium-hydroxide' && <p>{acidText('routes.calcium-hydroxide.clarification')}</p>}<p>Giới hạn trong đặc tả với mẫu chuẩn: {formatLitresAsMl(ACID_INPUT_DOMAIN.maxVolumeLByRoute[route])}.</p></li>)}</ul>
            </div>
          </details>
        </section>

        <section className="experiment-detail-panel experiment-detail-safety" aria-labelledby="safety-title">
          <h2 id="safety-title"><ShieldCheckIcon />An toàn khi thực hành thật</h2>
          <p>Mô phỏng không thay thế hướng dẫn trong phòng thí nghiệm. Thực hành thật cần người phụ trách giám sát và phải tuân theo phiếu an toàn hóa chất (SDS), quy trình của cơ sở.</p>
          <ul className="experiment-detail-safety-list">
            <li><strong>Bảo hộ đầy đủ.</strong> Đeo kính chống bắn hóa chất, áo choàng, găng phù hợp và giày kín. Không hút pipet bằng miệng.</li>
            <li><strong>Thêm hóa chất từ từ khi khuấy.</strong> HCl và NaOH có nguy cơ ăn mòn, tổn thương mắt; xử lý tràn đổ theo quy trình của cơ sở.</li>
            <li><strong>Thu gom chất thải đúng quy định.</strong> Không tự ý đổ dung dịch xuống cống.</li>
            <li><strong>Lưu ý với carbonate.</strong> Phản ứng với axit có thể tạo CO₂; không đậy kín trong bình không được thiết kế chịu áp.</li>
          </ul>
          <p className="experiment-detail-note">Chỉ số an toàn trong báo cáo là quy ước sư phạm, không phải đánh giá rủi ro thực tế.</p>
        </section>

        <section className="experiment-detail-panel experiment-detail-limits" aria-labelledby="limits-title">
          <h2 id="limits-title"><WarningIcon />Hiểu đúng phạm vi mô phỏng</h2>
          <p>pH* được tính từ nồng độ H⁺ với hệ số hoạt độ bằng 1. Theo IUPAC, pH được định nghĩa theo hoạt độ H⁺; vì vậy pH* ở đây là kết quả mô phỏng, không phải số đo trong phòng thí nghiệm.</p>
          <ul>
            <li>Hệ carbonate được xem là kín, không trao đổi CO₂ với không khí. Trao đổi CO₂ ngoài thực tế có thể làm pH thay đổi đáng kể.</li>
            <li>Mô hình bỏ qua khả năng đệm, kim loại, phosphate, sulfate, chất hữu cơ, pha rắn và yếu tố sinh học.</li>
            <li>Không mô phỏng nhiệt phản ứng, truyền khối hay tốc độ phản ứng và khuấy. Bước chờ ổn định là quy tắc thao tác, không mô tả thời gian đáp ứng của máy đo thật.</li>
            <li>Không dùng kết quả để suy ra liều xử lý cho mẫu thật chưa biết thành phần. Mục tiêu pH phù hợp còn phụ thuộc thành phần mẫu, khả năng đệm và yêu cầu xử lý.</li>
          </ul>
          <p className="experiment-detail-note">{acidText('limitations.acid.constant-temperature-25c')}</p>
        </section>

        <section className="experiment-detail-panel experiment-detail-sources" aria-labelledby="sources-title">
          <div className="experiment-detail-sources-heading"><div><h2 id="sources-title"><BookIcon />Nguồn khoa học</h2><p>Định nghĩa, hằng số và hướng dẫn dùng trong mô hình.</p></div><Link href="/evidence">Xem sổ bằng chứng <ArrowRightIcon /></Link></div>
          <ul className="experiment-detail-source-links">{[
            { key: 'IUPAC-PH', label: 'Định nghĩa pH' },
            { key: 'IAPWS-KW-2024', label: 'Hằng số ion hóa nước' },
            { key: 'NIOSH-NAOH', label: 'An toàn với NaOH' },
          ].filter(({ key }) => manifest.sourceKeys.includes(key)).map(({ key, label }) => {
            const source = ACID_SOURCES[key]
            if (!source) return null
            return <li key={key}><a href={source.url} target="_blank" rel="noopener noreferrer"><span>{label}</span><ArrowRightIcon /><small>{source.title}</small></a></li>
          })}</ul>
          <details className="experiment-detail-disclosure" id="full-scientific-sources">
            <summary>Xem toàn bộ nguồn và bằng chứng ({manifest.sourceKeys.length} nguồn) <ArrowRightIcon /></summary>
            <div className="experiment-detail-expanded experiment-detail-register"><SourceList sourceKeys={manifest.sourceKeys} /><div className="experiment-detail-table-scroll" role="region" aria-label="Bảng tuyên bố và bằng chứng" tabIndex={0}><ClaimList claimKeys={manifest.claimKeys} /></div></div>
          </details>
          <details className="experiment-detail-disclosure">
            <summary>Phiên bản mô hình và độ chính xác hiển thị <ArrowRightIcon /></summary>
            <div className="experiment-detail-expanded">
              <dl className="experiment-detail-version">{([
                ['Bản phát hành', entry.releaseId], ['Mô hình', entry.modelSpecVersion], ['Chấm điểm', entry.scoringVersion], ['Nội dung', entry.contentVersion], ['Bằng chứng', entry.evidenceRegisterVersion], ['Projection', entry.projectionVersion], ['Ngôn ngữ', entry.locale],
              ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <p>pH* hiển thị {ACID_DISPLAY_FORMAT.phSummaryDecimals} chữ số thập phân ở tóm tắt, {ACID_DISPLAY_FORMAT.phTechnicalDecimals} ở phần công thức; thể tích {ACID_DISPLAY_FORMAT.volumeMlDecimals} chữ số. Làm tròn chỉ để hiển thị, không thay đổi trạng thái bên trong.</p>
            </div>
          </details>
        </section>
      </div>
      <div className="experiment-detail-start"><div><h2>Bắt đầu với mẫu chuẩn</h2><p>Thực hiện từng bước và xem kết quả từ chính các thao tác của bạn.</p></div><Link className="btn experiment-library-start" href={startHref}>Bắt đầu thực hành <ArrowRightIcon /></Link></div>
    </div>
  )
}

function acidText(key: keyof typeof ACID_STRINGS): string { return ACID_STRINGS[key] }

function DetailBackground() {
  return <svg className="experiment-detail-background" aria-hidden="true" focusable="false" width="1400" height="1800" viewBox="0 0 1400 1800" preserveAspectRatio="xMidYMin slice" fill="none">
    <g stroke="currentColor" strokeWidth="1" opacity="0.18"><path d="m1110 45 40-23 40 23v46l-40 23-40-23Zm80 0 40-23 40 23v46l-40 23-40-23Zm-40 69 40-23 40 23v46l-40 23-40-23Zm80 0 40-23 40 23v46l-40 23-40-23Z" /><path d="M1240 260h-96l-36 36h-80m246-116v210l-35 35v104M100 660v110l54 54v90H45m39 226 30-17 30 17v34l-30 17-30-17Zm60 0 30-17 30 17v34l-30 17-30-17Z" /><circle cx="1028" cy="296" r="4" /><circle cx="1239" cy="529" r="4" /><circle cx="45" cy="914" r="4" /></g>
    <g className="experiment-detail-background-nodes" fill="currentColor" opacity="0.16"><circle cx="1090" cy="200" r="2" /><circle cx="1320" cy="285" r="3" /><circle cx="80" cy="1040" r="2" /><circle cx="1270" cy="1560" r="2" /></g>
  </svg>
}
