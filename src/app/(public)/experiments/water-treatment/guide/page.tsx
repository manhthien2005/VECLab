import type { Metadata } from 'next'
import Link from 'next/link'
import { WATER_TREATMENT_PROFILE } from '@/domain/experiments/water-treatment/model.js'
import { parseUUID } from '@/shared/ids.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { WATER_TREATMENT_SOURCES } from '@/content/evidence/water-treatment.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import styles from '@/features/experiment-guide/article.module.css'

/** Dữ liệu dụng cụ — đồng bộ với equipment-panel.tsx */
const EQUIPMENT = [
  {
    kind: 'sample',
    title: 'Mẫu Fe, Zn, Pb',
    purpose: 'Mẫu nước tổng hợp chứa Fe, Zn, Pb ở dạng muối tan (FeCl₃, ZnSO₄, Pb(NO₃)₂). Đây là đối tượng cần xử lý.',
    facts: [
      ['Các cation', 'Fe³⁺ · Zn²⁺ · Pb²⁺'],
      ['Anion đi kèm', 'Cl⁻ · SO₄²⁻ · NO₃⁻'],
      ['Thể tích', '500–2.000 mL'],
    ],
    steps: [
      'Chọn nồng độ Fe, Zn, Pb trong Thao tác → Chọn mẫu.',
      'Bấm Đo pH ban đầu trước khi nhỏ bất kỳ giọt nào.',
      'Sau khi áp dụng composition, bạn có thể thay đổi — toàn bộ tiến trình sẽ reset.',
    ],
    note: 'Composition do solver quy đổi sang μM khi tính. pH ban đầu lấy từ composition chứ không phải user input.',
  },
  {
    kind: 'naoh',
    title: 'NaOH 1 M',
    purpose: 'Dung dịch NaOH 1 M dùng để tăng pH. Khi pH vượt pKsp của Fe(OH)₃, Zn(OH)₂, Pb(OH)₂, các kim loại kết tủa dưới dạng hydroxide.',
    facts: [
      ['Nồng độ stock', '1 M (≈ 40 g/L)'],
      ['Kích thước giọt', '0,01 / 0,05 / 0,1 / 0,5 mL'],
      ['Tác dụng', 'Tăng pH · sinh hydroxide'],
    ],
    steps: [
      'Chọn drop size (0,05 mL là mặc định an toàn).',
      'Bấm Nhỏ giọt NaOH trong Thao tác → Kiềm hóa và lọc.',
      'Sau mỗi giọt, dùng Khuấy để đồng nhất. Tránh pH > 10,5 (Zn tan ngược do amphoteric).',
    ],
    note: 'NaOH cũng đưa Na⁺ vào dung dịch — server dùng tổng Na⁺ tích lũy để charge balance.',
  },
  {
    kind: 'hcl',
    title: 'HCl 1 M',
    purpose: 'Dung dịch HCl 1 M dùng để giảm pH (correct overshoot kiềm hoặc trung hòa pH cuối ở Bước 3).',
    facts: [
      ['Nồng độ stock', '1 M (≈ 36,5 g/L)'],
      ['Kích thước giọt', '0,01 / 0,05 / 0,1 / 0,5 mL'],
      ['Tác dụng', 'Giảm pH · tăng Cl⁻'],
    ],
    steps: [
      'Trong Bước 2: chỉ dùng để correct overshoot kiềm khiến Zn tan ngược.',
      'Trong Bước 3: dùng để đưa pH về dải [6; 9] theo Cột A.',
      'Mỗi giọt HCl cập nhật pH ngay. Khuấy sau khi nhỏ để đồng nhất.',
    ],
    note: 'HCl đưa Cl⁻ vào dung dịch — server cộng Cl⁻ tích lũy để charge balance.',
  },
  {
    kind: 'meter',
    title: 'Máy đo pH',
    purpose: 'Đo pH bằng điện cực thủy tinh. Chỉ phép đo đã thực hiện mới có số liệu.',
    facts: [
      ['Đại lượng đo', 'pH'],
      ['Đo pH ban đầu', 'Bắt buộc trước khi nhỏ bất kỳ giọt nào'],
      ['Đo lại pH Bước 3', 'Sau khuấy, mỗi lần đo thêm 1 hàng vào bảng'],
    ],
    steps: [
      'Bước 1: Thao tác → Đo pH ban đầu, bấm Đo pH ban đầu để lấy baseline.',
      'Bước 2: Có thể đo lại sau khi chỉnh (server trả pH mới).',
      'Bước 3: Đo lại pH sau mỗi lần khuấy. Mỗi lần đo tạo 1 hàng mới trong bảng lịch sử.',
    ],
    note: 'pH ngoài [2; 13] sẽ bị pH guard từ chối (CHARGE_BALANCE_FAILED / PH_GUARD_*).',
  },
] as const

export const metadata: Metadata = {
  title: 'Xử lý nước Fe, Zn, Pb: lý thuyết & cách làm bài',
  description: 'Hướng dẫn xử lý nước Fe, Zn, Pb từng bước, có ảnh thao tác, cách ghi số đo và đọc kết quả đối chiếu QCVN 40:2025.',
  robots: { index: false, follow: false },
}

type GuideStep = {
  id: string
  title: string
  tool: string
  location: string
  before: string
  actions: string[]
  output: string
  why: string
}

const STEPS: GuideStep[] = [
  {
    id: 'wt-step-compose',
    title: 'Pha mẫu nước tổng hợp',
    tool: 'Bình đựng muối kim loại và nước cất',
    location: 'Bàn 1 · Pha nước',
    before: 'Tạo mẫu nước chứa Fe, Zn, Pb ở nồng độ khác nhau để khảo sát hiệu quả kết tủa hydroxide.',
    actions: [
      'Bấm Thêm Fe, Zn hoặc Pb để cấp từng muối vào cốc. Xem Tổng nồng độ và thể tích thay đổi.',
      'Khi đã có nồng độ phù hợp, bấm Đo pH ban đầu để ghi số đo mẫu đầu.',
      'Bấm Dùng mẫu này để chuyển sang Bàn 2.',
    ],
    output: 'Thông số mẫu Bàn 1 được lưu: nồng độ Fe, Zn, Pb (mg/L) và pH đầu. Những giá trị này xác định thành phần cốc Bàn 2.',
    why: 'pH đầu và nồng độ ban đầu là điều kiện đầu của mô hình kết tủa. Thay đổi muối trước khi đo pH sẽ thay đổi kết quả phép đo.',
  },
  {
    id: 'wt-step-kwh',
    title: 'Khuấy với NaOH để kết tủa kim loại',
    tool: 'Máy khuấy và dung dịch NaOH',
    location: 'Bàn 2 · Xử lý',
    before: 'Cốc Bàn 2 đã chứa mẫu từ Bàn 1. Thêm NaOH làm tăng pH, khiến Fe, Zn, Pb kết tủa thành hydroxide.',
    actions: [
      'Bấm Bật khuấy để bắt đầu khuấy. Chờ dòng trạng thái hiển thị "Đã dừng khuấy".',
      'Mở nhóm NaOH, chọn thể tích muốn thêm rồi bấm Thêm NaOH. Xem giá trị pH và Tổng NaOH cập nhật.',
      'Lặp lại cho đến khi pH đạt giá trị mong muốn. Khi hài lòng, bấm Lắng.',
    ],
    output: 'pH và tổng NaOH được cập nhật. Kết tủa hydroxide hình thành khi pH đủ cao.',
    why: 'Fe kết tủa ở pH thấp hơn Zn và Pb. Pb kết tủa khó nhất, cần pH cao hơn. Việc phân chia giữa pha hòa tan và pha rắn được tính bằng mô hình cân bằng hóa học tại mỗi bước.',
  },
  {
    id: 'wt-step-settle',
    title: 'Lắng để tách pha rắn',
    tool: 'Cốc và giá đỡ',
    location: 'Bàn 2 · Xử lý',
    before: 'Đã khuấy và thêm NaOH. Kết tủa đang lơ lửng trong cốc.',
    actions: [
      'Bấm Lắng trong nhóm Thao tác. Chờ cho bông kết tủa lắng xuống đáy cốc.',
      'Xem pha rắn và pha lỏng hiển thị riêng trên cốc.',
    ],
    output: 'Cốc hiển thị pha rắn (đáy) và pha lỏng (trên). Có thể chuyển sang lọc hoặc khóa Bàn 2.',
    why: 'Lắng giúp đánh giá khối lượng kết tủa và nồng độ còn lại trong pha lỏng trước khi tách hoàn toàn.',
  },
  {
    id: 'wt-step-filter',
    title: 'Lọc để tách hoàn toàn pha rắn',
    tool: 'Giấy lọc và phễu lọc',
    location: 'Bàn 2 · Xử lý',
    before: 'Đã lắng. Phần nước trong suốt ở trên có thể chuyển sang cốc mới.',
    actions: [
      'Bấm Lọc trong nhóm Thao tác. Pha rắn bám trên giấy lọc, nước trong chảy xuống cốc.',
      'Sau khi lọc xong, bấm Khóa Bàn 2 để chuyển dữ liệu sang Bàn 3.',
    ],
    output: 'Bảng kết quả xử lý hiển thị nồng độ Fe, Zn, Pb còn lại trong nước sau lọc. Nồng độ này là đầu vào cân bằng pH ở Bàn 3.',
    why: 'Lọc tách hoàn toàn kết tủa khỏi dung dịch, cho phép đo nồng độ kim loại hòa tan còn lại trước khi thải.',
  },
  {
    id: 'wt-step-balance',
    title: 'Cân bằng pH trước khi thải',
    tool: 'Máy đo pH, NaOH và HCl',
    location: 'Bàn 3 · Cân bằng pH',
    before: 'Đã khóa Bàn 2. Nước trong cốc Bàn 3 chứa kim loại đã xử lý, cần pH 6–9 trước khi đối chiếu QCVN.',
    actions: [
      'Bấm Đo pH để kiểm tra giá trị hiện tại.',
      'Nếu pH thấp hơn 6, thêm NaOH. Nếu cao hơn 9, thêm HCl. Dùng lượng nhỏ và đo lại sau mỗi lần.',
      'Khi pH nằm trong khoảng 6–9, kiểm tra bảng đối chiếu QCVN.',
    ],
    output: 'Bảng kiểm tra QCVN 40:2025 hiện ra: nồng độ Fe, Zn, Pb và pH cùng cột A tương ứng. Lịch sử lọc từ Bàn 2 cũng hiển thị.',
    why: 'QCVN 40:2025 quy định giới hạn pH 6–9 và nồng độ tối đa của Fe, Zn, Pb ở cột A. Cân bằng pH đảm bảo nước thải đạt cả hai tiêu chí.',
  },
  {
    id: 'wt-step-check',
    title: 'Đối chiếu QCVN và đọc kết quả',
    tool: 'Bảng đối chiếu QCVN 40:2025',
    location: 'Bàn 3 · Sau khi cân bằng pH',
    before: 'Đã cân bằng pH trong khoảng 6–9. Bảng kết quả hiển thị nồng độ kim loại và pH cuối.',
    actions: [
      'Kiểm tra bảng đối chiếu QCVN: Fe ≤ 2,0 mg/L, Zn ≤ 1,0 mg/L, Pb ≤ 0,1 mg/L, pH 6–9.',
      'Xem lịch sử lọc từ Bàn 2 để hiểu mức giảm kim loại qua từng lần xử lý.',
      'Đọc kết quả từng chỉ tiêu và đánh giá phương án xử lý.',
    ],
    output: 'Bảng cho biết mỗi kim loại và pH đạt hay chưa đạt cột A. Có thể xem lại số đo và lịch sử thao tác.',
    why: 'Kết quả giúp phân biệt giữa pH chưa đạt, kim loại chưa kết tủa đủ và điều kiện đã đạt mục tiêu. Chưa đạt một chỉ tiêu nghĩa là chưa sẵn sàng thải theo QCVN.',
  },
]

const TERMS = [
  [
    'Kết tủa hydroxide',
    'Phản ứng tạo Fe(OH)₃, Zn(OH)₂, Pb(OH)₂ khi pH đủ cao. Mỗi kim loại có pH kết tủa riêng: Fe thấp nhất, Pb cao nhất.',
  ],
  [
    'pH kết tủa',
    'Giá trị pH mà tại đó một kim loại bắt đầu chuyển từ dạng hòa tan sang kết tủa hydroxide. Không cố định; phụ thuộc nồng độ ban đầu và ion cạnh tranh.',
  ],
  [
    'Tích số tan · Ksp',
    'Hằng số cân bằng cho phép tính nồng độ ion tối đa ở trạng thái bão hòa. Fe(OH)₃ có Ksp ≈ 2,79 × 10⁻³⁹, Pb(OH)₂ ≈ 1,43 × 10⁻²⁰.',
  ],
  [
    'Cột A · QCVN 40:2025',
    'Giới hạn nồng độ tối đa cho phép trong nước thải công nghiệp trước khi xả ra nguồn tiếp nhận. Fe ≤ 2,0 mg/L · Zn ≤ 1,0 mg/L · Pb ≤ 0,1 mg/L · pH 6–9.',
  ],
  [
    'Pha rắn / pha lỏng',
    'Pha rắn là kết tủa hydroxide chứa kim loại đã loại bỏ. Pha lỏng là nước chứa kim loại còn lại (filtrate). Lọc tách hai pha để đo nồng độ còn lại.',
  ],
  [
    'Cân bằng pH',
    'Điều chỉnh pH về 6–9 sau khi kết tủa để đảm bảo nước thải không axit hoặc kiềm quá mức, đồng thời không làm kim loại kết tủa lại.',
  ],
]

export default async function WaterTreatmentGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string | string[] }>
}) {
  const { attempt } = await searchParams
  const id = typeof attempt === 'string' ? parseUUID(attempt) : null
  const workbenchHref =
    '/simulate/water-treatment' + (id ? '?attempt=' + encodeURIComponent(id) : '')

  return (
    <div className={'page ' + styles.guide}>
      <Breadcrumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Thí nghiệm', href: '/experiments' },
          { label: 'Xử lý nước Fe, Zn, Pb', href: '/experiments/water-treatment' },
          { label: 'Lý thuyết & cách làm bài' },
        ]}
      />

      <header className={styles.header}>
        <div>
          <h1>Xử lý nước Fe, Zn, Pb: lý thuyết & cách làm bài</h1>
          <p>
            Từ pha mẫu nước tổng hợp ở Bàn 1, kết tủa kim loại ở Bàn 2, đến cân bằng pH và đối chiếu QCVN 40:2025 ở Bàn 3. Mỗi bước chỉ rõ công cụ, thao tác và kết quả cần kiểm tra trên VECLab.
          </p>
        </div>
        <Link className={styles.returnLink} href={workbenchHref}>
          {id ? 'Quay lại lượt đang làm' : 'Bắt đầu thực hành'}
          <ArrowRightIcon />
        </Link>
      </header>

      <div className={styles.readingLayout}>
        <aside className={styles.rail}>
          <nav className={styles.contents} aria-label="Tra nhanh các bước">
            <h2>Tra nhanh các bước</h2>
            <ol>
              {STEPS.map((step) => (
                <li key={step.id}>
                  <a href={'#' + step.id}>{step.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          <p>
            Đang thao tác? Dùng nút &ldquo;Cách…&rdquo; ngay trong nhóm cần tra
            cứu trên bàn thực hành.
          </p>
        </aside>

        <article
          className={styles.article}
          aria-label="Hướng dẫn thực hành Xử lý nước Fe, Zn, Pb"
        >
          {/* Trước khi bắt đầu */}
          <section className={styles.section} aria-labelledby="wt-objective">
            <h2 id="wt-objective">Trước khi bắt đầu</h2>
            <p>
              Khảo sát hiệu quả kết tủa Fe, Zn, Pb bằng NaOH qua ba bàn: pha
              mẫu, xử lý–lắng–lọc, và cân bằng pH trước khi đối chiếu QCVN
              40:2025 cột A.
            </p>
            <div className={styles.preparation}>
              <div>
                <h3 id="wt-profile">Đầu vào của bài</h3>
                <dl className={styles.facts}>
                  <div>
                    <dt>Fe</dt>
                    <dd>
                      {WATER_TREATMENT_PROFILE.feRange.min}–{WATER_TREATMENT_PROFILE.feRange.max} mg/L
                    </dd>
                  </div>
                  <div>
                    <dt>Zn</dt>
                    <dd>
                      {WATER_TREATMENT_PROFILE.znRange.min}–{WATER_TREATMENT_PROFILE.znRange.max} mg/L
                    </dd>
                  </div>
                  <div>
                    <dt>Pb</dt>
                    <dd>
                      {WATER_TREATMENT_PROFILE.pbRange.min}–{WATER_TREATMENT_PROFILE.pbRange.max} mg/L
                    </dd>
                  </div>
                  <div>
                    <dt>Thể tích mẫu</dt>
                    <dd>
                      {WATER_TREATMENT_PROFILE.volumeRange.min}–{WATER_TREATMENT_PROFILE.volumeRange.max} mL
                    </dd>
                  </div>
                  <div>
                    <dt>Khoảng pH vận hành</dt>
                    <dd>
                      {WATER_TREATMENT_PROFILE.phOperatingMin}–{WATER_TREATMENT_PROFILE.phOperatingMax}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3>Kết quả cần đạt</h3>
                <ul>
                  <li>
                    Nồng độ Fe ≤ <strong>2,0 mg/L</strong>, Zn ≤{' '}
                    <strong>1,0 mg/L</strong>, Pb ≤ <strong>0,1 mg/L</strong>.
                  </li>
                  <li>
                    pH nằm trong khoảng <strong>6–9</strong>.
                  </li>
                  <li>
                    Đáp số tính toán lệch không quá{' '}
                    <strong>±2 điểm %</strong> so với giá trị từ mô hình.
                  </li>
                </ul>
                <p className={styles.small}>
                  Đây là mục tiêu học tập dựa trên QCVN 40:2025/BTNMT cột A,
                  không phải chứng nhận chất lượng nước thải thực.
                </p>
              </div>
            </div>
          </section>

          {/* Nhận biết dụng cụ */}
          <section className={styles.section} aria-labelledby="wt-equipment">
            <h2 id="wt-equipment">Nhận biết dụng cụ và hóa chất</h2>
            <div className={styles.equipmentGuide}>
              {EQUIPMENT.map((item) => (
                <div key={item.kind} className={styles.equipmentItem}>
                  <h3>{item.title}</h3>
                  <p className={styles.equipmentPurpose}>{item.purpose}</p>
                  <dl className={styles.equipmentFacts}>
                    {item.facts.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <ol className={styles.equipmentSteps}>
                    {item.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className={styles.equipmentNote}>{item.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tổng quan bàn làm việc */}
          <figure className={styles.overview}>
            {/* placeholder */}
            <div
              style={{
                width: '100%',
                height: 320,
                background: '#eaf1f6',
                border: '1px solid var(--border)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '.85rem',
                color: 'var(--ink-muted)',
              }}
            >
              Ảnh tổng quan ba bàn làm việc — sẽ bổ sung
            </div>
            <figcaption>
              Ba bàn làm việc trên VECLab: Bàn 1 Pha nước · Bàn 2 Xử lý (khuấy,
              lắng, lọc) · Bàn 3 Cân bằng pH. Hình chụp trước khi pha mẫu.
            </figcaption>
          </figure>

          {/* Vì sao cần ba bàn? */}
          <section className={styles.section} aria-labelledby="wt-principle">
            <h2 id="wt-principle">Vì sao cần ba bàn?</h2>
            <ol className={styles.phases}>
              <li>
                <strong>Bàn 1 — Pha nước</strong>
                <span>Tạo mẫu ban đầu</span>
                <p>
                  Pha mẫu nước tổng hợp chứa Fe, Zn, Pb ở nồng độ xác định.
                </p>
              </li>
              <li>
                <strong>Bàn 2 — Xử lý</strong>
                <span>Khuấy, lắng, lọc</span>
                <p>
                  Thêm NaOH kết tủa kim loại; lắng và lọc tách pha rắn khỏi
                  nước.
                </p>
              </li>
              <li>
                <strong>Bàn 3 — Cân bằng pH</strong>
                <span>pH 6–9 trước khi thải</span>
                <p>
                  Điều chỉnh pH về khoảng cho phép rồi đối chiếu QCVN
                  40:2025.
                </p>
              </li>
            </ol>
            <p className={styles.small}>
              Thứ tự bắt buộc. Bàn 2 cần khóa trước khi chuyển sang Bàn 3.
              Bàn 3 không thể quay lại chỉnh Bàn 2.
            </p>
          </section>

          {/* Quy trình */}
          <section
            className={styles.procedure}
            aria-labelledby="wt-procedure"
          >
            <h2 id="wt-procedure">Quy trình trên workbench</h2>
            <p>
              Thực hiện theo thứ tự dưới đây. pH và nồng độ trong hình là ví
              dụ, không phải phương án tối ưu.
            </p>
            <ol className={styles.steps}>
              {STEPS.map((step, index) => (
                <li key={step.id}>
                  <div className={styles.stepHeading}>
                    <span aria-hidden="true">{index + 1}</span>
                    <h3 id={step.id} tabIndex={-1}>
                      {step.title}
                    </h3>
                  </div>
                  <p className={styles.location}>{step.location}</p>
                  <div
                    className={styles.stepBody}
                    data-illustrated="false"
                  >
                    <div className={styles.stepText}>
                      <p className={styles.tool}>
                        <strong>Công cụ:</strong> {step.tool}
                      </p>
                      <p>{step.before}</p>
                      <ol className={styles.actions}>
                        {step.actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ol>
                      <div className={styles.check}>
                        <strong>Kiểm tra sau thao tác</strong>
                        <p>{step.output}</p>
                      </div>
                      <details className={styles.explanation}>
                        <summary>Vì sao cần bước này?</summary>
                        <p>{step.why}</p>
                      </details>
                    </div>
                  </div>

                  {step.id === 'wt-step-kwh' && (
                    <section
                      className={styles.calculation}
                      aria-labelledby="wt-kwh-calculation"
                    >
                      <h4 id="wt-kwh-calculation">
                        Thứ tự kết tủa của ba kim loại
                      </h4>
                      <p>
                        Fe (III) kết tủa trước ở pH thấp nhất (≈ 2–3), Zn (II)
                        cần pH cao hơn (≈ 6–7), Pb (II) kết tủa khó nhất và
                        cần pH cao nhất (≈ 7–9).
                      </p>
                      <p>
                        Khi kết tủa đủ, phần kim loại đã chuyển sang pha rắn
                        không còn tham gia cân bằng pH tiếp theo.
                      </p>
                    </section>
                  )}

                  {step.id === 'wt-step-check' && (
                    <div className={styles.reportNotes} id="wt-output">
                      <h4>Đọc kết quả theo ba câu hỏi</h4>
                      <ul>
                        <li>
                          <strong>
                            Nồng độ kim loại và pH đã đạt cột A QCVN?
                          </strong>{' '}
                          Kiểm tra bảng đối chiếu từng chỉ tiêu.
                        </li>
                        <li>
                          <strong>
                            Kim loại nào chưa đạt và cần pH cao hơn?
                          </strong>{' '}
                          Xem cột &ldquo;Đạt&rdquo; trong bảng kiểm tra.
                        </li>
                        <li>
                          <strong>
                            Lượt sau cần chú ý điều gì?
                          </strong>{' '}
                          Xem lịch sử lọc từ Bàn 2 để hiểu mức giảm qua từng
                          lần xử lý. Chưa đạt pH ≠ chưa đạt nồng độ; mỗi vấn
                          đề cần cách xử lý riêng.
                        </li>
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* Thuật ngữ */}
          <section className={styles.section} aria-labelledby="wt-terms">
            <h2 id="wt-terms">Thuật ngữ cần biết</h2>
            <dl className={styles.terms}>
              {TERMS.map(([term, definition]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* An toàn */}
          <section className={styles.section} aria-labelledby="wt-limits">
            <h2 id="wt-limits">An toàn & phạm vi mô phỏng</h2>
            <p>
              Chỉ khảo sát kết tủa hydroxide Fe, Zn, Pb trong khoảng pH 6–9.
              Tốc độ khuấy, thời gian lắng và nồng độ NaOH cố định; bài không
              mô phỏng tds, độ đục, vi sinh vật hay các kim loại khác.
            </p>
            <p>
              Không dùng kết quả để thiết kế hệ thống xử lý nước thải thực tế.
              Trong phòng thí nghiệm thật: dùng bảo hộ (găng, kính), làm theo
              hướng dẫn giảng viên, không trộn axit và base trực tiếp, và thải
              chất thải theo quy trình của phòng thí nghiệm.
            </p>
          </section>

          {/* Nguồn */}
          <section
            className={styles.section + ' ' + styles.sources}
            aria-labelledby="wt-sources"
          >
            <h2 id="wt-sources">Nguồn & giới hạn kết quả</h2>
            <p>
              Kết quả tái hiện phương trình cân bằng hóa học của mô hình, chưa
              phải kiểm chứng thực nghiệm cho VECLab. Tài liệu quy trình không
              chứng nhận hệ số tính toán.
            </p>
            <details>
              <summary>
                Xem {WATER_TREATMENT_SOURCES.length} tài liệu đang sử dụng
              </summary>
              <ul>
                {WATER_TREATMENT_SOURCES.map((source) => (
                  <li key={source.key}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.title} — mở tab mới
                    </a>
                    <p>
                      {source.author} · {source.kind}
                    </p>
                    <p>{source.location}</p>
                    <p>{source.use}</p>
                    <p>{source.limit}</p>
                  </li>
                ))}
              </ul>
            </details>
            <details>
              <summary>Giới hạn của mô hình</summary>
              <ul>
                {[
                  'Mẫu nước tổng hợp chứa Fe, Zn, Pb dạng ion hòa tan; không đại diện cho mọi loại nước thải thực tế.',
                  'Bài không mô phỏng độ đục, tổng chất rắn lơ lửng (TSS), hay vi sinh vật.',
                  'Kết quả đối chiếu QCVN 40:2025 là mục tiêu học tập; không phải chứng nhận nước đạt quy chuẩn thải.',
                  'NaOH và HCl trong bài được cấp sẵn với nồng độ cố định; không mô phỏng pha dung dịch thực tế.',
                ].map((limit) => (
                  <li key={limit}>{limit}</li>
                ))}
              </ul>
            </details>
            <Link href="/evidence">
              Cách sử dụng nguồn &amp; giới hạn mô hình{' '}
              <ArrowRightIcon />
            </Link>
          </section>

          <footer className={styles.end}>
            <p>
              Sẵn sàng thực hành? Mở hướng dẫn &ldquo;Cách…&rdquo; ngay
              trong nhóm thao tác khi cần nhắc lại.
            </p>
            <Link className={styles.returnLink} href={workbenchHref}>
              {id ? 'Tiếp tục lượt thực hành' : 'Vào bàn thực hành'}
              <ArrowRightIcon />
            </Link>
          </footer>
        </article>
      </div>
    </div>
  )
}
