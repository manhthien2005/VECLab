import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { JAR_PROFILE } from '@/domain/experiments/jar-test/model.js'
import { parseUUID } from '@/shared/ids.js'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs.js'
import { ArrowRightIcon, BookIcon, FlaskIcon, CalculatorIcon, WarningIcon } from '@/features/landing/icons.js'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Jar Test: lý thuyết & cách làm bài',
  description: 'Nguyên lý keo tụ, tạo bông, lắng và hướng dẫn thực hành Jar Test trên VECLab.',
  robots: { index: false, follow: false },
}

/** Read-only teaching content. Visiting this page never creates or writes an attempt. */
export default async function JarGuidePage({ searchParams }: {
  searchParams: Promise<{ attempt?: string | string[] }>
}) {
  const { attempt } = await searchParams
  const id = typeof attempt === 'string' ? parseUUID(attempt) : null
  const workbenchHref = '/simulate/jar-test' + (id ? '?attempt=' + encodeURIComponent(id) : '')
  const phases = [
    ['Khuấy nhanh', JAR_PROFILE.phases.rapid, 'Phân tán phèn trong mẫu.'],
    ['Khuấy chậm', JAR_PROFILE.phases.slow, 'Minh họa sự kết hợp của các hạt thành bông.'],
    ['Lắng', JAR_PROFILE.phases.settling, 'Dừng khuấy, minh họa bông lắng xuống.'],
  ] as const

  return <div className={'page ' + styles.guide}>
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thí nghiệm', href: '/experiments' }, { label: 'Jar Test', href: workbenchHref }, { label: 'Lý thuyết & cách làm bài' }]} />
    <header className={styles.header}>
      <div><h1>Jar Test: lý thuyết & cách làm bài</h1>
        <p>Khảo sát ảnh hưởng của pH ban đầu và liều phèn đến độ đục. Bạn thiết kế các cốc thử, đo kết quả rồi chọn phương án xử lý dựa trên số liệu.</p>
        <Link className={styles.returnLink} href={workbenchHref}>{id ? 'Quay lại lượt đang làm' : 'Mở workbench Jar Test'}<ArrowRightIcon /></Link>
      </div>
      <div className={styles.image}><Image src="/assets/experiments/jar.webp" alt="Minh họa dàn cốc trong thí nghiệm Jar Test" fill sizes="(max-width: 700px) 90vw, 320px" /></div>
    </header>

    <div className={styles.layout}>
      <article className={styles.article}>
        <section aria-labelledby="jar-principle">
          <h2 id="jar-principle"><BookIcon />Hiểu thí nghiệm trước khi làm</h2>
          <p>Mẫu chứa các hạt kaolin lơ lửng, làm nước bị đục. Trong bài Jar Test, phèn nhôm là chất keo tụ; dàn khuấy thực hiện lần lượt ba pha để minh họa quá trình keo tụ, tạo bông và lắng.</p>
          <div className={styles.principles}>
            <div><strong>Keo tụ</strong><p>Cấp phèn và khuấy nhanh để phân tán hóa chất trong mẫu.</p></div>
            <div><strong>Tạo bông</strong><p>Khuấy chậm để minh họa các hạt kết hợp thành bông lớn hơn.</p></div>
            <div><strong>Lắng</strong><p>Dừng khuấy để quan sát bông di chuyển xuống đáy.</p></div>
          </div>
          <p><strong>Độ đục được đọc bằng NTU.</strong> Với cùng mẫu và điều kiện đo, NTU cuối thấp hơn NTU ban đầu cho biết độ đục đã giảm. Không dùng số hạt hay màu nước trong hoạt ảnh để thay cho phép đo.</p>
          <p>pH và liều phèn là hai điều kiện bạn được chọn. Muốn tìm hiểu ảnh hưởng của liều, hãy giữ cùng pH giữa các cốc; muốn so sánh pH, hãy giữ cùng liều. Bài không mặc định rằng càng thêm nhiều phèn thì kết quả càng tốt.</p>
        </section>

        <section aria-labelledby="jar-procedure">
          <h2 id="jar-procedure"><FlaskIcon />Quy trình trên workbench</h2>
          <p>Thực hiện một mẻ với tối đa sáu cốc A–F. Các cốc có thể khác pH và liều phèn, nhưng dùng chung chương trình khuấy và lắng.</p>
          <ol className={styles.steps}>
            <li><h3>Chọn cốc và chuẩn bị mẫu</h3><p>Bấm một cốc trên dàn. Trong <strong>Thao tác → Chuẩn bị mẫu</strong>, chọn pH ban đầu rồi bấm <strong>Chuẩn bị cốc</strong>. Mỗi cốc chứa {JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L mẫu trong cốc {JAR_PROFILE.beakerCapacityL} L. Làm tương tự với các cốc muốn so sánh; không bắt buộc dùng cả sáu.</p><p>pH là điều kiện của mẫu đã chuẩn bị sẵn, không phải pH cuối sau xử lý.</p></li>
            <li><h3>Đo mẫu ban đầu</h3><p>Mở <strong>Sổ đo</strong> và bấm <strong>Đo mẫu ban đầu</strong> trước khi chạy chương trình. Đây là số liệu chung để tính mức giảm đục của các cốc. Số đo chỉ xuất hiện sau khi bạn thực hiện phép đo.</p></li>
            <li><h3>Cấp phèn cho từng cốc</h3><p>Chọn cốc, mở <strong>Thao tác → Cấp phèn</strong>, chọn liều tăng rồi bấm nút thêm phèn. Liều được cộng dồn; kiểm tra <strong>Tổng liều hiện tại</strong> trước mỗi lần thêm.</p><p>Mỗi cốc cần tổng liều từ {JAR_PROFILE.minDoseMgL} đến {JAR_PROFILE.maxDoseMgL} mg/L, theo bước {JAR_PROFILE.doseStepMgL} mg/L. Hoàn tất thiết kế các cốc trước khi khuấy: mẫu và liều sẽ khóa khi chương trình bắt đầu.</p></li>
            <li><h3>Chạy đủ ba pha</h3><p>Trong <strong>Thao tác → Khuấy & lắng</strong>, chạy lần lượt <strong>Khuấy nhanh → Khuấy chậm → Lắng</strong>. Mỗi nút áp dụng cho cả dàn cốc. Thời gian là thời gian mô phỏng; bạn không cần chờ hết số phút ngoài đời thực.</p>
              <div className={styles.tableScroll}><table><caption>Chương trình chung cho các cốc</caption><thead><tr><th scope="col">Pha</th><th scope="col">Tốc độ</th><th scope="col">Thời gian</th></tr></thead><tbody>{phases.map(([name, phase, purpose]) => <tr key={name}><th scope="row" title={purpose}>{name}</th><td>{phase.rpm ? phase.rpm + ' rpm' : 'Dừng khuấy'}</td><td>{phase.durationSeconds < 120 ? phase.durationSeconds + ' giây' : phase.durationSeconds / 60 + ' phút'}</td></tr>)}</tbody></table></div>
            </li>
            <li><h3>Đo độ đục cuối của từng cốc</h3><p>Chọn cốc cần đo, mở <strong>Thao tác → Đo & ghi kết quả</strong>, bấm <strong>Đo độ đục cuối cốc</strong>. Đọc số đo trên máy và trong sổ đo. Lặp lại với các cốc còn lại để có dữ liệu so sánh.</p><p>Nếu đo trước khi chạy đủ ba pha, phép đo được lưu với <strong>N/A</strong>. Sau khi hoàn tất chương trình, bạn có thể đo lại; lịch sử vẫn giữ phép đo sớm.</p></li>
            <li><h3>Tự tính, ghi đáp số và chọn phương án</h3><p>Dùng NTU đầu và NTU cuối hợp lệ để tính phần trăm giảm đục theo công thức bên dưới. Nhập kết quả vào <strong>Phần trăm giảm đục tự tính (%)</strong>, bấm <strong>Ghi đáp số</strong> cho từng cốc. Sau đó chọn một cốc làm phương án nộp.</p></li>
            <li><h3>Kiểm tra sổ đo rồi nộp bài</h3><p>Đối chiếu pH, tổng liều, số đo cuối và đáp số đã ghi. Xem <strong>Lịch sử thao tác</strong> nếu cần kiểm tra lại. Bấm <strong>Nộp bài</strong> khi đã sẵn sàng: lượt sẽ chỉ đọc và không sửa được nữa. Muốn thử phương án khác, bắt đầu một mẻ mới.</p></li>
          </ol>
        </section>

        <section aria-labelledby="jar-calculation" className={styles.calculation}>
          <h2 id="jar-calculation"><CalculatorIcon />Tính phần trăm giảm đục</h2>
          <p className={styles.formula}>Hiệu suất (%) = (NTU đầu − NTU cuối) / NTU đầu × 100</p>
          <p>Dùng số đo hợp lệ của đúng cốc đang tính. Liều phèn có đơn vị mg/L; hiệu suất có đơn vị %, hai đại lượng này không thay thế nhau.</p>
          <details><summary>Xem ví dụ phép tính</summary><p><strong>Ví dụ minh họa, không phải kết quả của bài:</strong> mẫu có NTU đầu = 100, NTU cuối = 40 thì hiệu suất = (100 − 40) / 100 × 100 = 60%.</p></details>
          <p><strong>Chưa đo</strong> nghĩa là chưa có phép đo. <strong>N/A</strong> nghĩa là phép đo không hợp lệ. Cả hai đều không phải 0 NTU và không dùng để tính hiệu suất.</p>
        </section>
      </article>

      <aside className={styles.sidebar} aria-label="Hồ sơ bài thực hành">
        <section className={styles.profile}>
          <h2>Hồ sơ bài thực hành</h2>
          <dl><div><dt>Mẫu</dt><dd>Kaolin tổng hợp</dd></div><div><dt>Chất keo tụ</dt><dd>Phèn nhôm</dd></div><div><dt>Thể tích mỗi cốc</dt><dd>{JAR_PROFILE.aliquotVolumeL.toLocaleString('vi-VN')} L</dd></div><div><dt>pH ban đầu</dt><dd>{JAR_PROFILE.availableInitialPh.join(' / ')}</dd></div><div><dt>Tổng liều mỗi cốc</dt><dd>{JAR_PROFILE.minDoseMgL}–{JAR_PROFILE.maxDoseMgL} mg/L</dd></div><div><dt>Đầu ra cần ghi</dt><dd>NTU cuối, hiệu suất tự tính, cốc được chọn</dd></div></dl>
          <p className={styles.goal}>Mục tiêu học tập: tìm phương án giảm độ đục ít nhất <strong>{JAR_PROFILE.goalRemovalPercent}%</strong> theo mô hình.</p>
        </section>
        <section className={styles.limits}>
          <h2><WarningIcon />Hiểu đúng phạm vi</h2>
          <p>Đây là mẫu và chương trình đã khóa cho việc học. Bài không cho thay đổi tốc độ, thời gian, vị trí lấy mẫu hoặc thêm axit/bazơ tùy ý.</p>
          <p>Hoạt ảnh hạt và bông chỉ minh họa. Mô hình không dự đoán liên tục độ đục, kích thước bông hay lượng bùn trong lúc khuấy.</p>
          <p>Giảm NTU không chứng minh đã loại bỏ vi sinh hoặc chất ô nhiễm hòa tan. Mục tiêu {JAR_PROFILE.goalRemovalPercent}% không phải tiêu chuẩn nước uống hay nước thải.</p>
          <p>Không dùng kết quả này để định liều cho mẫu nước thật. Khi làm ở phòng thí nghiệm, tuân theo quy trình, trang bị bảo hộ và hướng dẫn của giảng viên.</p>
        </section>
        <details className={styles.sources}><summary>Nguồn của mô hình</summary><p>Mô hình cuối pha sử dụng Equation 3 với hệ số in trong nghiên cứu Alateef và cộng sự (2024), trong phạm vi hồ sơ mẫu đã khóa. Việc tái hiện công thức không thay thế kiểm chứng thực nghiệm ngoài mẫu.</p><a href={'https://doi.org/' + JAR_PROFILE.sourceDoi} target="_blank" rel="noreferrer">Đọc nghiên cứu gốc <ArrowRightIcon /></a></details>
      </aside>
    </div>
  </div>
}
