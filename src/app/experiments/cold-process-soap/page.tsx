import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SOAP_LIMITS, SOAP_SOURCES } from '@/content/evidence/soap.js'
import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { SoapLessonVideos } from '@/features/soap/lesson-videos.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'
import { ArrowRightIcon, BookIcon, CheckCircleIcon, FlaskIcon, LayersIcon, RepeatIcon, ShieldCheckIcon } from '@/features/landing/icons.js'

const REQ = SOAP_PROFILE.requirements
const overview = EXPERIMENT_OVERVIEWS.find(item => item.scenarioKey === 'cold-process-soap')!

export const metadata: Metadata = {
  title: 'Xà phòng hóa (cold process)',
  description: overview.question,
}

export default function SoapLessonPage() {
  return <div className="page experiment-detail">
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: overview.title }]} />
    <header className="experiment-detail-header">
      <div>
        <div className="experiment-detail-tags">
          <span className="experiment-topic">{overview.category}</span>
          <span className="experiment-availability is-available">Có thể thực hành · Lưu trên trình duyệt</span>
        </div>
        <h1>{overview.title}</h1>
        <p>{overview.question}</p>
      </div>
      <Link className="btn experiment-library-start" href="/simulate/cold-process-soap">Bắt đầu thực hành <ArrowRightIcon /></Link>
    </header>
    <SoapLessonVideos />
    <div className="experiment-detail-grid">
      <section className="experiment-detail-panel experiment-detail-goal">
        <h2><CheckCircleIcon />Mục tiêu bài thực hành</h2>
        <p>Tự tính lượng NaOH và nước theo dầu đã chọn, pha kiềm đúng chiều, trộn, đổ khuôn và đo mẫu. Một mẫu đạt mọi yêu cầu là thí nghiệm đạt.</p>
        <dl className="experiment-detail-brief">
          <div><dt>Bạn được quyết định</dt><dd>Loại dầu, thể tích dầu / nước, khối lượng NaOH, khuấy tay hoặc máy.</dd></div>
          <div><dt>Bạn cần nộp</dt><dd>Ít nhất một mẫu thử đã đo (hoặc ghi nhận thất bại an toàn nếu vỡ cốc).</dd></div>
          <div><dt>Phản hồi sau khi nộp</dt><dd>Đối chiếu nồng độ, nhiệt, superfat, đặc lại và pH từng mẫu.</dd></div>
        </dl>
        <div className="experiment-detail-learning"><CheckCircleIcon /><p>{overview.learning}</p></div>
      </section>
      <section className="experiment-detail-panel experiment-detail-sample">
        <div className="experiment-detail-sample-image">
          <Image src={overview.image} alt={overview.imageAlt} fill sizes="(max-width: 60rem) 90vw, 30vw" loading="eager" />
        </div>
        <div className="experiment-detail-sample-body">
          <h2><FlaskIcon />Mẫu đầu vào</h2>
          <dl className="experiment-detail-values">
            <div><dt>Dầu</dt><dd>Ô liu / dừa / cọ</dd></div>
            <div><dt>Kiềm</dt><dd>NaOH rắn + nước</dd></div>
            <div><dt>Nhiệt dầu</dt><dd>{SOAP_PROFILE.oilTemperatureC} °C</dd></div>
            <div><dt>Nhiệt phòng</dt><dd>{SOAP_PROFILE.roomTemperatureC} °C</dd></div>
          </dl>
        </div>
      </section>
      <section className="experiment-detail-panel experiment-detail-process">
        <h2><RepeatIcon />Quy trình thực hành</h2>
        <ol className="experiment-detail-steps">
          <li><div><h3>Pha dung dịch kiềm</h3><p>Rót nước vào cốc kiềm, rồi rót NaOH vào nước. Nguội kiềm trước khi đổ sang cốc trộn.</p></div></li>
          <li><div><h3>Chuẩn bị dầu và trộn</h3><p>Chọn loại dầu, rót dầu, đổ kiềm và dầu vào cốc trộn, khuấy rồi chờ dung dịch đặc lại.</p></div></li>
          <li><div><h3>Đổ khuôn, ủ và đo</h3><p>Đổ khuôn → chờ {SOAP_PROFILE.gelHours} giờ → tháo khuôn → đợi {SOAP_PROFILE.cureWeeks} tuần → đo pH và cân.</p></div></li>
          <li><div><h3>Hoàn thành và đọc báo cáo</h3><p>Tối đa {SOAP_PROFILE.maxSamples} mẫu. Một mẫu đạt mọi yêu cầu là đạt thí nghiệm.</p></div></li>
        </ol>
        <Link href="/experiments/cold-process-soap/guide">Lý thuyết & hướng dẫn chi tiết <ArrowRightIcon /></Link>
      </section>
      <section className="experiment-detail-panel experiment-detail-outcome">
        <h2><LayersIcon />Kết quả bạn nhận được</h2>
        <ul className="experiment-detail-results">
          <li><span>Chỉ số từng mẫu thử</span><p>Nồng độ kiềm, nhiệt, superfat, trạng thái đặc lại, pH và khối lượng. Thiếu phép đo hiện N/A.</p></li>
          <li><span>Tem đạt / chưa đạt</span><p>Phân biệt mẫu chưa đạt chất lượng với thất bại an toàn (vỡ cốc).</p></li>
          <li><span>Sổ đo và báo cáo</span><p>Lưu trên trình duyệt này. Có thể mở lại từ lab.</p></li>
        </ul>
      </section>
      <section className="experiment-detail-panel experiment-detail-parameters">
        <h2><FlaskIcon />Điều kiện khảo sát</h2>
        <dl className="experiment-detail-values">
          <div><dt>Nồng độ NaOH đạt</dt><dd>{Math.round(REQ.lyeConcentration.min * 100)}–{Math.round(REQ.lyeConcentration.max * 100)} %</dd></div>
          <div><dt>Nhiệt kiềm khi đổ</dt><dd>≤ {REQ.lyeTemperatureMaxC} °C</dd></div>
          <div><dt>ΔT kiềm–dầu</dt><dd>≤ {REQ.deltaTMaxC} °C</dd></div>
          <div><dt>Superfat đạt</dt><dd>{Math.round(REQ.superfat.min * 100)}–{Math.round(REQ.superfat.max * 100)} %</dd></div>
          <div><dt>pH sau ủ</dt><dd>{REQ.ph.min}–{REQ.ph.max}</dd></div>
          <div><dt>Số mẫu tối đa</dt><dd>{SOAP_PROFILE.maxSamples}</dd></div>
        </dl>
      </section>
      <section className="experiment-detail-panel experiment-detail-safety">
        <h2><ShieldCheckIcon />An toàn & phạm vi</h2>
        <ul>{SOAP_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul>
        <p>Khi thực hành ngoài đời, tuân thủ hướng dẫn của giảng viên và quy định an toàn của phòng thí nghiệm. NaOH ăn da và mắt.</p>
      </section>
      <section className="experiment-detail-panel experiment-detail-sources">
        <h2><BookIcon />Nguồn khoa học</h2>
        <p>Chỉ liệt kê nguồn trạng thái A (có URL). Các giả định game không gắn như đã xác nhận.</p>
        <details className="experiment-detail-disclosure">
          <summary>Xem {SOAP_SOURCES.length} tài liệu tham khảo <ArrowRightIcon /></summary>
          <ul>{SOAP_SOURCES.map(source => <li key={source.key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.author} · {source.kind}</p></li>)}</ul>
          <Link href="/evidence">Cách sử dụng nguồn & giới hạn mô hình</Link>
        </details>
      </section>
    </div>
  </div>
}
