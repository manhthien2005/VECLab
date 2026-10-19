import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ArrowRightIcon } from '@/features/landing/icons.js'
import { PlasticLessonVideos } from '@/features/plastic-separation/lesson-videos.js'
import styles from '@/features/experiment-guide/article.module.css'

export const metadata: Metadata = {
  title: 'Lý thuyết & cách làm bài · Phân loại nhựa nguyên sinh | VECLab',
  description:
    'Hướng dẫn toàn diện quy trình phân loại sáu loại nhựa nguyên sinh bằng phương pháp chìm–nổi qua nước máy, ethanol và NaCl theo nghiên cứu pilot của Meneses Quelal et al. (2022).',
}

const EQUIPMENT_AND_SAMPLES = [
  {
    file: 'pilot-tank',
    name: 'Bể pilot 800 L',
    alt: 'Ảnh thực tế bể pilot phân loại nhựa 800 lít',
    purpose: 'Bể chứa dung dịch phân tách với thể tích hữu ích 800 L, trang bị cánh khuấy 160 rpm để làm ướt hạt.',
    note: 'Quy mô bán công nghiệp phản ánh sát thực tế hơn ống đong phòng lab.',
  },
  {
    file: 'centrifuge',
    name: 'Máy ly tâm tách ẩm',
    alt: 'Ảnh thực tế máy ly tâm tốc độ cao 2.950 rpm',
    purpose: 'Quay ở tốc độ 2.950 rpm để loại bỏ độ ẩm bề mặt và màng dung môi bám dính trên hạt nhựa.',
    note: 'Thực hiện sau tách nước và sau mỗi preset dung dịch trước khi cân khối lượng.',
  },
  {
    file: 'scale',
    name: 'Cân kỹ thuật',
    alt: 'Ảnh thực tế cân kỹ thuật xác định khối lượng mẫu nhựa',
    purpose: 'Xác định khối lượng thực tế của các phân đoạn thu hồi để tính toán hiệu suất thu hồi.',
    note: 'Cơ sở cho phương pháp cân bằng khối lượng vật liệu.',
  },
  {
    file: 'pp',
    name: 'Polypropylene (PP)',
    alt: 'Ảnh thực tế hạt nhựa PP nguyên sinh',
    purpose: 'Tỷ trọng 0,900 g/cm³; hạt tròn trắng đục. Nổi trong nước máy và nổi chọn lọc ở Ethanol 23% v/v.',
    note: 'Thu hồi đạt 95,60% theo bài báo.',
  },
  {
    file: 'hdpe',
    name: 'High-Density Polyethylene (HDPE)',
    alt: 'Ảnh thực tế hạt nhựa HDPE nguyên sinh',
    purpose: 'Tỷ trọng 0,950 g/cm³; hạt trụ vát trắng sữa. Nổi trong nước máy và nổi ở Ethanol 31% v/v.',
    note: 'Thu hồi đạt 99,70% theo bài báo.',
  },
  {
    file: 'ps',
    name: 'Polystyrene (PS)',
    alt: 'Ảnh thực tế mảnh hạt nhựa PS trong suốt',
    purpose: 'Tỷ trọng 1,050 g/cm³; mảnh trong suốt. Chìm trong nước máy và nổi ở NaCl 11–12% w/v.',
    note: 'Thu hồi đạt 80,3% theo bài báo.',
  },
  {
    file: 'abs',
    name: 'ABS nguyên sinh',
    alt: 'Ảnh thực tế mảnh hạt nhựa ABS đen mờ',
    purpose: 'Tỷ trọng 1,070 g/cm³; mảnh đen mờ. Chìm trong nước máy và nổi ở NaCl 20% w/v.',
    note: 'Thu hồi đạt 84,8% theo bài báo.',
  },
  {
    file: 'pa',
    name: 'Polyamide (PA / Nylon)',
    alt: 'Ảnh thực tế mảnh hạt nhựa PA vàng nhạt',
    purpose: 'Tỷ trọng 1,140 g/cm³; mảnh dẹt vàng nhạt. Chìm trong nước máy và nổi ở NaCl 40% w/v.',
    note: 'Thu hồi đạt 70,0% theo bài báo.',
  },
  {
    file: 'pc',
    name: 'Polycarbonate (PC)',
    alt: 'Ảnh thực tế mảnh hạt nhựa PC xanh lam nhạt',
    purpose: 'Tỷ trọng 1,200 g/cm³; mảnh xanh lam nhạt. Chìm trong tất cả các môi trường kể cả NaCl 40% w/v.',
    note: 'Thu hồi đạt 95,4% ở phân đoạn chìm cuối cùng.',
  },
]

const STEPS = [
  {
    id: 'step-prepare',
    title: 'Chuẩn bị 6 mẫu polymer nguyên sinh',
    location: 'Khu vực thao tác → Bước 1',
    tool: 'Khay mẫu 6 loại hạt',
    before: 'Bàn thực hành đã sẵn sàng với mẻ thí nghiệm mới.',
    actions: [
      'Quan sát 6 loại polymer trên kệ dụng cụ: PP, HDPE, PS, ABS, PA, PC.',
      'Mỗi mẫu nguyên sinh có khối lượng 2,0 kg theo mẻ nghiên cứu (tổng 12,0 kg).',
      'Bấm "Chuẩn bị 6 mẫu polymer" để xếp hạt vào khay nạp.',
    ],
    output: 'Khay 6 mẫu sẵn sàng nạp vào bể pilot.',
    why: 'Chuẩn bị mẫu đúng chủng loại và khối lượng định mức 2,0 kg/mẫu để đối chiếu cân bằng vật chất sau này.',
  },
  {
    id: 'step-wetting',
    title: 'Nạp mẫu và làm ướt trong nước máy',
    location: 'Khu vực thao tác → Bước 1 & 2',
    tool: 'Bể pilot 800 L và cánh khuấy 160 rpm',
    before: 'Đã chuẩn bị khay 6 mẫu hạt.',
    actions: [
      'Bấm "Nạp mẫu vào bể pilot" để chuyển toàn bộ 12,0 kg hạt vào bể chứa 800 L nước máy.',
      'Hệ thống khuấy ở 160 rpm trong 1 giờ để làm ướt hoàn toàn bề mặt hạt và giải phóng bọt khí bám dính.',
      'Quan sát hiện tượng phân tầng tỷ trọng: nhóm hạt nhẹ nổi lên bề mặt, nhóm hạt nặng chìm xuống đáy.',
    ],
    output: 'Hạt được làm ướt hoàn toàn, tránh hiện tượng bọt khí làm hạt nặng bị nổi giả tạo.',
    why: 'Bề mặt polymer kỵ nước dễ giữ bọt khí li ti. Khuấy 160 rpm trong 1 giờ là điều kiện bắt buộc của bài báo để hạt phân tầng đúng tỷ trọng biểu kiến.',
  },
  {
    id: 'step-water-separation',
    title: 'Tách sơ bộ bằng nước máy',
    location: 'Khu vực thao tác → Bước 2',
    tool: 'Bể nước máy (ρ ≈ 1,00 g/cm³)',
    before: 'Đã hoàn tất bước làm ướt mẫu.',
    actions: [
      'Ghi nhận hai phân đoạn phân tách:',
      '• Phân đoạn nhẹ nổi (PP + HDPE): tỷ trọng danh định 0,900–0,950 g/cm³ < 1,00 g/cm³.',
      '• Phân đoạn nặng chìm (PS + ABS + PA + PC): tỷ trọng danh định 1,050–1,200 g/cm³ > 1,00 g/cm³.',
      'Bấm "Ghi nhận tách sơ bộ trong nước" để kết thúc phân đoạn nước máy.',
    ],
    output: 'Tách thành công 2 nhóm lớn với tỷ lệ thu hồi nhóm nổi PP+HDPE đạt 97,5%.',
    why: 'Nước máy là môi trường phân loại rẻ nhất và thân thiện môi trường nhất để chia đôi hỗn hợp thành 2 nhánh xử lý độc lập.',
  },
  {
    id: 'step-centrifugation',
    title: 'Ly tâm 2.950 rpm và làm khô phân đoạn',
    location: 'Khu vực thao tác → Bước 3',
    tool: 'Máy ly tâm công nghiệp 2.950 rpm',
    before: 'Đã vớt phân đoạn nổi và chìm ra khỏi bể nước máy.',
    actions: [
      'Đưa các phân đoạn vào lồng máy ly tâm.',
      'Bấm "Ly tâm tách ẩm 2.950 rpm" để máy quay tách ẩm bề mặt và màng dung dịch.',
      'Ghi nhận khối lượng đã làm ráo trước khi chuyển sang các bể dung dịch hóa chất.',
    ],
    output: 'Hạt polymer khô ráo, sạch màng chất lỏng dư thừa.',
    why: 'Dung dịch bám dính sẽ làm sai lệch nồng độ ethanol hoặc NaCl của các bước kế tiếp và gây sai số khi cân khối lượng.',
  },
  {
    id: 'step-branch-solution',
    title: 'Phân loại 2 nhánh dung dịch: Ethanol và NaCl',
    location: 'Khu vực thao tác → Bước 4',
    tool: 'Hai nhánh dung dịch độc lập',
    before: 'Đã ly tâm phân đoạn nổi và chìm sau tách nước.',
    actions: [
      'Bạn có thể làm nhánh nào trước tùy ý:',
      '• Nhánh nhẹ (Ethanol): Chạy preset 23% v/v (PP nổi 95,60%), ly tâm 2.950 rpm, sau đó chạy preset 31% v/v (HDPE nổi 99,70%).',
      '• Nhánh nặng (NaCl): Lần lượt chạy preset S1 11–12% w/v (PS nổi 80,3%), S2 20% w/v (ABS nổi 84,8%), S3 40% w/v (PA nổi 70%, PC chìm 95,4%). Giữa các preset đều ly tâm làm ráo hạt.',
    ],
    output: 'Toàn bộ 6 polymer được phân tách chọn lọc vào các khay thu hồi riêng.',
    why: 'Ethanol điều chỉnh dung dịch có tỷ trọng < 1 để tách PP khỏi HDPE. NaCl tăng tỷ trọng dung dịch lên > 1 để tách dần từng loại trong phân đoạn nặng.',
  },
  {
    id: 'step-summary-report',
    title: 'Tổng kết ma trận 6 khay thu hồi và lưu báo cáo',
    location: 'Khu vực thao tác → Bước 5',
    tool: 'Ma trận khay thu hồi 3×2 và Sổ thực hành',
    before: 'Đã hoàn thành toàn bộ các preset của cả 2 nhánh dung dịch.',
    actions: [
      'Bấm "Xem tổng kết các phân đoạn thu hồi" để hiển thị ma trận 6 khay kết quả.',
      'Kiểm tra từng khay: môi trường tách cuối cùng, hạt thực tế, khối lượng thu hồi và hiệu suất.',
      'Bấm "Hoàn tất mẻ thí nghiệm" để chốt kết quả và mở báo cáo hoàn chỉnh.',
    ],
    output: 'Báo cáo mẻ lưu cố định trên trình duyệt với đầy đủ lịch sử và biểu đồ cân bằng vật chất.',
    why: 'Đánh giá toàn diện hiệu quả phân loại của mẻ pilot so với dữ liệu công bố trong bài báo nghiên cứu.',
  },
]

const TERMS: [string, string][] = [
  [
    'Tỷ trọng biểu kiến · g/cm³',
    'Khối lượng trên một đơn vị thể tích của hạt polymer bao gồm cả lỗ xốp kín. Quyết định trạng thái chìm hay nổi trong môi trường chất lỏng có tỷ trọng xác định.',
  ],
  [
    'Phương pháp chìm–nổi',
    'Kỹ thuật phân tách vật lý dựa trên sự chênh lệch tỷ trọng giữa các hạt rắn và môi trường chất lỏng. Hạt nhẹ hơn sẽ nổi lên mặt, hạt nặng hơn sẽ chìm xuống đáy.',
  ],
  [
    'Phân đoạn nhẹ vs. Phân đoạn nặng',
    'Phân đoạn nhẹ (Light fraction) gồm PP và HDPE nổi trong nước máy. Phân đoạn nặng (Heavy fraction) gồm PS, ABS, PA và PC chìm trong nước máy.',
  ],
  [
    '% v/v vs. % w/v',
    '% v/v là phần trăm thể tích cồn ethanol trên tổng thể tích dung dịch. % w/v là khối lượng muối NaCl (gam) hòa tan trong 100 mL dung dịch nước.',
  ],
  [
    'Hiệu suất thu hồi (Recovery rate) · %',
    'Tỷ lệ phần trăm khối lượng polymer thu hồi được ở khay tương ứng so với 2,0 kg ban đầu: (m thu hồi / m ban đầu) × 100%. Không biểu thị độ tinh khiết hóa học tuyệt đối.',
  ],
  [
    'Tốc độ khuấy 160 rpm & ly tâm 2.950 rpm',
    'Thông số động học cố định theo công bố của Meneses Quelal et al. (2022). Khuấy 160 rpm để làm ướt hạt; ly tâm 2.950 rpm để tách ẩm bề mặt.',
  ],
]

export default function PlasticSeparationGuidePage() {
  const workbenchHref = '/simulate/plastic-density-separation'

  return (
    <div className={`page ${styles.guide}`}>
      <Breadcrumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Thí nghiệm', href: '/experiments' },
          { label: 'Phân loại nhựa', href: '/experiments/plastic-density-separation' },
          { label: 'Lý thuyết & cách làm' },
        ]}
      />

      <header className={styles.header}>
        <div>
          <h1>Phân loại nhựa: lý thuyết & cách làm bài</h1>
          <p>
            Từ nạp 6 mẫu polymer nguyên sinh vào bể pilot 800 L đến tổng kết ma trận khay thu hồi.
            Mỗi bước chỉ rõ công cụ, thao tác và kết quả kiểm tra trên VECLab theo nghiên cứu của Meneses Quelal và cộng sự (2022).
          </p>
        </div>
        <Link className={styles.returnLink} href={workbenchHref}>
          Bắt đầu thực hành
          <ArrowRightIcon />
        </Link>
      </header>

      {/* Video section */}
      <PlasticLessonVideos />

      <div className={styles.readingLayout}>
        <aside className={styles.rail}>
          <nav className={styles.contents} aria-label="Tra nhanh các phần">
            <h2>Tra nhanh các phần</h2>
            <ol>
              <li><a href="#plastic-objective">Trước khi bắt đầu</a></li>
              <li><a href="#plastic-equipment">Nhận biết mẫu & dụng cụ</a></li>
              <li><a href="#plastic-principle">Vì sao cần nhiều giai đoạn?</a></li>
              <li><a href="#plastic-procedure">Quy trình trên workbench</a></li>
              <li><a href="#plastic-terms">Thuật ngữ cần biết</a></li>
              <li><a href="#plastic-limits">An toàn & giới hạn</a></li>
              <li><a href="#plastic-sources">Nguồn & trích dẫn</a></li>
            </ol>
          </nav>
          <p>
            Đang thao tác? Mở nút <strong>“Hướng dẫn thao tác”</strong> ngay ở kệ bên trái bàn thực hành khi cần xem lại các bước.
          </p>
        </aside>

        <article className={styles.article} aria-label="Hướng dẫn thực hành phân loại nhựa nguyên sinh">
          {/* 1. Objective */}
          <section className={styles.section} id="plastic-objective" aria-labelledby="heading-objective">
            <h2 id="heading-objective">Trước khi bắt đầu</h2>
            <p>
              Khảo sát quy trình phân tách chọn lọc 6 loại polymer nguyên sinh phổ biến dựa trên nguyên lý chìm–nổi qua 3 môi trường chất lỏng: nước máy, dung dịch ethanol loãng và dung dịch muối ăn NaCl.
            </p>
            <div className={styles.preparation}>
              <div>
                <h3 id="plastic-profile">Đầu vào của mẻ pilot</h3>
                <dl className={styles.facts}>
                  <div>
                    <dt>Quy mô nghiên cứu</dt>
                    <dd>Pilot bán công nghiệp</dd>
                  </div>
                  <div>
                    <dt>Thể tích hữu ích bể</dt>
                    <dd>800 lít</dd>
                  </div>
                  <div>
                    <dt>Số loại polymer</dt>
                    <dd>6 loại (PP, HDPE, PS, ABS, PA, PC)</dd>
                  </div>
                  <div>
                    <dt>Khối lượng mỗi mẫu</dt>
                    <dd>2,0 kg (tổng mẻ 12,0 kg)</dd>
                  </div>
                  <div>
                    <dt>Chế độ khuấy</dt>
                    <dd>160 rpm · 1 giờ làm ướt</dd>
                  </div>
                  <div>
                    <dt>Chế độ ly tâm</dt>
                    <dd>2.950 rpm tách ẩm bề mặt</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3>Kết quả thu hồi cần đạt (theo bài báo)</h3>
                <ul>
                  <li><strong>Tách nước máy:</strong> PP + HDPE nổi (thu hồi gộp 97,5%); PS, ABS, PA, PC chìm.</li>
                  <li><strong>Nhánh nhẹ Ethanol:</strong> PP nổi ở 23% v/v (thu hồi <strong>95,60%</strong>); HDPE nổi ở 31% v/v (thu hồi <strong>99,70%</strong>).</li>
                  <li><strong>Nhánh nặng NaCl:</strong> PS nổi ở 11–12% w/v (thu hồi <strong>80,3%</strong>); ABS nổi ở 20% w/v (thu hồi <strong>84,8%</strong>); PA nổi ở 40% w/v (thu hồi <strong>70,0%</strong>); PC chìm hoàn toàn (thu hồi <strong>95,4%</strong>).</li>
                </ul>
                <p className={styles.small}>
                  Đây là các số liệu thu hồi vật liệu qua cân bằng khối lượng được công bố trong bài báo khoa học.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Equipment & Samples */}
          <section className={styles.section} id="plastic-equipment" aria-labelledby="heading-equipment">
            <h2 id="heading-equipment">Nhận biết mẫu và thiết bị thực tế</h2>
            <p>
              Hình ảnh chụp mẫu hạt polymer nguyên sinh và trang thiết bị thực tế được sử dụng trong bài thí nghiệm.
            </p>
            <div className={styles.equipment} style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {EQUIPMENT_AND_SAMPLES.map((item) => (
                <figure key={item.file} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', background: 'var(--surface-2)' }}>
                  <div className={styles.equipmentPhoto} style={{ height: '140px', position: 'relative' }}>
                    <Image
                      src={`/assets/plastic-separation/${item.file}.jpg`}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 600px) 90vw, 260px"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <figcaption style={{ marginTop: '10px' }}>
                    <strong>{item.name}</strong>
                    <p style={{ margin: '6px 0', fontSize: '0.8rem', lineHeight: 1.6 }}>{item.purpose}</p>
                    <small style={{ color: 'var(--ink-muted)', fontSize: '0.74rem' }}>{item.note}</small>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className={styles.small}>
              Ảnh thực tế dùng để đối chiếu nhận diện. Thao tác trong mô phỏng được thực hiện qua các nút điều khiển và màn hình telemetry của VECLab.
            </p>
          </section>

          {/* 3. Principles */}
          <section className={styles.section} id="plastic-principle" aria-labelledby="heading-principle">
            <h2 id="heading-principle">Vì sao cần phân tách qua nhiều giai đoạn?</h2>
            <ol className={styles.phases}>
              <li>
                <strong>Pha 1: Nước máy</strong>
                <span>ρ ≈ 1,00 g/cm³</span>
                <p>Chia đôi hỗn hợp thành nhóm nhẹ nổi (PP, HDPE) và nhóm nặng chìm (PS, ABS, PA, PC).</p>
              </li>
              <li>
                <strong>Pha 2: Nhánh Ethanol</strong>
                <span>ρ = 0,93–0,96 g/cm³</span>
                <p>Hạ tỷ trọng môi trường để tách riêng PP (nhẹ nhất) khỏi HDPE bằng 2 cấp nồng độ 23% và 31% v/v.</p>
              </li>
              <li>
                <strong>Pha 3: Nhánh NaCl</strong>
                <span>ρ = 1,07–1,24 g/cm³</span>
                <p>Tăng tỷ trọng môi trường để đẩy lần lượt PS (11%), ABS (20%), PA (40%) nổi lên và giữ PC chìm đáy.</p>
              </li>
            </ol>
            <p className={styles.small}>
              Không có một dung môi đơn lẻ nào có thể tách rời cả 6 loại polymer cùng lúc. Quy trình 3 pha kết hợp ly tâm làm sạch là giải pháp kinh tế và tối ưu nhất được kiểm chứng ở quy mô pilot.
            </p>
          </section>

          {/* 4. Procedure */}
          <section className={styles.section} id="plastic-procedure" aria-labelledby="heading-procedure">
            <h2 id="heading-procedure">Quy trình trên workbench</h2>
            <p>
              Thực hiện lần lượt theo các bước dưới đây trên bàn mô phỏng VECLab:
            </p>
            <ol className={styles.steps}>
              {STEPS.map((step, idx) => (
                <li key={step.id}>
                  <div className={styles.stepHeading}>
                    <span aria-hidden="true">{idx + 1}</span>
                    <h3 id={step.id}>{step.title}</h3>
                  </div>
                  <p className={styles.location}>{step.location}</p>
                  <div className={styles.stepBody}>
                    <div className={styles.stepText}>
                      <p className={styles.tool}>
                        <strong>Công cụ:</strong> {step.tool}
                      </p>
                      <p>{step.before}</p>
                      <ol className={styles.actions}>
                        {step.actions.map((act) => (
                          <li key={act}>{act}</li>
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
                </li>
              ))}
            </ol>
          </section>

          {/* 5. Terminology */}
          <section className={styles.section} id="plastic-terms" aria-labelledby="heading-terms">
            <h2 id="heading-terms">Thuật ngữ cần biết</h2>
            <dl className={styles.terms}>
              {TERMS.map(([term, def]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{def}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 6. Safety & Scope */}
          <section className={styles.section} id="plastic-limits" aria-labelledby="heading-limits">
            <h2 id="heading-limits">An toàn & phạm vi mô phỏng</h2>
            <p>
              Mô hình tái hiện đúng trình tự mẻ pilot, thông số nồng độ, tốc độ khuấy 160 rpm và chế độ ly tâm 2.950 rpm của nghiên cứu.
            </p>
            <p>
              Trong phòng thí nghiệm và nhà xưởng thực tế: cồn ethanol dễ cháy nổ, cần phòng chống cháy nổ nghiêm ngặt; dung dịch muối nồng độ cao (40% w/v) dễ kết tinh và ăn mòn kim loại. Luôn trang bị bảo hộ lao động đầy đủ và tuân thủ quy trình an toàn của cơ sở.
            </p>
          </section>

          {/* 7. Sources */}
          <section className={`${styles.section} ${styles.sources}`} id="plastic-sources" aria-labelledby="heading-sources">
            <h2 id="heading-sources">Nguồn & giới hạn kết quả</h2>
            <p>
              Toàn bộ dữ liệu khoa học, tỷ lệ thu hồi và điều kiện thí nghiệm được truy nguyên trực tiếp từ công bố quốc tế:
            </p>
            <ul>
              <li>
                <a
                  href="https://doi.org/10.1007/s11356-021-15611-w"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Meneses Quelal, O.V., et al. (2022). Pilot-scale sink-float separation of virgin plastics using water, ethanol, and NaCl solutions. Environmental Science and Pollution Research.
                </a>
                <p>Nghiên cứu gốc xây dựng mô hình pilot 800 L và bộ tham số thực nghiệm.</p>
              </li>
            </ul>
            <p className={styles.small}>
              Ảnh chụp mẫu nhựa và thiết bị thực tế do nhóm dự án VECLab thực hiện phục vụ công tác giảng dạy và học tập trực quan.
            </p>
          </section>

          <footer className={styles.end}>
            <p>Sẵn sàng thực hành? Chuyển sang bàn mô phỏng để tự tay thực hiện quy trình phân loại.</p>
            <Link className={styles.returnLink} href={workbenchHref}>
              Vào bàn thực hành
              <ArrowRightIcon />
            </Link>
          </footer>
        </article>
      </div>
    </div>
  )
}
