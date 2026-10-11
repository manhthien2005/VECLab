import Link from 'next/link'
import { PLASTIC_TYPES } from '@/domain/experiments/plastic-separation/model.js'

const SECTIONS = [
  { id: 'boi-canh', label: 'Bối cảnh và mục tiêu' },
  { id: 'mau-ban-dau', label: 'Mẫu ban đầu' },
  { id: 'quy-trinh', label: 'Quy trình và kết quả' },
  { id: 'tham-so', label: 'Điều kiện nghiên cứu' },
  { id: 'dien-giai', label: 'Cách đọc số liệu' },
  { id: 'gioi-han', label: 'Giả định và giới hạn' },
  { id: 'nguon', label: 'Nguồn khoa học' },
] as const

const STUDY_STAGES = [
  {
    step: 'Nước máy',
    floats: 'PP, HDPE',
    sinks: 'PS, ABS, PA, PC',
    recovery: 'Nhóm PP + HDPE: 97,5%',
  },
  {
    step: 'Ethanol 23% v/v',
    floats: 'PP (bắt đầu tách)',
    sinks: 'HDPE',
    recovery: 'PP: 95,60%',
  },
  {
    step: 'Ethanol 31% v/v',
    floats: 'PP',
    sinks: 'HDPE',
    recovery: 'Tách hoàn toàn; HDPE: 99,70%',
  },
  {
    step: 'NaCl 11–12% w/v',
    floats: 'PS',
    sinks: 'ABS, PA, PC',
    recovery: 'PS: 80,3%',
  },
  {
    step: 'NaCl 20% w/v',
    floats: 'ABS',
    sinks: 'PA, PC',
    recovery: 'ABS: 84,8%',
  },
  {
    step: 'NaCl 40% w/v',
    floats: 'PA',
    sinks: 'PC',
    recovery: 'PA: 70%; PC: 95,4%',
  },
] as const

export function PlasticSeparationDetail() {
  return (
    <div className="page stack-loose">
      <nav aria-label="Breadcrumb">
        <Link className="small" href="/experiments">← Về danh mục thí nghiệm</Link>
      </nav>

      <header className="stack">
        <div className="row">
          <span className="badge badge-mono badge-accent">mô phỏng nghiên cứu</span>
          <span className="badge badge-mono">6 loại polymer</span>
        </div>
        <h1>Phân loại nhựa nguyên sinh</h1>
        <p className="lede">
          Tìm hiểu cách tách sáu polymer bằng phương pháp nổi–chìm, dựa trên sự khác nhau giữa khối lượng riêng của hạt và dung dịch.
        </p>
        <div className="row">
          <Link className="btn btn-primary btn-lg" href="/simulate/plastic-density-separation">
            Bắt đầu mô phỏng
          </Link>
          <a className="btn btn-lg" href="#nguon">Xem nguồn khoa học</a>
        </div>
      </header>

      <div className="with-toc">
        <div className="stack-loose">
          <section className="card stack-tight" id="boi-canh">
            <h2>Bối cảnh và mục tiêu</h2>
            <p className="small">
              Bài báo nghiên cứu việc phân tách các polymer nguyên sinh và nhựa sau tiêu dùng bằng kỹ thuật nổi–chìm. Trang này tập trung vào phần polymer nguyên sinh: dùng nước để tách nhóm nhẹ PP + HDPE khỏi nhóm nặng PS, ABS, PA và PC; sau đó xử lý riêng từng nhóm bằng ethanol hoặc NaCl.
            </p>
            <p className="small muted">
              Quy tắc phân loại: hạt có khối lượng riêng thấp hơn dung dịch nổi lên; hạt có khối lượng riêng cao hơn dung dịch chìm xuống.
            </p>
          </section>

          <section className="card stack-tight" id="mau-ban-dau">
            <h2>Mẫu ban đầu</h2>
            <p className="small">
              Nghiên cứu dùng sáu loại nhựa nguyên sinh. Các giá trị dưới đây là khối lượng riêng của các grade mẫu được nêu trong Bảng 1 của bài báo; chúng không đại diện cho mọi sản phẩm cùng loại.
            </p>
            <div className="table-scroll">
              <table>
                <caption className="visually-hidden">Polymer và khối lượng riêng mẫu trong nghiên cứu</caption>
                <thead>
                  <tr><th scope="col">Polymer</th><th scope="col">Khối lượng riêng</th></tr>
                </thead>
                <tbody>
                  {PLASTIC_TYPES.map((polymer) => (
                    <tr key={polymer.id}>
                      <th scope="row">{polymer.id} · {polymer.name}</th>
                      <td>{polymer.density.toFixed(3).replace('.', ',')} g/cm³</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small faint">
              Mô phỏng dùng màu hạt để phân biệt polymer. Màu sắc không phải đặc tính nhận diện được công bố cho từng loại trong mô hình.
            </p>
          </section>

          <section className="card stack-tight" id="quy-trinh">
            <h2>Quy trình và kết quả nổi–chìm</h2>
            <p className="small">
              Bảng tóm tắt các kết quả được công bố cho từng môi trường. Nhánh ethanol tiếp tục xử lý phần PP + HDPE nổi trong nước; nhánh NaCl xử lý phần PS + ABS + PA + PC chìm trong nước.
            </p>
            <div className="table-scroll">
              <table>
                <caption className="visually-hidden">Kết quả phân tách polymer nguyên sinh trong nghiên cứu</caption>
                <thead>
                  <tr>
                    <th scope="col">Môi trường</th>
                    <th scope="col">Nổi</th>
                    <th scope="col">Chìm</th>
                    <th scope="col">Thu hồi được báo cáo</th>
                  </tr>
                </thead>
                <tbody>
                  {STUDY_STAGES.map((stage) => (
                    <tr key={stage.step}>
                      <th scope="row">{stage.step}</th>
                      <td>{stage.floats}</td>
                      <td>{stage.sinks}</td>
                      <td>{stage.recovery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small faint">
              Trong kết quả ở 23% ethanol, PP bắt đầu tách khỏi HDPE; ở 31% ethanol, bài báo mô tả hai polymer được tách hoàn toàn.
            </p>
          </section>

          <section className="card stack-tight" id="tham-so">
            <h2>Điều kiện nghiên cứu</h2>
            <dl className="meta-list">
              <dt>Nguyên liệu</dt><dd>Sáu polymer nguyên sinh; bài báo nêu 2,0 kg cho mỗi polymer</dd>
              <dt>Thiết bị</dt><dd>Bể pilot dung tích hữu ích 800 L</dd>
              <dt>Khuấy</dt><dd>160 vòng/phút trong 1 giờ</dd>
              <dt>Làm ráo mẫu</dt><dd>Ly tâm 2.950 vòng/phút</dd>
              <dt>Nồng độ ethanol</dt><dd>Phần trăm thể tích, v/v</dd>
              <dt>Nồng độ NaCl</dt><dd>Phần trăm khối lượng/thể tích, w/v</dd>
            </dl>
            <p className="small faint">
              Đây là điều kiện của nghiên cứu pilot được dẫn nguồn, không phải thiết lập mà mô phỏng hiện tại đang tính toán hay điều khiển.
            </p>
          </section>

          <section className="card stack-tight" id="dien-giai">
            <h2>Cách đọc số liệu</h2>
            <ul className="stack-tight small">
              <li><strong>Thu hồi</strong> là tỷ lệ khối lượng polymer thu được so với lượng polymer ban đầu theo cách tính của nghiên cứu.</li>
              <li>Thu hồi không đồng nghĩa với độ tinh khiết. Bài báo không cung cấp số độ tinh khiết cho từng bước phân tách polymer nguyên sinh trong bảng trên.</li>
              <li>Các tỷ lệ được gắn với điều kiện và mẫu của bài báo; không nội suy sang nồng độ khác hoặc xem là kết quả của mọi grade nhựa.</li>
            </ul>
          </section>

          <section className="card stack-tight" id="gioi-han">
            <h2>Giả định và giới hạn</h2>
            <ul className="stack-tight small">
              <li>Mô phỏng biểu diễn kết quả nổi/chìm theo các nồng độ đã công bố, không mô phỏng động học lắng, khuấy, ly tâm hay cân bằng khối lượng thực nghiệm.</li>
              <li>Bài báo có chỗ không nhất quán về ethanol: phần Results mô tả PP bắt đầu tách ở 23% v/v với thu hồi 95,60%, và tách hoàn toàn ở 31% v/v với thu hồi HDPE 99,70%; phần Abstract và Conclusion ghi mốc/nội dung khác nhau.</li>
              <li>Để nhất quán với các kết quả trong mô phỏng, trang này theo phần Results và Hình 6. Cần đọc con số ethanol như kết quả được trích từ phần đó, có lưu ý về mâu thuẫn trong chính bài báo.</li>
              <li>Mô phỏng phục vụ học tập, không thay thế quy trình vận hành hoặc hướng dẫn an toàn trong phòng thí nghiệm.</li>
            </ul>
          </section>

          <section className="card stack-tight" id="nguon">
            <h2>Nguồn khoa học</h2>
            <p className="small">
              Meneses Quelal, W. O., Velázquez-Martí, B., &amp; Ferrer Gisbert, A. (2022). “Separation of virgin plastic polymers and post-consumer mixed plastic waste by sinking-flotation technique.” <em>Environmental Science and Pollution Research</em>, 29, 1364–1374. Bài báo nhận ngày 9/3/2021, chấp nhận ngày 20/7/2021 và đăng trực tuyến ngày 5/8/2021.
            </p>
            <p className="small">
              DOI: <a href="https://doi.org/10.1007/s11356-021-15611-w" target="_blank" rel="noreferrer">10.1007/s11356-021-15611-w</a>
            </p>
            <p className="small faint">
              Các nồng độ và tỷ lệ thu hồi trên trang này được chép từ phần Experimental procedure/Results của bài báo; điều kiện và giới hạn được ghi riêng để không nhầm kết quả nghiên cứu với tính năng mô phỏng.
            </p>
          </section>

          <div className="row">
            <Link className="btn btn-primary" href="/simulate/plastic-density-separation">Bắt đầu mô phỏng</Link>
            <Link className="btn btn-ghost" href="/experiments">Về danh mục thí nghiệm</Link>
          </div>
        </div>

        <nav className="toc no-print" aria-label="Mục lục trang">
          <p className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Trên trang này</p>
          <ol>
            {SECTIONS.map((section) => (
              <li key={section.id}><a href={`#${section.id}`}>{section.label}</a></li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}
