import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import {
  ArrowRightIcon,
  BookIcon,
  CalculatorIcon,
  SigmaIcon,
} from './icons.js'
import { BookStackVisual } from './book-stack-visual.js'

/**
 * Scientific Evidence & Trust Section (docs/web-application-scope.md §4.1).
 *
 * Implements the approved visual standard (design.md, reference/approved-landing.png):
 * - Strong centered section intro with clinical academic authority.
 * - Three structured trust/evidence cards with distinct, meaningful visual hierarchy:
 *   1. Computational basis (cân bằng hóa học, động học, hằng số kiểm chứng)
 *   2. Mathematical formula presentation (K_sp = [Cu²⁺][OH⁻]² in high-grade serif math typography)
 *   3. Authoritative reference citations from the locked evidence registry (IUPAC, USGS, EPA)
 * - 3D authored Reference Books visual with laboratory botanical foliage.
 * - Server Component reading only APP_STRINGS and locked registry metadata.
 */
export function EvidenceSection() {
  const strings = APP_STRINGS.home

  return (
    <section className="evidence-section-wrap reveal" id="evidence" aria-labelledby="evidence-heading">
      {/* Centered Section Header */}
      <div className="evidence-head">
        <p className="eyebrow">{strings.evidenceEyebrow}</p>
        <h2 id="evidence-heading" className="evidence-main-heading">
          {strings.evidenceSectionHeading}
        </h2>
        <p className="lede evidence-main-lede">
          {strings.evidenceSectionLede}
        </p>
      </div>

      {/* Main Evidence Layout: 3 Cards + 3D Reference Books Visual */}
      <div className="evidence-layout">
        <div className="evidence-cards-grid">
          {/* Card 1: Computational Model */}
          <article className="evidence-card evidence-card-model">
            <div className="evidence-card-top">
              <span className="icon-badge icon-badge-blue" aria-hidden="true">
                <CalculatorIcon />
              </span>
              <h3 className="evidence-card-title">{strings.evidenceCards[0]?.title ?? 'Mô hình tính toán'}</h3>
            </div>
            <p className="evidence-card-body">
              {strings.evidenceCards[0]?.body ?? 'Dựa trên cân bằng hóa học và các hằng số đã được kiểm chứng.'}
            </p>
            <div className="evidence-specs-pill">
              <span>Đặc tả pH*, Kw 25 °C, hệ carbon kín</span>
            </div>
            <Link className="evidence-card-action" href="/evidence">
              <span>Xem chi tiết</span>
              <ArrowRightIcon />
            </Link>
          </article>

          {/* Card 2: Mathematical / Scientific Formula */}
          <article className="evidence-card evidence-card-formula">
            <div className="evidence-card-top">
              <span className="icon-badge icon-badge-teal" aria-hidden="true">
                <SigmaIcon />
              </span>
              <h3 className="evidence-card-title">{strings.evidenceCards[1]?.title ?? 'Công thức minh họa'}</h3>
            </div>
            <div className="evidence-math-display" aria-label="K_sp bằng nồng độ ion Cu 2 cộng nhân nồng độ ion OH trừ bình phương">
              <span className="evidence-formula-tex">
                <em>K</em><sub>sp</sub> = [Cu<sup>2+</sup>][OH<sup>−</sup>]<sup>2</sup>
              </span>
            </div>
            <p className="evidence-card-body evidence-card-body-sub">
              Cơ sở tính toán quá trình kết tủa (minh họa theo mô hình).
            </p>
            <Link className="evidence-card-action" href="/evidence">
              <span>Xem chi tiết</span>
              <ArrowRightIcon />
            </Link>
          </article>

          {/* Card 3: Authoritative Reference Sources */}
          <article className="evidence-card evidence-card-sources">
            <div className="evidence-card-top">
              <span className="icon-badge icon-badge-green" aria-hidden="true">
                <BookIcon />
              </span>
              <h3 className="evidence-card-title">{strings.evidenceCards[2]?.title ?? 'Nguồn tham khảo'}</h3>
            </div>
            <ul className="evidence-source-bullets" aria-label="Các nguồn tài liệu tiêu biểu">
              <li>
                <span className="source-bullet-dot" aria-hidden="true">•</span>
                <span><strong>IUPAC Gold Book</strong> (Quy chuẩn pH)</span>
              </li>
              <li>
                <span className="source-bullet-dot" aria-hidden="true">•</span>
                <span><strong>USGS PHREEQC</strong> (Attachment B)</span>
              </li>
              <li>
                <span className="source-bullet-dot" aria-hidden="true">•</span>
                <span><strong>U.S. EPA</strong> (Xử lý trung hòa AMD)</span>
              </li>
            </ul>
            <Link className="evidence-card-action" href="/evidence">
              <span>Xem 19 nguồn kiểm chứng</span>
              <ArrowRightIcon />
            </Link>
          </article>
        </div>

        {/* Right Side: 3D Reference Books Visual */}
        <div className="evidence-visual-pane">
          <BookStackVisual />
        </div>
      </div>
    </section>
  )
}
