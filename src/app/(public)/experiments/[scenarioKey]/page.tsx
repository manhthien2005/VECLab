import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { JAR_LIMITS, JAR_SOURCES } from '@/content/evidence/jar-test.js'
import { EXPERIMENT_OVERVIEWS } from '@/features/experiment-catalog/overviews.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ScienceBackdrop } from '@/shared/ui/science-backdrop.js'
import { JarLessonVideos } from '@/features/jar-test/lesson-videos.js'
import { ArrowRightIcon, CheckCircleIcon, FlaskIcon, LayersIcon, ShieldCheckIcon, BookIcon, RepeatIcon } from '@/features/landing/icons.js'

type Props = { params: Promise<{ scenarioKey: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scenarioKey } = await params
  const overview = EXPERIMENT_OVERVIEWS.find(item => item.scenarioKey === scenarioKey)
  return { title: overview?.title ?? 'Không tìm thấy bài thí nghiệm', description: overview?.question }
}

export default async function ExperimentDetailPage({ params }: Props) {
  const { scenarioKey } = await params
  const overview = EXPERIMENT_OVERVIEWS.find(item => item.scenarioKey === scenarioKey)
  if (!overview) notFound()
  const available = scenarioKey === 'jar-test'
  return <div className="page experiment-detail">
    <ScienceBackdrop />
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: overview.title }]} />
    <header className="experiment-detail-header"><div><div className="experiment-detail-tags"><span className="experiment-topic">{overview.category}</span><span className={'experiment-availability' + (available ? ' is-available' : '')}>{available ? 'Có thể thực hành · Lưu trên trình duyệt' : 'Chưa triển khai'}</span></div><h1>{overview.title}</h1><p>{overview.question}</p></div>{available && <Link className="btn experiment-library-start" href="/simulate/jar-test">Bắt đầu thực hành <ArrowRightIcon /></Link>}</header>
    {available && <JarLessonVideos />}
    {!available ? <section className="experiment-detail-panel"><h2>Chưa triển khai bài thực hành</h2><p>{overview.learning} Đây là hướng nội dung dự kiến; chưa có mô hình và quy trình được khóa để mở thực hành.</p><Link href="/experiments">Quay lại danh sách thí nghiệm</Link></section> : <div className="experiment-detail-grid">
      <section className="experiment-detail-panel experiment-detail-goal"><h2><CheckCircleIcon />Mục tiêu bài thực hành</h2><p>So sánh pH ban đầu và liều phèn nhôm để tìm phương án giảm độ đục ít nhất <strong>{JAR_PROFILE.goalRemovalPercent}%</strong>. Dùng số đo để tự tính hiệu suất và giải thích kết quả.</p>
        <dl className="experiment-detail-brief"><div><dt>Bạn được quyết định</dt><dd>pH ban đầu và tổng liều phèn của từng cốc.</dd></div><div><dt>Bạn cần nộp</dt><dd>Số đo, hiệu suất tự tính và một cốc làm phương án xử lý.</dd></div><div><dt>Phản hồi sau khi nộp</dt><dd>Đối chiếu đáp số, mức giảm đục và các bước cần xem lại.</dd></div></dl>
        <div className="experiment-detail-learning"><CheckCircleIcon /><p>Thiết kế mẫu so sánh, đọc số đo hợp lệ và nhận ra sai lệch trong phép tính.</p></div>
      </section>
      <section className="experiment-detail-panel experiment-detail-sample"><div className="experiment-detail-sample-image"><Image src={overview.image} alt={overview.imageAlt} fill sizes="(max-width: 60rem) 90vw, 30vw" loading="eager" /></div><div className="experiment-detail-sample-body"><h2><FlaskIcon />Mẫu đầu vào</h2><dl className="experiment-detail-values"><div><dt>Mẫu kaolin</dt><dd>{JAR_PROFILE.initialNtu} NTU</dd></div><div><dt>Thể tích mỗi cốc</dt><dd>{JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L</dd></div><div><dt>Số cốc</dt><dd>1–6 cốc A–F</dd></div><div><dt>Chất keo tụ</dt><dd>Phèn nhôm</dd></div></dl></div></section>
      <section className="experiment-detail-panel experiment-detail-process"><h2><RepeatIcon />Quy trình thực hành</h2><ol className="experiment-detail-steps"><li><div><h3>Chuẩn bị và đo mẫu đầu</h3><p>Chọn cốc, pH ban đầu và đo độ đục mẫu trước xử lý.</p></div></li><li><div><h3>Cấp phèn và chạy chương trình</h3><p>Chọn tổng liều, chạy khuấy nhanh, khuấy chậm rồi lắng. Các cốc dùng chung chương trình.</p></div></li><li><div><h3>Đo cuối và tự tính</h3><p>Đo độ đục từng cốc, tự tính phần trăm giảm đục và ghi đáp số.</p></div></li><li><div><h3>Chọn phương án và nộp</h3><p>Chọn một cốc để nộp. Báo cáo đối chiếu đáp số và chỉ ra những điểm cần xem lại.</p></div></li></ol><Link href="/experiments/jar-test/guide">Lý thuyết & hướng dẫn chi tiết <ArrowRightIcon /></Link></section>
      <section className="experiment-detail-panel experiment-detail-outcome"><h2><LayersIcon />Kết quả bạn nhận được</h2><ul className="experiment-detail-results"><li><span>NTU đầu và cuối từng cốc</span><p>Chỉ có số đo đã thực hiện. Phép đo sớm là N/A, không phải 0.</p></li><li><span>Hiệu suất và sai lệch đáp số</span><p>Đối chiếu phép tính sau khi nộp; phân biệt chọn điều kiện chưa đạt với tính toán sai.</p></li><li><span>Sổ đo, lịch sử và báo cáo</span><p>Lưu trên trình duyệt này, kể cả khi đăng nhập. Có thể mở lại từ lab.</p></li></ul></section>
      <section className="experiment-detail-panel experiment-detail-parameters"><h2><FlaskIcon />Điều kiện khảo sát</h2><dl className="experiment-detail-values"><div><dt>pH ban đầu</dt><dd>{JAR_PROFILE.availableInitialPh.join(' / ')}</dd></div><div><dt>Tổng liều phèn</dt><dd>{JAR_PROFILE.minDoseMgL}–{JAR_PROFILE.maxDoseMgL} mg/L</dd></div><div><dt>Bước liều</dt><dd>{JAR_PROFILE.doseStepMgL} mg/L</dd></div><div><dt>Khuấy nhanh</dt><dd>{JAR_PROFILE.phases.rapid.rpm} rpm · 60 giây</dd></div><div><dt>Khuấy chậm</dt><dd>{JAR_PROFILE.phases.slow.rpm} rpm · 20 phút</dd></div><div><dt>Lắng</dt><dd>30 phút mô phỏng</dd></div></dl></section>
      <section className="experiment-detail-panel experiment-detail-safety"><h2><ShieldCheckIcon />An toàn & phạm vi</h2><ul>{JAR_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul><p>Khi thực hành ngoài đời, tuân thủ hướng dẫn của giảng viên và quy định an toàn của phòng thí nghiệm.</p></section>
      <section className="experiment-detail-panel experiment-detail-sources"><h2><BookIcon />Nguồn khoa học</h2><p>Phương trình RSM và tài liệu quy trình Jar Test.</p><details className="experiment-detail-disclosure"><summary>Xem {JAR_SOURCES.length} tài liệu tham khảo <ArrowRightIcon /></summary><ul>{JAR_SOURCES.map(source => <li key={source.key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.author} · {source.kind}</p></li>)}</ul><Link href="/evidence">Cách sử dụng nguồn & giới hạn mô hình</Link></details></section>
    </div>}
  </div>
}
