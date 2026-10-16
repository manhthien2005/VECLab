import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { parseUUID } from '@/shared/ids.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { JAR_SOURCES } from '@/content/evidence/jar-test.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import styles from '@/features/experiment-guide/article.module.css'

export const metadata: Metadata = {
  title: 'Jar Test: lý thuyết & cách làm bài',
  description: 'Hướng dẫn Jar Test từng bước, có ảnh thao tác, video ngắn, cách ghi số đo và đọc báo cáo.',
  robots: { index: false, follow: false },
}

type GuideStep = {
  id: string; title: string; tool: string; location: string; before: string
  actions: string[]; output: string; why: string
  image?: { file: string; width: number; height: number; alt: string; caption: string }
}
const STEPS: GuideStep[] = [
  {
    id: 'jar-step-baseline', title: 'Đo mẫu ban đầu', tool: 'Máy đo độ đục', location: 'Thao tác → Đo mẫu ban đầu',
    before: 'Bắt đầu một lượt mới. Mẫu kaolin chưa cấp phèn được dùng chung làm mốc cho cả mẻ.',
    actions: ['Mở nhóm Đo mẫu ban đầu trong bảng Thao tác.', 'Bấm Đo mẫu ban đầu. Mở Sổ đo để kiểm tra số NTU vừa lưu.'],
    output: 'Có một số đo mẫu đầu trong Sổ thực hành. Chỉ đo một lần cho cả mẻ, không đo lại cho từng cốc.',
    why: 'Hiệu suất được tính từ NTU đầu và cuối. Thiếu số đo đầu thì chưa có cơ sở đối chiếu mức giảm đục.',
    image: { file: 'baseline', width: 552, height: 676, alt: 'Nhóm Đo mẫu ban đầu với trạng thái Chưa đo và nút đo bên dưới', caption: 'Bấm nút đo trong Thao tác; Sổ đo là nơi xem lại số liệu.' },
  },
  {
    id: 'jar-step-prepare', title: 'Chuẩn bị các cốc muốn so sánh', tool: 'Dàn cốc và mẫu kaolin', location: 'Chọn cốc → Thao tác → Chuẩn bị mẫu',
    before: 'Chọn 1–6 cốc A–F để khảo sát. Mỗi cốc nhận cùng 0,5 L mẫu.',
    actions: ['Chọn cốc trên dàn hoặc tại ô Cốc đang thao tác.', 'Chọn pH ban đầu 5, 7 hoặc 9 rồi bấm Chuẩn bị cốc.', 'Lặp lại cho các cốc khác. Khi so sánh liều, giữ cùng pH; khi so sánh pH, giữ cùng liều.'],
    output: 'Cốc hiển thị pH đã chọn và đã có mẫu; tổng liều phèn vẫn là 0 mg/L.',
    why: 'pH là điều kiện đầu của mẫu đã chuẩn bị sẵn, không phải pH cuối. Hoàn tất thiết kế các cốc trước khi chạy khuấy; có thể dùng từ một cốc, nhưng nhiều cốc giúp so sánh rõ hơn.',
    image: { file: 'prepare', width: 552, height: 644, alt: 'Ô chọn pH ban đầu và nút Chuẩn bị cốc A trong nhóm Chuẩn bị mẫu', caption: 'pH 7 trong hình chỉ minh họa cách chọn điều kiện, không phải đáp án bắt buộc.' },
  },
  {
    id: 'jar-step-dose', title: 'Cấp phèn cho từng cốc', tool: 'Phèn nhôm', location: 'Chọn cốc → Thao tác → Cấp phèn',
    before: 'Cốc đã được chuẩn bị. Tổng liều khảo sát là 50–250 mg/L, theo bước 50 mg/L.',
    actions: ['Kiểm tra cốc đang chọn và Tổng liều hiện tại.', 'Chọn Liều tăng; xem dòng Sau khi thêm rồi bấm Thêm vào cốc.', 'Lặp lại với các cốc còn lại. Mọi cốc đã chuẩn bị cần ít nhất 50 mg/L trước khi chạy mẻ.'],
    output: 'Tổng liều được cập nhật riêng cho đúng cốc vừa cấp.',
    why: 'Liều tăng được cộng dồn: thêm 50 rồi 100 mg/L tạo tổng 150 mg/L. mg/L là liều theo thể tích; với 0,5 L mẫu, liều 100 mg/L tương ứng 50 mg phèn.',
    image: { file: 'dose', width: 552, height: 840, alt: 'Nhóm Cấp phèn hiển thị tổng liều, liều tăng và tổng dự kiến sau khi thêm', caption: 'Đọc cả tổng hiện tại và tổng sau khi thêm để tránh nhầm liều tăng với tổng liều.' },
  },
  {
    id: 'jar-step-program', title: 'Rà soát và chạy chung cả mẻ', tool: 'Dàn khuấy Jar Test', location: 'Thao tác → Khuấy & lắng',
    before: 'Đã đo mẫu đầu, chuẩn bị và cấp phèn cho tất cả cốc muốn so sánh.',
    actions: ['Bấm Chạy khuấy nhanh. Rà bảng pH và tổng liều của các cốc trong hộp xác nhận.', 'Nếu cần chỉnh, chọn Tiếp tục chỉnh các cốc. Khi sẵn sàng, bấm Bắt đầu khuấy cả mẻ.', 'Tiếp tục chạy Khuấy chậm rồi Lắng theo thứ tự.'],
    output: 'Cả dàn cùng hoàn tất ba pha. pH và liều được khóa từ khi bắt đầu khuấy.',
    why: 'Chương trình dùng chung để các cốc có điều kiện so sánh tương đương. Chọn A không làm máy chỉ chạy riêng A. Đây là thời gian mô phỏng, không cần chờ đủ số phút ngoài đời.',
    image: { file: 'program', width: 960, height: 378, alt: 'Hộp Chạy chương trình chung để kiểm tra các cốc trước khi xác nhận chạy cả mẻ', caption: 'Bảng này là điểm kiểm tra cuối trước khi pH và liều bị khóa. Các giá trị trong hình chỉ là ví dụ.' },
  },
  {
    id: 'jar-step-measure', title: 'Đo cuối từng cốc', tool: 'Máy đo độ đục', location: 'Chọn cốc → Thao tác → Đo & ghi kết quả',
    before: 'Mẻ đã hoàn tất khuấy nhanh, khuấy chậm và lắng.',
    actions: ['Chọn cốc cần đo rồi bấm Đo độ đục cuối cốc.', 'Lần lượt chọn và đo các cốc còn lại. Kiểm tra đúng hàng cốc trong Sổ đo.'],
    output: 'Mỗi cốc có số NTU cuối và bước đo riêng trong Sổ thực hành.',
    why: 'Đo A không đo hộ B/C và không kết thúc lượt. Nếu đo sớm, số đo được lưu là N/A; sau khi lắng xong có thể đo lại. Chưa đo và N/A đều không phải 0 NTU.',
    image: { file: 'results', width: 552, height: 1136, alt: 'Bảng Đo và ghi kết quả với nút đo cuối, ô tự tính và nút chọn cốc để nộp', caption: 'Đo, ghi đáp số và chọn phương án là ba thao tác riêng trong cùng một nhóm.' },
  },
  {
    id: 'jar-step-calculation', title: 'Tự tính và ghi hiệu suất', tool: 'Sổ thực hành và ô ghi đáp số', location: 'Thao tác → Đo & ghi kết quả',
    before: 'Có NTU đầu và NTU cuối hợp lệ của đúng cốc đang tính.',
    actions: ['Tính phần trăm giảm đục theo công thức bên dưới.', 'Nhập Phần trăm giảm đục tự tính (%) rồi bấm Ghi đáp số cốc.', 'Kiểm tra dòng Đáp số đã lưu. Lặp lại cho từng cốc đã thử.'],
    output: 'Đáp số được lưu với đúng cốc. Nội dung chỉ đang nhập trong ô chưa được nộp cùng bài.',
    why: 'Tách phép đo và phép tính giúp phân biệt điều kiện xử lý chưa phù hợp với việc dùng sai số liệu hoặc tính toán sai.',
  },
  {
    id: 'jar-step-selection', title: 'So sánh và chọn phương án', tool: 'Bảng số đo của các cốc', location: 'Sổ đo → chọn cốc → Thao tác',
    before: 'Đã đo và ghi đáp số của các cốc muốn so sánh.',
    actions: ['So sánh NTU cuối, pH và tổng liều giữa các cốc.', 'Chọn cốc muốn nộp rồi bấm Dùng cốc này để nộp trong Đo & ghi kết quả.', 'Kiểm tra dòng Phương án nộp đã hiển thị đúng cốc.'],
    output: 'Một cốc được đánh dấu là phương án nộp. Lượt vẫn mở để bạn rà soát.',
    why: 'Mục tiêu chính đánh giá cốc đã chọn. Các cốc khác là bằng chứng so sánh; không bắt buộc mọi cốc đều đạt 80%. Chọn phương án chưa khóa lượt.',
  },
  {
    id: 'jar-step-submit', title: 'Nộp và đọc báo cáo', tool: 'Bảng rà soát và báo cáo kết quả', location: 'Nộp bài → Xác nhận nộp bài',
    before: 'Kiểm tra số đo đầu, số đo cuối, đáp số đã ghi và cốc làm phương án nộp.',
    actions: ['Bấm Nộp bài và đọc các mục còn thiếu trong bảng rà soát.', 'Đóng bảng để bổ sung nếu cần. Khi sẵn sàng, bấm Xác nhận nộp bài.', 'Đọc kết quả từng cốc, sai lệch phép tính và các điểm cần xem lại trong báo cáo.'],
    output: 'Lượt được khóa, báo cáo lưu cố định. Có thể xem lại số đo và lịch sử thao tác.',
    why: 'Bạn vẫn có thể nộp thiếu dữ liệu, nhưng phần thiếu không được coi là 0 hoặc tự bổ sung. Báo cáo giúp phân biệt thiếu quy trình, sai phép tính và điều kiện chưa đạt mục tiêu.',
  },
]

const EQUIPMENT = [
  { file: 'kaolin', name: 'Mẫu kaolin', alt: 'Khoáng kaolin màu trắng', purpose: 'Mẫu nước đục cần khảo sát; 0,5 L cho mỗi cốc.', note: 'Ảnh khoáng kaolin, không phải mẫu nước đã pha.', author: 'USGS / Minerals in Your World', license: 'Phạm vi công cộng', source: 'https://commons.wikimedia.org/wiki/File:Kaolin.jpg', licenseUrl: 'https://commons.wikimedia.org/wiki/File:Kaolin.jpg#Licensing' },
  { file: 'aluminium-sulfate', name: 'Phèn nhôm', alt: 'Tinh thể nhôm sulfat màu trắng', purpose: 'Chất keo tụ; cấp theo tổng liều mg/L của từng cốc.', note: 'Ảnh tinh thể; bài biểu diễn lượng cấp bằng liều quy đổi.', author: 'Chemicalinterest', license: 'Phạm vi công cộng', source: 'https://commons.wikimedia.org/wiki/File:Aluminium_sulfate_crystals.JPG', licenseUrl: 'https://commons.wikimedia.org/wiki/File:Aluminium_sulfate_crystals.JPG#Licensing' },
  { file: 'turbidimeters', name: 'Máy đo độ đục', alt: 'Máy đo độ đục trong hệ thống xử lý nước', purpose: 'Đọc NTU mẫu đầu và NTU cuối sau xử lý.', note: 'Ảnh thiết bị thực tế; máy trên VECLab được giản lược.', author: 'Z22', license: 'CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Turbidimeters.JPG', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
]
const TERMS = [
  ['Độ đục · NTU', 'Đại lượng đọc bằng máy đo. NTU cuối thấp hơn NTU đầu cho thấy độ đục giảm, không chứng minh đã loại hết chất ô nhiễm.'],
  ['pH ban đầu', 'Điều kiện axit–bazơ trước xử lý: 5, 7 hoặc 9. Bài không mô phỏng tự pha axit/bazơ hay đo pH cuối.'],
  ['Keo tụ và tạo bông', 'Phèn hỗ trợ các hạt dễ kết hợp hơn; khuấy nhanh phân tán hóa chất, khuấy chậm hỗ trợ tạo bông.'],
  ['Lắng', 'Dừng khuấy để bông có thể lắng xuống. Đo cuối sau khi hoàn tất chương trình.'],
  ['Hiệu suất giảm đục · %', 'Tỷ lệ giảm NTU so với mẫu đầu; khác với liều phèn mg/L.'],
  ['Độ lệch · điểm %', 'Chênh lệch tuyệt đối giữa hai tỷ lệ. 80% và 78% lệch 2 điểm %, không phải sai số tương đối 2%.'],
]

export default async function JarGuidePage({ searchParams }: { searchParams: Promise<{ attempt?: string | string[] }> }) {
  const { attempt } = await searchParams
  const id = typeof attempt === 'string' ? parseUUID(attempt) : null
  const workbenchHref = '/simulate/jar-test' + (id ? '?attempt=' + encodeURIComponent(id) : '')
  const targetNtu = JAR_PROFILE.initialNtu * (1 - JAR_PROFILE.goalRemovalPercent / 100)
  return <div className={'page ' + styles.guide}>
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: 'Jar Test', href: '/experiments/jar-test' }, { label: 'Lý thuyết & cách làm' }]} />
    <header className={styles.header}>
      <div><h1>Jar Test: lý thuyết & cách làm bài</h1><p>Từ chuẩn bị dàn cốc đến đọc báo cáo. Mỗi bước chỉ rõ công cụ, thao tác và kết quả cần kiểm tra trên VECLab.</p></div>
      <Link className={styles.returnLink} href={workbenchHref}>{id ? 'Quay lại lượt đang làm' : 'Bắt đầu thực hành'}<ArrowRightIcon /></Link>
    </header>
    <div className={styles.readingLayout}>
      <aside className={styles.rail}><nav className={styles.contents} aria-label="Tra nhanh các bước"><h2>Tra nhanh các bước</h2><ol>{STEPS.map(step => <li key={step.id}><a href={'#' + step.id}>{step.title}</a></li>)}</ol></nav><p>Đang thao tác? Dùng nút “Cách…” ngay trong nhóm cần tra cứu trên bàn thực hành.</p></aside>
      <article className={styles.article} aria-label="Hướng dẫn thực hành Jar Test">
        <section className={styles.section} aria-labelledby="jar-objective">
          <h2 id="jar-objective">Trước khi bắt đầu</h2><p>Khảo sát pH ban đầu và tổng liều phèn để tìm điều kiện giảm độ đục. Một lượt là một mẻ; các cốc chạy chung chương trình khuấy–lắng nhưng được đo riêng.</p>
          <div className={styles.preparation}>
            <div><h3 id="jar-profile">Đầu vào của bài</h3><dl className={styles.facts}><div><dt>Mẫu đầu</dt><dd>Kaolin tổng hợp · {JAR_PROFILE.initialNtu} NTU</dd></div><div><dt>Thể tích</dt><dd>0,5 L/cốc · tối đa 6 cốc</dd></div><div><dt>pH ban đầu</dt><dd>{JAR_PROFILE.availableInitialPh.join(' / ')}</dd></div><div><dt>Tổng liều phèn</dt><dd>50–250 mg/L · bước 50</dd></div></dl></div>
            <div><h3>Kết quả cần đạt</h3><ul><li>Cốc được chọn giảm đục ít nhất <strong>{JAR_PROFILE.goalRemovalPercent}%</strong>, tương đương NTU cuối không quá <strong>{targetNtu.toLocaleString('vi-VN')} NTU</strong>.</li><li>Đáp số lệch không quá <strong>{JAR_PROFILE.answerTolerancePercentagePoints.toLocaleString('vi-VN')} điểm %</strong> so với hiệu suất từ số đo.</li></ul><p className={styles.small}>Đây là mục tiêu học tập, không phải chuẩn chất lượng nước. Các cốc chưa đạt vẫn có giá trị so sánh.</p></div>
          </div>
        </section>
        <section className={styles.section} aria-labelledby="jar-equipment"><h2 id="jar-equipment">Nhận biết mẫu và dụng cụ</h2><div className={styles.equipment}>{EQUIPMENT.map(item => <figure key={item.file}><div className={styles.equipmentPhoto}><Image src={'/assets/jar-equipment/' + item.file + '.webp'} alt={item.alt} fill sizes="(max-width:600px) 85vw, 240px" /></div><figcaption><strong>{item.name}</strong><p>{item.purpose}</p><small>{item.note}</small></figcaption></figure>)}</div><p className={styles.small}>Ảnh thực tế dùng để nhận biết. Thao tác trong bài được thực hiện bằng các bảng điều khiển của mô phỏng; nguồn và giấy phép ảnh ở cuối trang.</p></section>
        <figure className={styles.overview}><Image src="/assets/jar-guide/workbench.webp" width={1200} height={872} alt="Dàn sáu cốc trên VECLab, hàng chọn cốc và khu vực số đo bên dưới" sizes="(max-width:850px) 92vw, 800px" /><figcaption>Dàn cốc trên VECLab: chọn cốc ở hàng A–F, đọc số đo đã thực hiện ở phần dưới. Hình chụp trước khi chuẩn bị mẫu.</figcaption></figure>
        <section className={styles.section} aria-labelledby="jar-principle"><h2 id="jar-principle">Vì sao cần ba pha?</h2><ol className={styles.phases}><li><strong>Khuấy nhanh</strong><span>100 rpm · 60 giây</span><p>Phân tán phèn vào mẫu.</p></li><li><strong>Khuấy chậm</strong><span>40 rpm · 20 phút</span><p>Hỗ trợ các hạt kết hợp thành bông.</p></li><li><strong>Lắng</strong><span>Dừng khuấy · 30 phút</span><p>Để bông lắng trước khi đo cuối.</p></li></ol><p className={styles.small}>Thời gian mô phỏng; không cần chờ đủ số phút ngoài đời. Hoạt ảnh chỉ minh họa, không quyết định hiệu suất hoặc thay thế số đo.</p></section>
        <section className={styles.procedure} aria-labelledby="jar-procedure"><h2 id="jar-procedure">Quy trình trên workbench</h2><p>Thực hiện theo thứ tự dưới đây. Ảnh và video được ghi từ giao diện VECLab; pH và liều trong hình là ví dụ dùng công cụ, không phải phương án tối ưu.</p>
          <ol className={styles.steps}>{STEPS.map((step, index) => <li key={step.id}>
            <div className={styles.stepHeading}><span aria-hidden="true">{index + 1}</span><h3 id={step.id} tabIndex={-1}>{step.title}</h3></div>
            <p className={styles.location}>{step.location}</p>
            <div className={styles.stepBody} data-illustrated={!!step.image && step.id !== 'jar-step-program'}>
              <div className={styles.stepText}><p className={styles.tool}><strong>Công cụ:</strong> {step.tool}</p><p>{step.before}</p><ol className={styles.actions}>{step.actions.map(action => <li key={action}>{action}</li>)}</ol><div className={styles.check}><strong>Kiểm tra sau thao tác</strong><p>{step.output}</p></div><details className={styles.explanation}><summary>Vì sao cần bước này?</summary><p>{step.why}</p></details></div>
              {step.image && <figure className={styles.screenshot}><Image src={'/assets/jar-guide/' + step.image.file + '.webp'} alt={step.image.alt} width={step.image.width} height={step.image.height} sizes={step.id === 'jar-step-program' ? '(max-width:850px) 90vw, 800px' : '(max-width:600px) 80vw, 270px'} /><figcaption>{step.image.caption}</figcaption></figure>}
            </div>
            {step.id === 'jar-step-prepare' && <details className={styles.videoDetails}><summary>Xem video ngắn: chuẩn bị một cốc</summary><figure><video controls muted playsInline preload="none" width={900} height={620} poster="/assets/jar-guide/prepare-demo-poster.webp" aria-label="Video minh họa chọn pH và chuẩn bị cốc A" aria-describedby="jar-video-description"><source src="/assets/jar-guide/prepare-demo.webm" type="video/webm" /><track kind="captions" src="/assets/jar-guide/prepare-demo.vi.vtt" srcLang="vi" label="Tiếng Việt" default />Trình duyệt chưa hỗ trợ video. Làm theo các bước chuẩn bị cốc ngay phía trên.</video><figcaption id="jar-video-description">Video không tiếng: chọn pH 7 → Chuẩn bị cốc A → mở Mô phỏng để kiểm tra mẫu. pH 7 chỉ là ví dụ thao tác.</figcaption></figure></details>}
            {step.id === 'jar-step-calculation' && <section className={styles.calculation} aria-labelledby="jar-calculation"><h4 id="jar-calculation">Tính hiệu suất từ số đo</h4><p className={styles.formula}>Hiệu suất (%) = (NTU đầu − NTU cuối) / NTU đầu × 100</p><p><strong>Ví dụ minh họa:</strong> NTU đầu 100, NTU cuối 40 → (100 − 40) / 100 × 100 = <strong>60%</strong>.</p><p className={styles.small}>Các số này không phải kết quả của lượt đang làm. Dùng số đo hợp lệ của chính cốc bạn chọn; “Chưa đo” và N/A đều không phải 0 NTU.</p></section>}
            {step.id === 'jar-step-submit' && <div className={styles.reportNotes} id="jar-output"><h4>Đọc báo cáo theo ba câu hỏi</h4><ul><li><strong>Phương án đã chọn có đạt mục tiêu?</strong> Xem hiệu suất và mức giảm đục của cốc đó.</li><li><strong>Phép tính có khớp số đo?</strong> Đối chiếu đáp số đã ghi và độ lệch tính bằng điểm %.</li><li><strong>Lượt sau cần kiểm tra gì?</strong> Xem dữ liệu còn thiếu, phép đo sớm và điều kiện pH/liều đã thử. Chưa đủ bằng chứng để kết luận riêng liều phèn quá thấp hoặc quá cao.</li></ul></div>}
          </li>)}</ol>
        </section>
        <section className={styles.section} aria-labelledby="jar-terms"><h2 id="jar-terms">Thuật ngữ cần biết</h2><dl className={styles.terms}>{TERMS.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl></section>
        <section className={styles.section} aria-labelledby="jar-limits"><h2 id="jar-limits">An toàn & phạm vi mô phỏng</h2><p>Chỉ khảo sát pH đầu và tổng liều trong khoảng đã cho. Tốc độ và thời gian khuấy cố định; bài không mô phỏng độ đục liên tục hoặc lượng bùn.</p><p>Không dùng kết quả để định liều cho nước thật. Giảm NTU không chứng minh đã loại bỏ vi sinh hoặc chất ô nhiễm hòa tan. Trong phòng thí nghiệm thật, dùng bảo hộ, làm theo giảng viên và không chạm vào cánh khuấy đang chạy.</p></section>
        <section className={styles.section + ' ' + styles.sources} aria-labelledby="jar-sources"><h2 id="jar-sources">Nguồn & giới hạn kết quả</h2><p>Kết quả tái hiện phương trình của mô hình, chưa phải kiểm chứng thực nghiệm cho VECLab. Tài liệu quy trình không chứng nhận hệ số tính toán.</p><details><summary>Xem {JAR_SOURCES.length} tài liệu đang sử dụng</summary><ul>{JAR_SOURCES.map(source => <li key={source.key}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} — mở tab mới</a><p>{source.author} · {source.kind}</p></li>)}</ul></details><details><summary>Nguồn ảnh và tư liệu hướng dẫn</summary><p>Ảnh thao tác và video được ghi từ VECLab. Ảnh dụng cụ thực tế:</p><ul>{EQUIPMENT.map(item => <li key={item.file}>{item.name}: {item.author} · <a href={item.licenseUrl} target="_blank" rel="noopener noreferrer">{item.license}</a> · <a href={item.source} target="_blank" rel="noopener noreferrer">Ảnh gốc — mở tab mới</a></li>)}</ul></details><Link href="/evidence">Cách sử dụng nguồn & giới hạn mô hình <ArrowRightIcon /></Link></section>
        <footer className={styles.end}><p>Sẵn sàng thực hành? Mở hướng dẫn “Cách…” ngay trong nhóm thao tác khi cần nhắc lại.</p><Link className={styles.returnLink} href={workbenchHref}>{id ? 'Tiếp tục lượt thực hành' : 'Vào bàn thực hành'}<ArrowRightIcon /></Link></footer>
      </article>
    </div>
  </div>
}
