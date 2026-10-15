import Image from 'next/image'
import { APP_STRINGS } from '@/content/index.js'
import { CheckCircleIcon, FlaskIcon, LayersIcon, MoleculeIcon } from './icons.js'

/** Static concept preview. No engine, controls, attempt storage or fabricated readings. */
export function WorkbenchPreview() {
  const strings = APP_STRINGS.home
  return (
    <div className="workbench-section wb-concept-section">
      <svg className="wb-concept-background" viewBox="0 0 1440 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs><pattern id="wb-concept-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="currentColor" /></pattern></defs>
        <g fill="url(#wb-concept-dots)" opacity="0.22"><rect x="10" y="180" width="230" height="200" /><rect x="1200" y="600" width="230" height="260" /></g>
        <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
          <path d="M0 110h170l40 70h180M1440 110h-170l-40 70h-180M0 890h280l40-70h220M1440 890h-280l-40-70H900" />
          <path d="M95 360v260l80 46M1345 360v260l-80 46" />
          <path d="m150 78 18-31h36l18 31-18 31h-36Zm1100 826 18-31h36l18 31-18 31h-36Z" />
          <ellipse cx="720" cy="790" rx="550" ry="92" strokeDasharray="2 12" />
        </g>
        <g fill="currentColor" opacity="0.5"><circle cx="390" cy="180" r="3" /><circle cx="1050" cy="180" r="3" /><circle cx="540" cy="820" r="3" /><circle cx="900" cy="820" r="3" /></g>
      </svg>
      <div className="section-head-center">
        <p className="eyebrow">{strings.workbenchEyebrow}</p>
        <h2 id="workbench-heading" className="workbench-main-title">{strings.workbenchHeading}</h2>
        <p className="lede workbench-lede">{strings.workbenchLede}</p>
      </div>

      <div className="wb-concept-scene">
        <aside className="wb-concept-note wb-note-conditions">
          <span className="wb-note-icon" aria-hidden="true"><LayersIcon /></span>
          <div><h3>Cùng mẫu, khác điều kiện</h3><p>Chọn pH và liều keo tụ để so sánh các phương án xử lý.</p></div>
        </aside>
        <aside className="wb-concept-note wb-note-formula">
          <h3>Hiệu suất loại độ đục</h3>
          <div className="wb-concept-equation" aria-label="H bằng độ đục ban đầu trừ độ đục sau xử lý, chia độ đục ban đầu, nhân 100 phần trăm">
            <span>H =</span><span className="wb-concept-fraction"><span>T₀ − T</span><span>T₀</span></span><span>× 100%</span>
          </div>
          <p>T₀: ban đầu · T: sau xử lý</p>
        </aside>

        <div className="workbench-frame wb-concept-frame" role="region" aria-label="Minh họa giao diện workbench Jar Test">
          <div className="wb-concept-bar">
            <div className="wb-concept-brand"><FlaskIcon /><strong>VECLab</strong><span aria-hidden="true">/</span><span>Jar Test</span></div>
            <span className="wb-concept-label">Minh họa giao diện</span>
          </div>
          <div className="wb-concept-layout">
            <div className="wb-concept-rail">
              <p className="wb-concept-caption">Quy trình thực hành</p>
              <ol className="wb-concept-steps">
                {strings.workbenchSteps.map((step, index) => (
                  <li key={step} className={index === 1 ? 'is-current' : undefined}>
                    <span className="wb-concept-step-number" aria-hidden="true">{index === 0 ? <CheckCircleIcon /> : index + 1}</span><span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="wb-concept-tools">
                <p className="wb-concept-caption">Dụng cụ</p>
                <p>Máy khuấy Jar Test</p><p>Cốc thí nghiệm</p><p>Máy đo độ đục</p>
              </div>
            </div>

            <div className="wb-concept-bench">
              <div className="wb-concept-bench-heading"><h3>Bàn thí nghiệm</h3><span>Tối đa sáu cốc so sánh</span></div>
              <div className="wb-concept-apparatus">
                <Image src="/assets/experiments/jar.webp" alt="Minh họa dàn Jar Test với hai cốc nước và cánh khuấy" fill sizes="(max-width: 48rem) 90vw, (max-width: 68rem) 55vw, 620px" />
                <div className="wb-concept-cup-labels"><span>Cốc A</span><span>Cốc B</span></div>
              </div>
              <div className="wb-concept-phase" aria-label="Chương trình khuấy và lắng"><span>Khuấy nhanh</span><span aria-hidden="true">→</span><span>Khuấy chậm</span><span aria-hidden="true">→</span><span>Lắng</span></div>
              <table className="wb-concept-measurements">
                <caption>Sổ đo</caption>
                <thead><tr><th scope="col">Mẫu</th><th scope="col">Độ đục</th><th scope="col">Hiệu suất</th></tr></thead>
                <tbody>{['A', 'B'].map(cup => <tr key={cup}><th scope="row">Cốc {cup}</th><td>Chưa đo</td><td>Chưa có</td></tr>)}</tbody>
              </table>
            </div>

            <div className="wb-concept-settings">
              <p className="wb-concept-caption">Thiết lập cốc B</p>
              <p className="wb-concept-settings-note">Thông số minh họa</p>
              <dl className="wb-concept-fields">
                <div><dt>Thể tích mẫu</dt><dd>500 <span>mL</span></dd></div>
                <div><dt>pH ban đầu</dt><dd>7</dd></div>
                <div><dt>Chất keo tụ</dt><dd>Phèn nhôm</dd></div>
                <div><dt>Liều sử dụng</dt><dd>150 <span>mg/L</span></dd></div>
              </dl>
              <div className="wb-concept-action-samples" aria-label="Minh họa các thao tác trong bài thực hành">
                <p className="wb-concept-action"><MoleculeIcon />Thêm chất keo tụ</p>
                <p className="wb-concept-action wb-concept-action-secondary">Đo độ đục</p>
              </div>
              <p className="wb-concept-settings-note">Kết quả được ghi sau mỗi lần đo.</p>
            </div>
          </div>
          <div className="wb-concept-status"><span><span className="wb-concept-status-dot" aria-hidden="true" />Đang thiết lập mẫu</span><span>Kết quả đo: chưa có</span></div>
        </div>

        <aside className="wb-concept-note wb-note-review">
          <span className="wb-note-icon" aria-hidden="true"><CheckCircleIcon /></span>
          <div><h3>Đối chiếu sau khi hoàn thành</h3><p>Xem chênh lệch kết quả và những thao tác đã dẫn đến nó.</p></div>
        </aside>
      </div>
    </div>
  )
}
