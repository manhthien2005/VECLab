import Link from 'next/link'
import Image from 'next/image'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import { SOAP_PROFILE } from '@/domain/experiments/soap/model.js'
import { SOAP_LIMITS, SOAP_SOURCES, SOAP_SOURCED_FORMULAS } from '@/content/evidence/soap.js'
import styles from '@/features/experiment-guide/article.module.css'
import local from './guide.module.css'

const REQ = SOAP_PROFILE.requirements

const STEPS = [
  {
    id: 'soap-step-pick',
    title: 'Chọn cốc và đọc hướng dẫn',
    input: 'Kính và găng đã đeo sẵn. Chưa chọn cốc thì chưa hiện công thức hay yêu cầu.',
    output: 'Cốc đang chọn hiện công thức có nguồn bên trái và yêu cầu để đạt bên phải.',
    why: 'Mỗi cốc có thao tác riêng. Đọc yêu cầu trước khi rót giúp tránh sai thứ tự và vượt thể tích.',
  },
  {
    id: 'soap-step-lye',
    title: 'Pha dung dịch kiềm',
    input: 'Cốc kiềm trống hoặc đang pha.',
    output: 'Cốc có nước và NaOH đã hòa tan; nhiệt ≤ ' + REQ.lyeTemperatureMaxC + ' °C sau khi bấm Nguội kiềm.',
    why: 'NaOH vào nước. Rót nước vào NaOH rắn làm vỡ cốc và thí nghiệm thất bại.',
  },
  {
    id: 'soap-step-oil',
    title: 'Chọn loại dầu và rót dầu',
    input: 'Cốc dầu trống hoặc đang có dầu; loại dầu đã chọn (mặc định ô liu).',
    output: 'Cốc dầu có dầu theo mL đã rót; ô quy đổi cho biết gam theo mật độ.',
    why: 'Loại dầu quyết định SAP và mật độ. Gam dầu thật lấy từ mL đã rót để tự tính NaOH.',
  },
  {
    id: 'soap-step-mix',
    title: 'Trộn kiềm với dầu',
    input: 'Cốc kiềm và cốc dầu đã có dung dịch; cốc trộn sẵn sàng nhận.',
    output: 'Cốc trộn có cả kiềm và dầu, đã khuấy, rồi đã chờ dung dịch đặc lại.',
    why: 'Khuấy thiếu một thành phần bị từ chối. Thêm kiềm khác chỉ số (nồng độ lệch > 1 %) cũng bị từ chối.',
  },
  {
    id: 'soap-step-mold',
    title: 'Đổ khuôn, ủ và đo mẫu',
    input: 'Hỗn hợp đã khuấy trong cốc trộn; khuôn trống; còn chỗ cho mẫu mới.',
    output: 'Một mẫu thử với pH và khối lượng đã lưu trong sổ đo.',
    why: 'Thứ tự khóa: đổ khuôn → ' + SOAP_PROFILE.gelHours + ' giờ → tháo khuôn → ' + SOAP_PROFILE.cureWeeks + ' tuần → đo. Tối đa ' + SOAP_PROFILE.maxSamples + ' mẫu.',
  },
  {
    id: 'soap-step-finish',
    title: 'Hoàn thành và đọc điểm',
    input: 'Có ít nhất một mẫu thử, hoặc thí nghiệm đã thất bại vì vỡ cốc.',
    output: 'Báo cáo khóa lượt; từng mẫu hiện đủ tiêu chí đạt / chưa đạt.',
    why: 'Một mẫu đạt mọi yêu cầu là thí nghiệm đạt. Thiếu phép đo hiện N/A, không điền 0.',
  },
] as const

type StepDetail = { tool: string; location: string; actions: string[] }

const DETAILS: Record<(typeof STEPS)[number]['id'], StepDetail> = {
  'soap-step-pick': {
    tool: 'Hàng chọn cốc và khung công thức / yêu cầu',
    location: 'Khu vực thực hành → chọn W / O / M / D',
    actions: [
      'Chọn một cốc trên hàng dưới hoặc ô Thao tác.',
      'Đọc công thức có nguồn (trái) và yêu cầu để đạt (phải).',
      'Dùng thẻ bước phía trên để xem trước / sau; nút “Chọn …” nhảy đúng cốc của bước.',
    ],
  },
  'soap-step-lye': {
    tool: 'Cốc kiềm · nước · NaOH',
    location: 'Chọn W → Thao tác',
    actions: [
      'Nhập thể tích nước (mL) rồi bấm Rót nước.',
      'Nhập khối lượng NaOH (g) rồi bấm Rót kiềm (NaOH).',
      'Bấm Nguội kiềm khi dung dịch còn nóng. Có thể Đổ dung dịch sang cốc trộn hoặc Làm lại.',
    ],
  },
  'soap-step-oil': {
    tool: 'Cốc dầu · loại dầu · thể tích',
    location: 'Chọn O → Thao tác',
    actions: [
      'Chọn loại dầu (ô liu / dừa / cọ).',
      'Nhập thể tích dầu (mL); xem ô quy đổi (g) rồi bấm Rót dầu.',
      'Muốn đổi loại: loại bỏ dầu cũ (và đổ bỏ hỗn hợp nếu còn dầu ở cốc trộn) trước.',
    ],
  },
  'soap-step-mix': {
    tool: 'Cốc trộn · khuấy tay hoặc máy',
    location: 'Chọn M → Thao tác',
    actions: [
      'Rót kiềm và rót dầu theo mL (có nút Hết cốc).',
      'Khi mới có một thành phần: có thể đổ lại về cốc nguồn. Khi đủ hai: đổ bỏ hoặc làm lại hỗn hợp.',
      'Khuấy máy hoặc khuấy tay một lần, rồi Chờ dung dịch đặc lại.',
    ],
  },
  'soap-step-mold': {
    tool: 'Khuôn silicone · pH và cân',
    location: 'Chọn D → Thao tác',
    actions: [
      'Bấm lần lượt: Đổ khuôn → Chờ ' + SOAP_PROFILE.gelHours + ' giờ → Tháo khuôn → Đợi ' + SOAP_PROFILE.cureWeeks + ' tuần → Đo pH và cân.',
      'Mỗi lần đo lưu thành mẫu thử trong Sổ đo.',
      'Có thể làm thêm mẫu nếu chưa đủ ' + SOAP_PROFILE.maxSamples + ' và khuôn trống.',
    ],
  },
  'soap-step-finish': {
    tool: 'Nút hoàn thành và báo cáo',
    location: 'Thao tác (khuôn hoặc thẻ thất bại) → Hoàn thành thí nghiệm',
    actions: [
      'Khi có ≥ 1 mẫu (hoặc đã thất bại), bấm Hoàn thành thí nghiệm.',
      'Đọc từng tiêu chí của từng mẫu trong báo cáo.',
      'Làm lượt mới từ liên kết trong báo cáo nếu cần.',
    ],
  },
}

const EQUIPMENT = [
  { file: 'ppe.webp', name: 'Kính và găng', alt: 'Găng xanh, kính bảo hộ và áo blouse trong phòng thí nghiệm', purpose: 'Luôn đeo sẵn. Găng cầm cốc khi rót và khi tháo khuôn.', note: 'Ảnh nhận diện PPE; workbench coi kính và găng đã đeo sẵn.' },
  { file: 'naoh-water.jpg', name: 'NaOH và nước', alt: 'Rót dung dịch vào cốc thủy tinh trên bàn thí nghiệm', purpose: 'Pha dung dịch kiềm. Luôn rót NaOH vào nước.', note: 'Ảnh minh họa pha dung dịch; không phải công thức NaOH của bài.' },
  { file: 'oils.webp', name: 'Dầu (ô liu / dừa / cọ)', alt: 'Rót chất lỏng vàng từ cốc thủy tinh vào cốc đong', purpose: 'Nguyên liệu béo; mỗi loại có SAP và mật độ riêng.', note: 'Ảnh minh họa rót dầu; loại dầu và khối lượng do bạn chọn trên bàn.' },
  { file: 'beaker.jpg', name: 'Cốc chịu nhiệt', alt: 'Cốc đong thủy tinh borosilicate có vạch thể tích', purpose: 'Cốc kiềm, dầu và trộn với dung tích cố định trên bàn.', note: 'Ảnh nhận diện cốc; dung tích trên bàn không đổi theo mẻ.' },
  { file: 'mold.png', name: 'Khuôn silicone', alt: 'Khuôn silicone nhiều ngăn dùng đổ bánh xà phòng', purpose: 'Đổ hỗn hợp, gel, tháo bánh và ủ.', note: 'Ảnh nhận diện khuôn; trên bàn mỗi lần đổ là một mẫu thử.' },
  { file: 'meter.png', name: 'pH và cân', alt: 'Máy đo pH cầm tay và cân phân tích phòng thí nghiệm', purpose: 'Đo mẫu đã ủ. Thiếu phép đo hiện N/A.', note: 'Ảnh nhận diện thiết bị đo; mô phỏng không tái hiện đúng mẫu máy trong ảnh.' },
]

const GLOSSARY = [
  ['SAP', 'Chỉ số xà phòng hóa: gam NaOH cần cho 1 g dầu (sau khi đổi từ mg KOH/g). Engine dùng giá trị giữa khoảng đã khóa.'],
  ['Superfat (S)', 'Phần dầu không bị xà phòng hóa. S thực tính từ lượng NaOH và dầu thật trong hỗn hợp.'],
  ['Nồng độ kiềm (c%)', 'w = m(NaOH) / (m(NaOH) + m(nước)); c% = 100 × w (IUPAC mass fraction). Khoảng đạt trên bàn là tiêu chí học tập.'],
  ['Đặc lại (trace)', 'Hỗn hợp đủ đặc để đổ khuôn. Bài nén thời gian bằng nút chờ sau khi đã khuấy.'],
  ['Seizing', 'Hỗn hợp đông cứng trong cốc khi khuấy máy lúc còn quá nóng quá lâu (ngưỡng là quy ước game).'],
  ['Mẫu thử', 'Một lần đổ khuôn–ủ–đo. Tối đa ' + SOAP_PROFILE.maxSamples + ' mẫu; một mẫu đạt mọi yêu cầu là đạt thí nghiệm.'],
] as const

export function SoapGuide({ attemptId }: { attemptId: string | undefined }) {
  const resume = '/simulate/cold-process-soap' + (attemptId ? '?attempt=' + encodeURIComponent(attemptId) : '')
  return <div className={'page ' + styles.guide}>
    <Breadcrumbs items={[
      { label: 'Trang chủ', href: '/' },
      { label: 'Thí nghiệm', href: '/experiments' },
      { label: 'Xà phòng hóa', href: '/experiments/cold-process-soap' },
      { label: 'Lý thuyết & cách làm' },
    ]}/>
    <header className={styles.header}>
      <div>
        <h1>Xà phòng hóa: lý thuyết & cách làm</h1>
        <p>Pha kiềm đúng chiều, trộn với dầu, chờ đặc lại, đổ khuôn và đo mẫu. Mỗi bước ghi rõ công cụ, thao tác và kết quả cần kiểm tra.</p>
      </div>
      <Link className={styles.returnLink} href={resume}>{attemptId ? 'Quay lại lượt đang làm' : 'Bắt đầu thực hành'}<ArrowRightIcon/></Link>
    </header>
    <div className={styles.readingLayout}>
      <aside className={styles.rail}>
        <nav className={styles.contents} aria-label="Tra nhanh các bước">
          <h2>Tra nhanh các bước</h2>
          <ol>{STEPS.map((step) => <li key={step.id}><a href={'#' + step.id}>{step.title}</a></li>)}</ol>
        </nav>
        <p>Đang làm? Chọn đúng cốc trên bàn rồi thao tác trong bảng Thao tác. Công thức bên trái chỉ hiện mục đã gắn nguồn.</p>
      </aside>
      <article className={styles.article} aria-label="Hướng dẫn thực hành xà phòng hóa">
        <section className={styles.section} aria-labelledby="soap-objective">
          <h2 id="soap-objective">Trước khi bắt đầu</h2>
          <p>Làm bánh xà phòng cold process trên workbench: tự tính lượng NaOH và nước theo dầu đã chọn, pha kiềm, trộn, ủ và đo. Tối đa {SOAP_PROFILE.maxSamples} mẫu thử.</p>
          <div className={styles.preparation}>
            <div>
              <h3>Đầu vào của bài</h3>
              <dl className={styles.facts}>
                <div><dt>Dầu</dt><dd>Ô liu / dừa / cọ · thể tích bạn tự rót (mL)</dd></div>
                <div><dt>Kiềm</dt><dd>NaOH rắn + nước (bạn tự nhập lượng)</dd></div>
                <div><dt>Nhiệt dầu</dt><dd>{SOAP_PROFILE.oilTemperatureC} °C (cố định)</dd></div>
                <div><dt>Nhiệt phòng</dt><dd>{SOAP_PROFILE.roomTemperatureC} °C</dd></div>
              </dl>
            </div>
            <div>
              <h3>Kết quả cần đạt</h3>
              <ul>
                <li>Nồng độ NaOH {Math.round(REQ.lyeConcentration.min * 100)}–{Math.round(REQ.lyeConcentration.max * 100)} % (công thức theo IUPAC; khoảng đạt là tiêu chí học tập).</li>
                <li>Kiềm ≤ {REQ.lyeTemperatureMaxC} °C khi đổ; ΔT với dầu ≤ {REQ.deltaTMaxC} °C.</li>
                <li>Superfat {Math.round(REQ.superfat.min * 100)}–{Math.round(REQ.superfat.max * 100)} %; đã đặc lại trước khi đổ khuôn.</li>
                <li>pH sau ủ {REQ.ph.min}–{REQ.ph.max}. Một mẫu đạt mọi yêu cầu là đạt.</li>
              </ul>
              <p className={styles.small}>Thiếu phép đo hiện N/A, không điền 0. Không dùng số mô phỏng để nấu xà phòng thật.</p>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="soap-cups">
          <h2 id="soap-cups">Nhận biết các cốc trên bàn thực hành</h2>
          <dl className={local.cupMap}>
            <div><dt>W · Cốc kiềm</dt><dd>Rót nước, rót NaOH, nguội kiềm, đổ sang cốc trộn hoặc làm lại.</dd></div>
            <div><dt>O · Cốc dầu</dt><dd>Chọn loại dầu, rót theo mL, loại bỏ dầu cũ khi cần đổi loại.</dd></div>
            <div><dt>M · Cốc trộn</dt><dd>Rót kiềm và dầu, khuấy, chờ đặc lại, đổ bỏ hoặc làm lại hỗn hợp.</dd></div>
            <div><dt>D · Khuôn</dt><dd>Đổ khuôn, chờ gel, tháo khuôn, ủ rồi đo pH và cân thành mẫu thử.</dd></div>
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="soap-equipment">
          <h2 id="soap-equipment">Dụng cụ và vai trò</h2>
          <div className={styles.equipment}>{EQUIPMENT.map((item) => (
            <figure key={item.file}>
              <div className={styles.equipmentPhoto}>
                <Image src={'/assets/soap-equipment/' + item.file} alt={item.alt} fill sizes="(max-width:600px) 100px, 240px"/>
              </div>
              <figcaption><strong>{item.name}</strong><p>{item.purpose}</p><small>{item.note}</small></figcaption>
            </figure>
          ))}</div>
          <p className={styles.small}>Ảnh dụng cụ dùng để nhận biết; không phải bằng chứng kết quả mô phỏng. Ảnh chụp từng bước trên VECLab vẫn chờ bổ sung.</p>
        </section>

        <section className={styles.section} aria-labelledby="soap-principle">
          <h2 id="soap-principle">Vì sao thứ tự rót quan trọng?</h2>
          <div className={local.routes}>
            <div>
              <h3>Đúng</h3>
              <p>Nước vào cốc → NaOH vào nước → nguội → đổ kiềm vào dầu đã chuẩn bị → khuấy → đặc lại → đổ khuôn.</p>
            </div>
            <div>
              <h3>Sai nguy hiểm</h3>
              <p>NaOH rắn trước, rồi rót nước vào: cốc vỡ, thí nghiệm thất bại, không có bánh.</p>
            </div>
          </div>
          <p>Hòa tan NaOH tỏa nhiệt. Đổ kiềm còn nóng vào dầu làm ΔT lớn và dễ hỏng chỉ tiêu mẫu.</p>
        </section>

        <section className={styles.procedure} aria-labelledby="soap-procedure">
          <h2 id="soap-procedure">Thực hiện trên workbench</h2>
          <p>Làm theo thứ tự dưới. Ảnh chụp từng bước sẽ bổ sung sau; hiện chỉ có mô tả thao tác.</p>
          <ol className={styles.steps}>{STEPS.map((step, index) => {
            const detail = DETAILS[step.id]
            return <li key={step.id}>
              <div className={styles.stepHeading}><span aria-hidden="true">{index + 1}</span><h3 id={step.id} tabIndex={-1}>{step.title}</h3></div>
              <p className={styles.location}>{detail.location}</p>
              <div className={styles.stepBody} data-illustrated="false">
                <div className={styles.stepText}>
                  <p className={styles.tool}><strong>Công cụ:</strong> {detail.tool}</p>
                  <p>{step.input}</p>
                  <ol className={styles.actions}>{detail.actions.map((action) => <li key={action}>{action}</li>)}</ol>
                  <div className={styles.check}><strong>Kiểm tra sau thao tác</strong><p>{step.output}</p></div>
                  <details className={styles.explanation}><summary>Vì sao cần bước này?</summary><p>{step.why}</p></details>
                </div>
              </div>
              {step.id === 'soap-step-finish' && <div className={styles.reportNotes}>
                <h4>Đọc báo cáo theo ba câu hỏi</h4>
                <ul>
                  <li><strong>Có mẫu đạt không?</strong> Một mẫu đạt mọi yêu cầu là thí nghiệm đạt.</li>
                  <li><strong>Tiêu chí nào trượt?</strong> Xem nồng độ, nhiệt, superfat, đặc lại, pH của từng mẫu.</li>
                  <li><strong>Lượt sau sửa gì?</strong> Phân biệt thất bại an toàn (vỡ cốc) với mẫu chưa đạt chất lượng.</li>
                </ul>
              </div>}
            </li>
          })}</ol>
        </section>

        <section className={styles.section} aria-labelledby="soap-calculation">
          <h2 id="soap-calculation">Công thức đã gắn nguồn</h2>
          <p>Chỉ hiện mục trạng thái A. Các giả định game (η, nước còn sau ủ, đường cong pH theo S, …) không gắn như đã xác nhận.</p>
          <div className={styles.calculation}>
            {SOAP_SOURCED_FORMULAS.map((item) => (
              <div key={item.key}>
                <h3>{item.title}</h3>
                {item.lines.map((line) => <p key={line} className={line === item.lines[0] ? styles.formula : styles.small}>{line}</p>)}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="soap-troubleshooting">
          <h2 id="soap-troubleshooting">Khi chưa thao tác được</h2>
          <details className={styles.explanation}><summary>Vượt quá thể tích cốc</summary><p>Giảm lượng nhập hoặc dùng Hết cốc với nguồn nhỏ hơn. Dung tích cốc cố định trên bàn.</p></details>
          <details className={styles.explanation}><summary>Dung dịch kiềm chưa hợp lệ</summary><p>Cần hòa tan NaOH trong nước trước khi nguội hoặc đổ sang cốc trộn. Đọc lại mô tả bước pha kiềm.</p></details>
          <details className={styles.explanation}><summary>Không khuấy / không đổ khuôn</summary><p>Khuấy cần cả kiềm và dầu. Đổ khuôn cần đã khuấy. Chờ đặc lại cần đã khuấy một lần.</p></details>
          <details className={styles.explanation}><summary>Không đổi được loại dầu</summary><p>Trong cốc dầu hoặc cốc trộn còn dầu. Loại bỏ dầu cũ hoặc đổ bỏ hỗn hợp trước khi đổi loại.</p></details>
        </section>

        <section className={styles.section} aria-labelledby="soap-terms">
          <h2 id="soap-terms">Thuật ngữ cần biết</h2>
          <dl className={styles.terms}>{GLOSSARY.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
        </section>

        <section className={styles.section} aria-labelledby="soap-limits">
          <h2 id="soap-limits">An toàn & phạm vi mô phỏng</h2>
          <p>Trong phòng thí nghiệm thật: bảo hộ, tủ hút nếu cần, và quy trình của giảng viên. NaOH ăn da và mắt. Bài này không hướng dẫn nấu xà phòng tại nhà.</p>
          <p>Nhiệt, thời gian nguội/ủ và một số ngưỡng đạt là mô hình học tập đã khóa. Hình cốc và hiệu ứng chỉ minh họa trạng thái đã lưu, không tạo phép đo.</p>
          <ul>{SOAP_LIMITS.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className={styles.section + ' ' + styles.sources} aria-labelledby="soap-sources">
          <h2 id="soap-sources">Nguồn phương pháp</h2>
          <p>Chỉ liệt kê nguồn trạng thái A (có URL). Mục chưa đủ nguồn không hiện như đã xác nhận.</p>
          <details>
            <summary>Xem {SOAP_SOURCES.length} tài liệu đang sử dụng</summary>
            <ul>{SOAP_SOURCES.map((source) => (
              <li key={source.key}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} — mở tab mới</a>
                <p>{source.author} · {source.kind}</p>
                <p>{source.use}</p>
                <p>{source.limit}</p>
              </li>
            ))}</ul>
          </details>
          <details>
            <summary>Ảnh hướng dẫn</summary>
            <p>Chưa gắn ảnh dụng cụ hay ảnh chụp bước. Khi có đường dẫn sẽ bổ sung vào mục Dụng cụ và từng bước thao tác.</p>
          </details>
          <Link href="/evidence">Cách sử dụng nguồn & giới hạn mô hình <ArrowRightIcon/></Link>
        </section>

        <footer className={styles.end}>
          <p>Chọn đúng cốc trước mỗi thao tác. Công thức có nguồn nằm cạnh cốc trên bàn thực hành.</p>
          <Link className={styles.returnLink} href={resume}>{attemptId ? 'Tiếp tục lượt thực hành' : 'Vào bàn thực hành'}<ArrowRightIcon/></Link>
        </footer>
      </article>
    </div>
  </div>
}
