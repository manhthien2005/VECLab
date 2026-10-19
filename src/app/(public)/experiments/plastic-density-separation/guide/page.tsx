import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { PLASTIC_PROFILE, VIRGIN_POLYMERS, OUTCOMES } from '@/domain/experiments/virgin-plastic-separation/model.js'
import { PLASTIC_SOURCES } from '@/content/evidence/plastic-density-separation.js'
import { PLASTIC_LESSON_LIMITS, PLASTIC_SOURCE_NOTE } from '@/features/plastic-separation/lesson-content.js'
import { PLASTIC_OVERVIEW } from '@/features/experiment-catalog/overviews.js'
import { PlasticLessonVideos } from '@/features/plastic-separation/lesson-videos.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { parseUUID } from '@/shared/ids.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import styles from '@/features/experiment-guide/article.module.css'

export const metadata: Metadata = {
  title: 'Phân loại nhựa: lý thuyết & cách làm bài',
  description: 'Nguyên lý nổi–chìm, mẫu và dụng cụ, hướng dẫn thao tác và cách đọc kết quả phân loại nhựa trên VECLab.',
  robots: { index: false, follow: false },
}

const LESSON_HREF = '/experiments/plastic-density-separation'
const EQUIPMENT = [
  { file: 'pilot-tank', name: 'Bể phân tách pilot', alt: 'Bể phân tách với cánh khuấy',
    purpose: 'Bể có thể tích hữu ích 800 L theo hồ sơ nghiên cứu. Dùng để làm ướt và tách sơ bộ hỗn hợp nhựa.',
    note: 'Pilot là quy mô thử nghiệm trước khi áp dụng ở quy mô sản xuất.' },
  { file: 'centrifuge', name: 'Máy ly tâm', alt: 'Máy ly tâm dùng để tách ẩm',
    purpose: 'Ghi nhận bước ly tâm tách ẩm ở 2.950 rpm trước khi cân phân đoạn.',
    note: 'Trong bài, ly tâm và cân được thực hiện bằng cùng một nút thao tác.' },
  { file: 'scale', name: 'Cân kỹ thuật', alt: 'Cân kỹ thuật có đĩa cân và màn hình hiển thị',
    purpose: 'Hiển thị khối lượng phân đoạn sau khi ghi nhận ly tâm và cân.',
    note: 'Số cân trong bài được quy đổi từ dữ liệu tham khảo, không phải phép đo mới.' },
]

const STEPS = [
  {
    id: 'step-prepare', title: 'Chuẩn bị sáu mẫu nhựa', location: 'Thao tác → Bước 1', tool: 'Khay mẫu',
    before: 'Bấm “Bắt đầu thí nghiệm Phân loại nhựa” để tạo lượt mới.',
    actions: ['Nhận biết PP, HDPE, PS, ABS, PA và PC trong kệ Mẫu & dụng cụ.', 'Bấm “Chuẩn bị 6 mẫu polymer”. Mỗi loại có 2,0 kg theo hồ sơ bài.'],
    output: 'Sáu mẫu được xếp vào khay; bước nạp mẫu có thể thực hiện tiếp.',
    why: 'Cùng một khối lượng đầu vào giúp đối chiếu lượng thu hồi của từng loại nhựa. Polymer là tên gọi của vật liệu cấu tạo nên các mẫu nhựa này.',
  },
  {
    id: 'step-wetting', title: 'Nạp mẫu và ghi nhận làm ướt', location: 'Thao tác → Bước 1', tool: 'Bể và cánh khuấy',
    before: 'Đã chuẩn bị sáu mẫu và hoàn tất cảnh xếp khay.',
    actions: ['Bấm “Nạp mẫu & ghi nhận bước làm ướt”.', 'Quan sát mẫu được nạp vào bể. Điều kiện làm ướt được đặt sẵn: 160 rpm trong 1 giờ theo hồ sơ nghiên cứu.'],
    output: 'Bài ghi nhận bước làm ướt; có thể chuyển sang tách sơ bộ bằng nước máy. Không cần chờ đủ 1 giờ ngoài thực tế.',
    why: 'Làm ướt giúp hạn chế bọt khí bám lên hạt và ảnh hưởng đến hiện tượng nổi–chìm. Chuyển động trên màn hình chỉ minh họa thao tác.',
  },
  {
    id: 'step-water-separation', title: 'Tách sơ bộ bằng nước máy', location: 'Thao tác → Bước 2', tool: 'Bể nước máy',
    before: 'Đã ghi nhận làm ướt mẫu.',
    actions: ['Bấm “Ghi nhận tách sơ bộ trong nước”.', 'Quan sát PP và HDPE ở nhóm nổi; PS, ABS, PA và PC ở nhóm chìm. Chờ cảnh phân tách kết thúc để làm bước tiếp theo.'],
    output: 'Có hai nhóm để xử lý tiếp: nhóm nhẹ PP + HDPE và nhóm nặng PS + ABS + PA + PC.',
    why: 'Các hạt có khối lượng riêng nhỏ hơn nước thuộc nhóm nổi; các hạt có khối lượng riêng lớn hơn nước thuộc nhóm chìm trong hồ sơ này.',
  },
  {
    id: 'step-centrifugation', title: 'Ly tâm tách ẩm và cân phân đoạn', location: 'Thao tác → Bước 3', tool: 'Máy ly tâm và cân',
    before: 'Đã hoàn tất tách sơ bộ trong nước.',
    actions: ['Bấm “Ghi nhận ly tâm phân đoạn & Cân mẫu”.', 'Chờ cảnh ly tâm và chuyển mẫu sang cân kết thúc. Đọc khối lượng nhóm PP + HDPE trong khu vực thực hành hoặc Sổ thực hành.'],
    output: 'Bài ghi nhận ly tâm và cân; các nút chọn nhánh dung dịch được mở. Khối lượng quy đổi không phải phép đo mới.',
    why: 'Trong nghiên cứu, phân đoạn được tách ẩm trước khi cân. Trong VECLab, số cân được quy đổi từ khối lượng cấp liệu và tỷ lệ thu hồi tham khảo.',
  },
  {
    id: 'step-branch-solution', title: 'Tách nhánh nhẹ bằng ethanol', location: 'Thao tác → Bước 4 → Nhánh nhẹ (Ethanol)', tool: 'Dung dịch ethanol và bộ ly tâm–cân',
    before: 'Đã ly tâm và cân nhóm sau tách nước. Có thể làm nhánh NaCl trước nếu muốn.',
    actions: ['Chọn “Nhánh nhẹ (Ethanol)”. Bấm “Chạy” trong ô Ethanol 23% v/v.', 'Khi cảnh phân tách kết thúc, ghi nhận ly tâm và cân trước khi chuyển mức nồng độ.', 'Bấm “Chạy” ở mức 31% v/v rồi ly tâm và cân. Ở mức này, bài nạp lại PP cùng phần HDPE đã cân để minh họa so sánh hai mức nồng độ.'],
    output: 'PP thuộc nhóm nổi và HDPE thuộc nhóm chìm trong hai mức ethanol của hồ sơ. Kết quả cân của nhánh được ghi vào Sổ thực hành.',
    why: 'Thay đổi thành phần ethanol làm thay đổi khối lượng riêng của môi trường. Hai mức là điều kiện được đặt sẵn, không phải ô để tự pha nồng độ bất kỳ.',
  },
  {
    id: 'step-nacl', title: 'Tách nhánh nặng bằng NaCl', location: 'Thao tác → Bước 4 → Nhánh nặng (NaCl)', tool: 'Dung dịch NaCl và bộ ly tâm–cân',
    before: 'Đã ly tâm và cân nhóm sau tách nước. Có thể làm nhánh này trước ethanol.',
    actions: ['Chọn “Nhánh nặng (NaCl)”. Lần lượt bấm “Chạy” ở các mức 11–12%, 20% và 40% w/v.', 'Sau mỗi mức, chờ phân tách rồi ghi nhận ly tâm và cân trước khi chạy mức tiếp theo.', 'Theo dõi PS, ABS rồi PA được ghi nhận ở phân đoạn nổi; PC ở phân đoạn chìm cuối cùng.'],
    output: 'Các phân đoạn PS, ABS, PA và PC có kết quả sau bước ly tâm và cân tương ứng.',
    why: 'Nhánh NaCl xử lý nhóm nặng sau tách nước. Bài chỉ xét các mức nồng độ trong hồ sơ; không suy diễn kết quả cho các nồng độ khác.',
  },
  {
    id: 'step-summary-report', title: 'Tổng kết và hoàn tất lượt', location: 'Thao tác → Bước 4 và Bước 5', tool: 'Khay thu hồi, Sổ thực hành và báo cáo',
    before: 'Đã hoàn thành cả hai nhánh và ghi nhận ly tâm, cân ở mức cuối của mỗi nhánh.',
    actions: ['Bấm “Xem tổng kết các phân đoạn thu hồi”.', 'Kiểm tra các khay, môi trường phân tách và khối lượng đã ghi nhận. Mở “Sổ thực hành” để đọc lại lịch sử.', 'Bấm “Hoàn tất lượt thực hành” để chốt lượt và mở báo cáo.'],
    output: 'Lượt được hoàn tất và lưu trên trình duyệt này; báo cáo mở để xem lại kết quả.',
    why: 'Tổng kết giúp nối từng phân đoạn với thao tác đã thực hiện. Các tỷ lệ trong hồ sơ là dữ liệu tham khảo, không phải mục tiêu để tự điều chỉnh số cân cho khớp.',
  },
]

const TERMS = [
  ['Khối lượng riêng · g/cm³', 'Khối lượng trên một đơn vị thể tích. Dùng để so sánh hạt nhựa với môi trường chất lỏng; không xác định chỉ bằng màu hoặc hình dạng hạt.'],
  ['Phân đoạn', 'Phần vật liệu được tách ra sau một bước xử lý. Nhóm nhẹ gồm PP + HDPE nổi trong nước; nhóm nặng gồm PS, ABS, PA và PC chìm trong nước.'],
  ['Nồng độ cố định (preset)', 'Một điều kiện được đặt sẵn để thực hiện và đối chiếu. Bài không cho nhập nồng độ tùy ý hoặc pha dung dịch trực tiếp.'],
  ['% v/v và % w/v', '% v/v biểu thị mL ethanol trong 100 mL dung dịch; % w/v biểu thị gam NaCl trong 100 mL dung dịch. Mẫu số là thể tích dung dịch, không phải lượng nước ban đầu.'],
  ['Thu hồi · %', 'Tỷ lệ khối lượng vật liệu thu được so với khối lượng ban đầu của chính vật liệu đó. Không đồng nghĩa với độ tinh khiết của phân đoạn.'],
  ['rpm', 'Số vòng quay trong một phút. Trong bài, tốc độ khuấy và ly tâm là điều kiện được đặt sẵn theo hồ sơ.'],
] as const

export default async function PlasticSeparationGuidePage({ searchParams }: {
  searchParams: Promise<{ attempt?: string | string[] }>
}) {
  const { attempt } = await searchParams
  const id = typeof attempt === 'string' ? parseUUID(attempt) : null
  const workbenchHref = '/simulate/plastic-density-separation' + (id ? '?attempt=' + encodeURIComponent(id) : '')

  return <div className={'page ' + styles.guide}>
    <Breadcrumbs items={[
      { label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' },
      { label: PLASTIC_OVERVIEW.title, href: LESSON_HREF }, { label: 'Lý thuyết & cách làm' },
    ]} />
    <header className={styles.header}>
      <div>
        <h1>Phân loại nhựa: lý thuyết & cách làm bài</h1>
        <p>Từ chuẩn bị sáu mẫu nhựa đến đọc báo cáo. Mỗi bước chỉ rõ công cụ, nút thao tác và kết quả cần kiểm tra trên VECLab.</p>
      </div>
      <Link className={styles.returnLink} href={workbenchHref}>{id ? 'Quay lại lượt đang làm' : 'Bắt đầu thực hành'}<ArrowRightIcon /></Link>
    </header>
    <PlasticLessonVideos />
    <div className={styles.readingLayout}>
      <aside className={styles.rail}>
        <nav className={styles.contents} aria-label="Tra nhanh các bước">
          <h2>Tra nhanh các bước</h2>
          <ol>{STEPS.map(step => <li key={step.id}><a href={'#' + step.id}>{step.title}</a></li>)}</ol>
        </nav>
        <p>Đang thao tác? Các bước dưới đây dùng đúng tên nút trên bàn thực hành. Kệ Mẫu & dụng cụ có phần “Hướng dẫn thao tác” để xem lại bố cục.</p>
      </aside>
      <article className={styles.article} aria-label="Hướng dẫn thực hành phân loại nhựa nguyên sinh">
        <section className={styles.section} id="plastic-objective" aria-labelledby="heading-objective">
          <h2 id="heading-objective">Trước khi bắt đầu</h2>
          <p>Phân loại sáu loại nhựa nguyên sinh dựa trên hiện tượng nổi–chìm qua nước máy, dung dịch ethanol và NaCl. Bạn chọn nhánh thực hiện trước; các mức nồng độ và điều kiện vận hành đã được đặt sẵn.</p>
          <div className={styles.preparation}>
            <div>
              <h3 id="plastic-profile">Đầu vào của bài</h3>
              <dl className={styles.facts}>
                <div><dt>Mẫu nhựa</dt><dd>{VIRGIN_POLYMERS.map(polymer => polymer.id).join(', ')}</dd></div>
                <div><dt>Khối lượng</dt><dd>{PLASTIC_PROFILE.sampleFeedMassKg.toLocaleString('vi-VN', { minimumFractionDigits: 1 })} kg/loại · 12,0 kg tổng mẻ</dd></div>
                <div><dt>Bể pilot</dt><dd>{PLASTIC_PROFILE.pilotTankVolumeLiters} L hữu ích</dd></div>
                <div><dt>Làm ướt</dt><dd>{PLASTIC_PROFILE.wettingStirringRpm} rpm · {PLASTIC_PROFILE.wettingDurationHours} giờ theo hồ sơ</dd></div>
                <div><dt>Ly tâm</dt><dd>{PLASTIC_PROFILE.centrifugeRpm.toLocaleString('vi-VN')} rpm</dd></div>
              </dl>
            </div>
            <div>
              <h3>Bạn cần hoàn thành</h3>
              <ul><li>Tách sơ bộ trong nước và ghi nhận ly tâm, cân.</li><li>Thực hiện cả hai nhánh ethanol và NaCl; ly tâm, cân giữa các mức nồng độ.</li><li>Đọc tổng kết phân đoạn và hoàn tất lượt thực hành.</li></ul>
              <p className={styles.small}>Đây là bài theo dõi quy trình với điều kiện đặt sẵn. Khối lượng và tỷ lệ thu hồi lấy từ hồ sơ, không phải số đo thực nghiệm mới.</p>
            </div>
          </div>
        </section>
        <section className={styles.section} id="plastic-equipment" aria-labelledby="heading-equipment">
          <h2 id="heading-equipment">Nhận biết mẫu và dụng cụ</h2>
          <div className={styles.equipment} data-testid="plastic-equipment">
            {EQUIPMENT.map(item => <figure key={item.file}>
              <div className={styles.equipmentPhoto}><Image src={'/assets/plastic-separation/' + item.file + '.jpg'} alt={item.alt} fill sizes="(max-width:600px) 100px, 240px" /></div>
              <figcaption><strong>{item.name}</strong><p>{item.purpose}</p><small>{item.note}</small></figcaption>
            </figure>)}
          </div>
          <details className={styles.explanation}>
            <summary>Xem sáu mẫu nhựa và khối lượng riêng</summary>
            <div className={styles.equipment}>{VIRGIN_POLYMERS.map(polymer => <figure key={polymer.id}>
              <div className={styles.equipmentPhoto}><Image src={'/assets/plastic-separation/' + polymer.id.toLowerCase() + '.jpg'} alt={'Mẫu nhựa ' + polymer.id + ' để tham khảo nhận diện'} fill sizes="(max-width:600px) 100px, 240px" /></div>
              <figcaption><strong>{polymer.id} · {polymer.name}</strong><p>Khối lượng riêng theo hồ sơ: {polymer.nominalDensity}.</p><small>{polymer.formVi}. Kích thước theo hồ sơ: {polymer.sizeRangeMm}.</small></figcaption>
            </figure>)}</div>
          </details>
          <p className={styles.small}>Ảnh mẫu và dụng cụ dùng để nhận biết, không phải bằng chứng kết quả phân tách. Màu trong ảnh không quyết định loại nhựa hoặc hiện tượng nổi–chìm; thông số lấy theo hồ sơ bài.</p>
        </section>
        <section className={styles.section} id="plastic-principle" aria-labelledby="heading-principle">
          <h2 id="heading-principle">Vì sao cần nhiều môi trường phân tách?</h2>
          <ol className={styles.phases}>
            <li><strong>Nước máy</strong><span>Tách sơ bộ</span><p>Chia hỗn hợp thành nhóm nhẹ PP + HDPE và nhóm nặng PS + ABS + PA + PC.</p></li>
            <li><strong>Nhánh ethanol</strong><span>23 / 31% v/v</span><p>Tách PP và HDPE theo hai mức nồng độ trong hồ sơ. PP ở phân đoạn nổi, HDPE ở phân đoạn chìm.</p></li>
            <li><strong>Nhánh NaCl</strong><span>11–12 / 20 / 40% w/v</span><p>Theo dõi lần lượt PS, ABS, PA ở phân đoạn nổi; PC thuộc phần chìm cuối cùng theo hồ sơ.</p></li>
          </ol>
          <p className={styles.small}>Ethanol và NaCl là hai nhánh sau bước tách nước, không phải ba bước liên tiếp trên cùng toàn bộ mẫu. Thời gian trong hồ sơ là điều kiện nghiên cứu; hoạt ảnh không xác định kết quả.</p>
          <details className={styles.explanation}>
            <summary>Xem kết quả tham khảo theo từng mức nồng độ</summary>
            <dl className={styles.terms}>{Object.values(OUTCOMES).map(outcome => <div key={outcome.kind} data-testid={'outcome-' + outcome.kind}>
              <dt>{outcome.mediumVi}</dt>
              <dd>Nổi: {outcome.floating.join(', ')}. Chìm: {outcome.sinking.join(', ')}.<br />{outcome.recoveryTextVi.join(' · ')}.</dd>
            </div>)}</dl>
            <p className={styles.small}>Các tỷ lệ này là dữ liệu tham khảo của hồ sơ, không phải mục tiêu để nhập đáp số. 97,5% ở nước máy là thu hồi gộp PP + HDPE, không phải thu hồi riêng từng loại.</p>
          </details>
        </section>
        <section className={styles.procedure} id="plastic-procedure" aria-labelledby="heading-procedure">
          <h2 id="heading-procedure">Quy trình trên workbench</h2>
          <p>Workbench là bàn mô phỏng của bài. Thao tác bằng các nút trong bảng bên phải, không cần kéo thả mẫu hoặc tự pha dung dịch.</p>
          <ol className={styles.steps}>{STEPS.map((step, index) => <li key={step.id}>
            <div className={styles.stepHeading}><span aria-hidden="true">{index + 1}</span><h3 id={step.id} tabIndex={-1}>{step.title}</h3></div>
            <p className={styles.location}>{step.location}</p>
            <div className={styles.stepBody}>
              <div className={styles.stepText}>
                <p className={styles.tool}><strong>Công cụ:</strong> {step.tool}</p>
                <p>{step.before}</p>
                <ol className={styles.actions}>{step.actions.map(action => <li key={action}>{action}</li>)}</ol>
                <div className={styles.check}><strong>Kiểm tra sau thao tác</strong><p>{step.output}</p></div>
                <details className={styles.explanation}><summary>Vì sao cần bước này?</summary><p>{step.why}</p></details>
              </div>
            </div>
          </li>)}</ol>
        </section>
        <section className={styles.section} id="plastic-results" aria-labelledby="heading-results">
          <h2 id="heading-results">Đọc khối lượng và tỷ lệ thu hồi</h2>
          <div className={styles.calculation}>
            <p className={styles.formula}>Thu hồi (%) = khối lượng thu được / khối lượng ban đầu × 100</p>
            <p>Trong bài này, khối lượng được quy đổi theo chiều ngược lại: khối lượng cấp liệu × tỷ lệ thu hồi tham khảo / 100.</p>
            <p><strong>Ví dụ minh họa:</strong> cấp 2,0 kg, thu hồi 80% → khối lượng quy đổi 1,6 kg. Đây không phải kết quả của lượt đang làm.</p>
          </div>
          <div className={styles.reportNotes}><h3>Đọc báo cáo theo ba câu hỏi</h3><ul>
            <li><strong>Đã làm những bước nào?</strong> Đối chiếu nhánh dung dịch và lịch sử thao tác.</li>
            <li><strong>Vật liệu nằm ở phân đoạn nào?</strong> Phân biệt nổi, chìm và khay thu hồi tương ứng.</li>
            <li><strong>Số liệu có ý nghĩa gì?</strong> Thu hồi là tỷ lệ vật liệu lấy lại được, không phải độ tinh khiết hay kết quả kiểm chứng ngoài thực tế.</li>
          </ul><p className={styles.small}>Chưa cân hoặc chưa thực hiện không có nghĩa là 0 kg. Chỉ đọc số liệu đã được ghi nhận trong lượt.</p></div>
        </section>
        <section className={styles.section} id="plastic-troubleshooting" aria-labelledby="heading-troubleshooting">
          <h2 id="heading-troubleshooting">Tình huống thường gặp</h2>
          <details className={styles.explanation}><summary>Nút thao tác đang bị khóa</summary><p>Kiểm tra bước trước trong bảng Thao tác. Nếu cảnh nạp mẫu, phân tách hoặc ly tâm đang chạy, chờ cảnh kết thúc rồi tiếp tục. Thời gian này chỉ phục vụ minh họa, không phải chờ đủ thời gian nghiên cứu.</p></details>
          <details className={styles.explanation}><summary>Chưa chạy được mức nồng độ tiếp theo</summary><p>Hoàn tất mức trước, ghi nhận ly tâm và cân. Nhánh ethanol có hai mức; nhánh NaCl có ba mức. Các mức được thực hiện theo thứ tự trong từng nhánh.</p></details>
          <details className={styles.explanation}><summary>Chưa thấy nút tổng kết</summary><p>Hoàn thành cả hai nhánh, kể cả ly tâm và cân sau mức cuối. Sau đó mở tổng kết ở Bước 4 và hoàn tất lượt ở Bước 5.</p></details>
          <details className={styles.explanation}><summary>Cần đọc lại số liệu hoặc mở báo cáo</summary><p>Chọn “Sổ thực hành” để đọc kết quả và lịch sử. Sau khi hoàn tất lượt, nút “Xem báo cáo” xuất hiện ở đầu bàn thực hành. Dữ liệu lưu trên trình duyệt này, chưa đồng bộ sang thiết bị khác.</p></details>
        </section>
        <section className={styles.section} id="plastic-terms" aria-labelledby="heading-terms">
          <h2 id="heading-terms">Thuật ngữ cần biết</h2>
          <dl className={styles.terms}>{TERMS.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
        </section>
        <section className={styles.section} id="plastic-limits" aria-labelledby="heading-limits">
          <h2 id="heading-limits">An toàn & phạm vi mô phỏng</h2>
          <ul>{PLASTIC_LESSON_LIMITS.map(limit => <li key={limit}>{limit}</li>)}</ul>
          <p>Thực hành ngoài đời cần quy trình của giảng viên, bảo hộ và hướng dẫn vận hành thiết bị. Ethanol dễ cháy; không dùng bài mô phỏng thay cho quy trình an toàn thực tế.</p>
        </section>
        <section className={styles.section + ' ' + styles.sources} id="plastic-sources" aria-labelledby="heading-sources">
          <h2 id="heading-sources">Nguồn khoa học & giới hạn kết quả</h2>
          <p>Hồ sơ sử dụng thông số mẫu, điều kiện pilot và tỷ lệ thu hồi từ nghiên cứu dưới đây.</p>
          <details><summary>Xem tài liệu tham khảo</summary><ul>{Object.values(PLASTIC_SOURCES).map(source => <li key={source.key}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
            <p>{source.authorsOrOrganization} · {source.year}</p><p>Phần sử dụng: {source.locations.join(', ')}.</p>
          </li>)}</ul></details>
          <details><summary>Lưu ý về số liệu ethanol trong bài báo</summary><p>{PLASTIC_SOURCE_NOTE}</p></details>
          <p className={styles.small}>Kiểm tra số học và khả năng tái hiện phần mềm không thay thế kiểm chứng thực nghiệm. Ảnh nhận diện không được dùng để suy ra độ tinh khiết hoặc xác nhận hiệu quả phân tách.</p>
        </section>
        <footer className={styles.end}>
          <p>Sẵn sàng thực hành? Quay lại bàn mô phỏng để thực hiện quy trình và kiểm tra từng kết quả.</p>
          <Link className={styles.returnLink} href={workbenchHref}>{id ? 'Tiếp tục lượt thực hành' : 'Vào bàn thực hành'}<ArrowRightIcon /></Link>
          <p><Link href={LESSON_HREF}>Về chi tiết thí nghiệm</Link></p>
        </footer>
      </article>
    </div>
  </div>
}
