import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { JAR_LIMITS, JAR_SOURCES } from '@/content/evidence/jar-test.js'
import { WATER_TREATMENT_PROFILE } from '@/domain/experiments/water-treatment/model.js'
import { WATER_TREATMENT_LIMITS, WATER_TREATMENT_SOURCES } from '@/content/evidence/water-treatment.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'
import { JarLessonVideos } from '@/features/jar-test/lesson-videos.js'
import { WaterTreatmentLessonVideos } from '@/features/water-treatment/lesson-videos.js'
import { ArrowRightIcon, CheckCircleIcon, FlaskIcon, LayersIcon, ShieldCheckIcon, BookIcon, RepeatIcon } from '@/features/landing/icons.js'

export async function generateMetadata({ params }: { params: Promise<{ scenarioKey: string }> }): Promise<Metadata> {
  const { scenarioKey } = await params
  const overview = EXPERIMENT_OVERVIEWS.find(item => item.scenarioKey === scenarioKey)
  return { title: overview?.title ?? 'Không tìm thấy bài thí nghiệm', description: overview?.question }
}

export default async function ExperimentDetailPage({ params }: { params: Promise<{ scenarioKey: string }> }) {
  const { scenarioKey } = await params
  const overview = EXPERIMENT_OVERVIEWS.find(item => item.scenarioKey === scenarioKey)
  if (!overview) notFound()

  const isJar = scenarioKey === 'jar-test'
  const isWaterTreatment = scenarioKey === 'water-treatment'
  const available = isJar || isWaterTreatment
  const title = overview.title
  const workbenchHref = isWaterTreatment ? '/simulate/water-treatment' : '/simulate/jar-test'

  return <div className="page experiment-detail">
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: title }]} />
    <header className="experiment-detail-header"><div><div className="experiment-detail-tags"><span className="experiment-topic">{overview.category}</span><span className={'experiment-availability' + (available ? ' is-available' : '')}>{available ? (isWaterTreatment ? 'Có bàn thực hành · Tiến trình trong bộ nhớ' : 'Có thể thực hành · Lưu trên trình duyệt') : 'Chưa triển khai'}</span></div><h1>{title}</h1><p>{overview.question}</p></div>{available && <Link className="btn experiment-library-start" href={workbenchHref}>Bắt đầu thực hành <ArrowRightIcon /></Link>}</header>
    {!available ? <section className="experiment-detail-panel"><h2>Chưa triển khai bài thực hành</h2><p>{overview.learning} Đây là hướng nội dung dự kiến; chưa có mô hình và quy trình được khóa để mở thực hành.</p><Link href="/experiments">Quay lại danh sách thí nghiệm</Link></section> : isWaterTreatment ? <WaterTreatmentDetail /> : <><JarLessonVideos /><JarTestDetail overview={overview} /></>}
  </div>
}

function WaterTreatmentDetail() {
  const profile = WATER_TREATMENT_PROFILE
  return <>
    <WaterTreatmentLessonVideos />
    <div className="experiment-detail-grid">
      <section className="experiment-detail-panel experiment-detail-goal"><h2><CheckCircleIcon />Mục tiêu bài thực hành</h2><p>Khảo sát ảnh hưởng của pH và các bước kết tủa, lắng, lọc đến nồng độ Fe, Zn, Pb; sau đó cân bằng pH và đối chiếu từng chỉ tiêu.</p><dl className="experiment-detail-brief"><div><dt>Bạn được quyết định</dt><dd>Thành phần và thể tích mẫu; lượng NaOH/HCl thêm theo từng giọt; thời điểm khuấy, lắng, lọc và đo.</dd></div><div><dt>Bạn cần kiểm tra</dt><dd>Nồng độ từng kim loại sau lọc và pH cuối trong phạm vi mục tiêu.</dd></div><div><dt>Cách đọc kết quả</dt><dd>Phân biệt chỉ tiêu pH với nồng độ kim loại; đối chiếu riêng từng ngưỡng.</dd></div></dl><div className="experiment-detail-learning"><CheckCircleIcon /><p>Liên hệ cân bằng hydroxide với xử lý nước và nhận biết giới hạn của mô hình.</p></div></section>
      <section className="experiment-detail-panel experiment-detail-sample"><div className="experiment-detail-sample-image"><Image src="/assets/experiments/water-treatment/FeCl3.jpg" alt="Sắt(III) chloride dùng làm muối cấp sắt cho mẫu mô phỏng" fill sizes="(max-width: 60rem) 90vw, 30vw" /></div><div className="experiment-detail-sample-body"><h2><FlaskIcon />Mẫu đầu vào</h2><dl className="experiment-detail-values"><div><dt>Sắt (Fe)</dt><dd>{profile.feRange.min}–{profile.feRange.max} mg/L</dd></div><div><dt>Kẽm (Zn)</dt><dd>{profile.znRange.min}–{profile.znRange.max} mg/L</dd></div><div><dt>Chì (Pb)</dt><dd>{profile.pbRange.min}–{profile.pbRange.max} mg/L</dd></div><div><dt>Thể tích</dt><dd>{profile.volumeRange.min.toLocaleString('vi-VN')}–{profile.volumeRange.max.toLocaleString('vi-VN')} mL</dd></div></dl><p className="experiment-detail-note">Mẫu tổng hợp phục vụ học tập, không đại diện cho mọi loại nước thải.</p></div></section>
      <section className="experiment-detail-panel experiment-detail-process"><h2><RepeatIcon />Quy trình thực hành</h2><ol className="experiment-detail-steps"><li><div><h3>Pha mẫu và đo pH đầu</h3><p>Chọn thành phần Fe, Zn, Pb và thể tích mẫu; đo pH trước khi thêm thuốc thử.</p></div></li><li><div><h3>Kết tủa hydroxide</h3><p>Thêm NaOH từng giọt, khuấy để đồng nhất và theo dõi điều kiện mẫu.</p></div></li><li><div><h3>Lắng và lọc</h3><p>Tách pha rắn hydroxide khỏi pha lỏng trước khi chuyển sang bước cân bằng pH.</p></div></li><li><div><h3>Cân bằng pH, đối chiếu</h3><p>Dùng NaOH hoặc HCl để điều chỉnh pH rồi xem riêng nồng độ từng kim loại.</p></div></li></ol><Link href="/experiments/water-treatment/guide">Lý thuyết, thao tác và thuật ngữ <ArrowRightIcon /></Link></section>
      <section className="experiment-detail-panel experiment-detail-outcome"><h2><LayersIcon />Mục tiêu đối chiếu</h2><ul className="experiment-detail-results"><li><span>Nồng độ Fe</span><p>≤ {profile.qcvnLimits.fe.toLocaleString('vi-VN')} mg/L.</p></li><li><span>Nồng độ Zn</span><p>≤ {profile.qcvnLimits.zn.toLocaleString('vi-VN')} mg/L.</p></li><li><span>Nồng độ Pb</span><p>≤ {profile.qcvnLimits.pb.toLocaleString('vi-VN')} mg/L.</p></li><li><span>pH cuối</span><p>{profile.phOperatingMin}–{profile.phOperatingMax}.</p></li></ul><p className="experiment-detail-note">Các ngưỡng này là mục tiêu học tập tham chiếu Cột A, không xác nhận nước thật đạt quy chuẩn.</p></section>
      <section className="experiment-detail-panel experiment-detail-parameters"><h2><FlaskIcon />Điều kiện khảo sát</h2><dl className="experiment-detail-values"><div><dt>Nhiệt độ mô hình</dt><dd>25 °C</dd></div><div><dt>Khoảng pH</dt><dd>{profile.phOperatingMin}–{profile.phOperatingMax}</dd></div><div><dt>Thể tích mặc định</dt><dd>{profile.volumeDefault.toLocaleString('vi-VN')} mL</dd></div><div><dt>Thuốc thử</dt><dd>NaOH và HCl cấp sẵn</dd></div></dl></section>
      <section className="experiment-detail-panel experiment-detail-safety"><h2><ShieldCheckIcon />An toàn & phạm vi mô phỏng</h2><ul className="experiment-detail-safety-list">{WATER_TREATMENT_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul><p className="experiment-detail-note">Khi thực hành ngoài phòng thí nghiệm ảo, dùng bảo hộ và làm theo quy trình của giảng viên; không tự pha hoặc xử lý hóa chất theo các giá trị trong mô phỏng.</p></section>
      <section className="experiment-detail-panel experiment-detail-sources"><h2><BookIcon />Nguồn & giới hạn mô hình</h2><p>Tài liệu tham khảo cung cấp bối cảnh phương pháp, quy chuẩn và cơ sở mô hình; chúng không xác nhận hiệu năng hay hệ số của VECLab.</p><details className="experiment-detail-disclosure"><summary>Xem {WATER_TREATMENT_SOURCES.length} tài liệu tham khảo <ArrowRightIcon /></summary><ul>{WATER_TREATMENT_SOURCES.map(source => <li key={source.key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.author} · {source.kind}</p><p>{source.use}</p><p>{source.limit}</p></li>)}</ul><Link href="/evidence">Cách sử dụng nguồn & giới hạn mô hình</Link></details></section>
    </div>
    <footer className="experiment-detail-start"><div><h2>Sẵn sàng bắt đầu?</h2><p>Tiến trình bài này hiện chỉ giữ trong bộ nhớ trong lúc thực hành.</p></div><Link className="btn experiment-library-start" href="/simulate/water-treatment">Vào bàn thực hành <ArrowRightIcon /></Link></footer>
  </>
}

function JarTestDetail({ overview }: { overview: (typeof EXPERIMENT_OVERVIEWS)[number] }) {
  return <div className="experiment-detail-grid">
    <section className="experiment-detail-panel experiment-detail-goal"><h2><CheckCircleIcon />Mục tiêu bài thực hành</h2><p>So sánh pH ban đầu và liều phèn nhôm để tìm phương án giảm độ đục ít nhất <strong>{JAR_PROFILE.goalRemovalPercent}%</strong>. Dùng số đo để tự tính hiệu suất và giải thích kết quả.</p><dl className="experiment-detail-brief"><div><dt>Bạn được quyết định</dt><dd>pH ban đầu và tổng liều phèn của từng cốc.</dd></div><div><dt>Bạn cần nộp</dt><dd>Số đo, hiệu suất tự tính và một cốc làm phương án xử lý.</dd></div><div><dt>Phản hồi sau khi nộp</dt><dd>Đối chiếu đáp số, mức giảm đục và các bước cần xem lại.</dd></div></dl><div className="experiment-detail-learning"><CheckCircleIcon /><p>Thiết kế mẫu so sánh, đọc số đo hợp lệ và nhận ra sai lệch trong phép tính.</p></div></section>
    <section className="experiment-detail-panel experiment-detail-sample"><div className="experiment-detail-sample-image"><Image src={overview.image} alt={overview.imageAlt} fill sizes="(max-width: 60rem) 90vw, 30vw" loading="eager" /></div><div className="experiment-detail-sample-body"><h2><FlaskIcon />Mẫu đầu vào</h2><dl className="experiment-detail-values"><div><dt>Mẫu kaolin</dt><dd>{JAR_PROFILE.initialNtu} NTU</dd></div><div><dt>Thể tích mỗi cốc</dt><dd>{JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L</dd></div><div><dt>Số cốc</dt><dd>1–6 cốc A–F</dd></div><div><dt>Chất keo tụ</dt><dd>Phèn nhôm</dd></div></dl></div></section>
    <section className="experiment-detail-panel experiment-detail-process"><h2><RepeatIcon />Quy trình thực hành</h2><ol className="experiment-detail-steps"><li><div><h3>Chuẩn bị và đo mẫu đầu</h3><p>Chọn cốc, pH ban đầu và đo độ đục mẫu trước xử lý.</p></div></li><li><div><h3>Cấp phèn và chạy chương trình</h3><p>Chọn tổng liều, chạy khuấy nhanh, khuấy chậm rồi lắng. Các cốc dùng chung chương trình.</p></div></li><li><div><h3>Đo cuối và tự tính</h3><p>Đo độ đục từng cốc, tự tính phần trăm giảm đục và ghi đáp số.</p></div></li><li><div><h3>Chọn phương án và nộp</h3><p>Chọn một cốc để nộp. Báo cáo đối chiếu đáp số và chỉ ra những điểm cần xem lại.</p></div></li></ol><Link href="/experiments/jar-test/guide">Lý thuyết & hướng dẫn chi tiết <ArrowRightIcon /></Link></section>
    <section className="experiment-detail-panel experiment-detail-outcome"><h2><LayersIcon />Kết quả bạn nhận được</h2><ul className="experiment-detail-results"><li><span>NTU đầu và cuối từng cốc</span><p>Chỉ có số đo đã thực hiện. Phép đo sớm là N/A, không phải 0.</p></li><li><span>Hiệu suất và sai lệch đáp số</span><p>Đối chiếu phép tính sau khi nộp; phân biệt chọn điều kiện chưa đạt với tính toán sai.</p></li><li><span>Sổ đo, lịch sử và báo cáo</span><p>Lưu trên trình duyệt này, kể cả khi đăng nhập. Có thể mở lại từ lab.</p></li></ul></section>
    <section className="experiment-detail-panel experiment-detail-parameters"><h2><FlaskIcon />Điều kiện khảo sát</h2><dl className="experiment-detail-values"><div><dt>pH ban đầu</dt><dd>{JAR_PROFILE.availableInitialPh.join(' / ')}</dd></div><div><dt>Tổng liều phèn</dt><dd>{JAR_PROFILE.minDoseMgL}–{JAR_PROFILE.maxDoseMgL} mg/L</dd></div><div><dt>Bước liều</dt><dd>{JAR_PROFILE.doseStepMgL} mg/L</dd></div><div><dt>Khuấy nhanh</dt><dd>{JAR_PROFILE.phases.rapid.rpm} rpm · 60 giây</dd></div><div><dt>Khuấy chậm</dt><dd>{JAR_PROFILE.phases.slow.rpm} rpm · 20 phút</dd></div><div><dt>Lắng</dt><dd>30 phút mô phỏng</dd></div></dl></section>
    <section className="experiment-detail-panel experiment-detail-safety"><h2><ShieldCheckIcon />An toàn & phạm vi</h2><ul>{JAR_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul><p>Khi thực hành ngoài đời, tuân thủ hướng dẫn của giảng viên và quy định an toàn của phòng thí nghiệm.</p></section>
    <section className="experiment-detail-panel experiment-detail-sources"><h2><BookIcon />Nguồn khoa học</h2><p>Phương trình RSM và tài liệu quy trình Jar Test.</p><details className="experiment-detail-disclosure"><summary>Xem {JAR_SOURCES.length} tài liệu tham khảo <ArrowRightIcon /></summary><ul>{JAR_SOURCES.map(source => <li key={source.key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.author} · {source.kind}</p></li>)}</ul><Link href="/evidence">Cách sử dụng nguồn & giới hạn mô hình</Link></details></section>
  </div>
}
