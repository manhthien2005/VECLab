import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PLASTIC_PROFILE, VIRGIN_POLYMERS } from '@/domain/experiments/virgin-plastic-separation/model.js'
import { PLASTIC_SOURCES } from '@/content/evidence/plastic-density-separation.js'
import { PLASTIC_LESSON_LIMITS, PLASTIC_SOURCE_NOTE } from '@/features/plastic-separation/lesson-content.js'
import { PLASTIC_OVERVIEW } from '@/features/experiment-catalog/overviews.js'
import { listCatalog } from '@/features/experiment-catalog/catalog.js'
import { PlasticLessonVideos } from '@/features/plastic-separation/lesson-videos.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'
import { ArrowRightIcon, CheckCircleIcon, FlaskIcon, LayersIcon, ShieldCheckIcon, BookIcon, RepeatIcon } from '@/features/landing/icons.js'

export const metadata: Metadata = {
  title: PLASTIC_OVERVIEW.title,
  description: PLASTIC_OVERVIEW.question,
}

const GUIDE_HREF = '/experiments/plastic-density-separation/guide'
const WORKBENCH_HREF = '/simulate/plastic-density-separation'
const STEPS = [
  { title: 'Chuẩn bị mẫu và làm ướt', description: 'Chuẩn bị sáu mẫu nhựa, nạp bể và ghi nhận điều kiện làm ướt theo hồ sơ nghiên cứu.' },
  { title: 'Tách sơ bộ, ly tâm và cân', description: 'Tách nhóm nổi và chìm trong nước máy. Ly tâm tách ẩm rồi cân phân đoạn trước khi xử lý tiếp.' },
  { title: 'Phân loại theo nhánh dung dịch', description: 'Chọn nhánh ethanol hoặc NaCl để làm trước. Thực hiện lần lượt các mức nồng độ đã cho, ly tâm và cân giữa các bước.' },
  { title: 'Tổng kết và đọc báo cáo', description: 'Hoàn thành cả hai nhánh để mở tổng kết. Đối chiếu các phân đoạn, khối lượng đã ghi nhận và tỷ lệ thu hồi theo hồ sơ.' },
]

export default function PlasticSeparationLessonPage() {
  const available = listCatalog().some(entry => entry.scenarioKey === PLASTIC_OVERVIEW.scenarioKey)
  const sources = Object.values(PLASTIC_SOURCES)

  return <div className="page experiment-detail">
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: PLASTIC_OVERVIEW.title }]} />
    <header className="experiment-detail-header">
      <div>
        <div className="experiment-detail-tags">
          <span className="experiment-topic">{PLASTIC_OVERVIEW.category}</span>
          <span className={'experiment-availability' + (available ? ' is-available' : '')}>{available ? 'Có thể thực hành · Lưu trên trình duyệt' : 'Chưa triển khai'}</span>
        </div>
        <h1>{PLASTIC_OVERVIEW.title}</h1>
        <p>{PLASTIC_OVERVIEW.question}</p>
      </div>
      {available && <Link className="btn experiment-library-start" href={WORKBENCH_HREF}>Bắt đầu thực hành <ArrowRightIcon /></Link>}
    </header>
    <PlasticLessonVideos />
    <div className="experiment-detail-grid">
      <section className="experiment-detail-panel experiment-detail-goal">
        <h2><CheckCircleIcon />Mục tiêu bài thực hành</h2>
        <p>Tìm hiểu cách phân loại sáu loại nhựa nguyên sinh dựa trên khối lượng riêng. Theo dõi nhóm nổi và chìm qua nước máy, dung dịch ethanol và NaCl, rồi đọc kết quả thu hồi ở các mức nồng độ đã cho.</p>
        <dl className="experiment-detail-brief">
          <div><dt>Bạn được quyết định</dt><dd>Chọn nhánh ethanol hoặc NaCl để làm trước; nồng độ và điều kiện vận hành đã được đặt sẵn.</dd></div>
          <div><dt>Bạn cần ghi nhận</dt><dd>Phân đoạn nổi–chìm, khối lượng sau ly tâm và kết quả của từng nhánh đã làm.</dd></div>
          <div><dt>Phản hồi khi hoàn tất</dt><dd>Sơ đồ phân loại, tổng kết phân đoạn và báo cáo của lượt thực hành.</dd></div>
        </dl>
        <div className="experiment-detail-learning"><CheckCircleIcon /><p>{PLASTIC_OVERVIEW.learning}</p></div>
      </section>
      <section className="experiment-detail-panel experiment-detail-sample">
        <div className="experiment-detail-sample-image"><Image src={PLASTIC_OVERVIEW.image} alt={PLASTIC_OVERVIEW.imageAlt} fill sizes="(max-width: 60rem) 90vw, 30vw" /></div>
        <div className="experiment-detail-sample-body">
          <h2><FlaskIcon />Mẫu đầu vào</h2>
          <dl className="experiment-detail-values">
            <div><dt>Nhựa nguyên sinh</dt><dd>{VIRGIN_POLYMERS.map(polymer => polymer.id).join(', ')}</dd></div>
            <div><dt>Khối lượng mỗi loại</dt><dd>{PLASTIC_PROFILE.sampleFeedMassKg.toLocaleString('vi-VN', { minimumFractionDigits: 1 })} kg</dd></div>
            <div><dt>Môi trường phân tách</dt><dd>Nước máy, dung dịch ethanol và NaCl</dd></div>
          </dl>
        </div>
      </section>
      <section className="experiment-detail-panel experiment-detail-process">
        <h2><RepeatIcon />Quy trình thực hành</h2>
        <ol className="experiment-detail-steps">{STEPS.map(step => <li key={step.title}><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
        <details className="experiment-detail-disclosure">
          <summary>Dụng cụ và kiến thức cần có <ArrowRightIcon /></summary>
          <dl className="experiment-detail-brief">
            <div><dt>Dụng cụ</dt><dd>{PLASTIC_OVERVIEW.tools}</dd></div>
            <div><dt>Kiến thức cơ bản</dt><dd>{PLASTIC_OVERVIEW.prerequisites}</dd></div>
          </dl>
        </details>
        <Link href={GUIDE_HREF}>Lý thuyết & hướng dẫn chi tiết <ArrowRightIcon /></Link>
      </section>
      <section className="experiment-detail-panel experiment-detail-outcome">
        <h2><LayersIcon />Kết quả bạn nhận được</h2>
        <ul className="experiment-detail-results">
          <li><span>Phân đoạn qua từng môi trường</span><p>Quan sát nhóm nổi và chìm ở từng mức nồng độ đã thực hiện.</p></li>
          <li><span>Khối lượng và tỷ lệ thu hồi</span><p>Khối lượng được quy đổi từ dữ liệu tham khảo sau bước ly tâm và cân; không phải phép đo mới.</p></li>
          <li><span>Sổ thực hành và báo cáo</span><p>Lưu trên trình duyệt này. Nhánh chưa thực hiện không được coi là đã có kết quả.</p></li>
        </ul>
      </section>
      <section className="experiment-detail-panel experiment-detail-parameters">
        <h2><FlaskIcon />Điều kiện khảo sát</h2>
        <dl className="experiment-detail-values">
          <div><dt>Bể phân tách pilot</dt><dd>{PLASTIC_PROFILE.pilotTankVolumeLiters} L hữu ích · quy mô thử nghiệm</dd></div>
          <div><dt>Làm ướt mẫu</dt><dd>{PLASTIC_PROFILE.wettingStirringRpm} rpm · {PLASTIC_PROFILE.wettingDurationHours} giờ theo hồ sơ</dd></div>
          <div><dt>Ly tâm tách ẩm</dt><dd>{PLASTIC_PROFILE.centrifugeRpm.toLocaleString('vi-VN')} rpm</dd></div>
          <div><dt>Nồng độ ethanol</dt><dd>23 / 31% v/v</dd></div>
          <div><dt>Nồng độ NaCl</dt><dd>11–12 / 20 / 40% w/v</dd></div>
        </dl>
        <p>Các điều kiện được đặt sẵn theo hồ sơ nghiên cứu. Thời gian 1 giờ là điều kiện tham khảo; bạn không cần chờ đủ 1 giờ ngoài thực tế.</p>
      </section>
      <section className="experiment-detail-panel experiment-detail-safety">
        <h2><ShieldCheckIcon />An toàn & phạm vi</h2>
        <ul>{PLASTIC_LESSON_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul>
        <p>Khi thực hành ngoài đời, tuân thủ hướng dẫn của giảng viên, bảo hộ và quy định an toàn hóa chất, thiết bị. Ethanol dễ cháy; mô phỏng không thay thế quy trình vận hành thực tế.</p>
      </section>
      <section className="experiment-detail-panel experiment-detail-sources" id="plastic-sources">
        <h2><BookIcon />Nguồn khoa học</h2>
        <p>Thông số thiết bị, nồng độ và tỷ lệ thu hồi tham khảo từ nghiên cứu phân tách nhựa dựa trên khối lượng riêng.</p>
        <details className="experiment-detail-disclosure">
          <summary>Xem tài liệu tham khảo <ArrowRightIcon /></summary>
          <ul>{sources.map(source => <li key={source.key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.authorsOrOrganization} · {source.year}</p><p>Phần sử dụng: {source.locations.join(', ')}.</p></li>)}</ul>
          <p>Kiểm tra số học và khả năng tái hiện phần mềm không thay thế kiểm chứng thực nghiệm.</p>
          <p>{PLASTIC_SOURCE_NOTE}</p>
        </details>
      </section>
    </div>
  </div>
}
