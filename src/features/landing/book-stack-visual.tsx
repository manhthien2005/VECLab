import Image from 'next/image'

/**
 * Editorial Reference Books Visual.
 *
 * Replaces the previous large inline SVG with a high-fidelity transparent raster
 * asset (/assets/evidence-books.webp) representing authoritative scientific references
 * backing VECLab.
 *
 * Features:
 * - Editorial 3D hardcover academic books in deep teal, warm ivory, and rich navy clothbound bindings.
 * - Subtle embossed gold filigree with zero fake titles/letters embedded in image.
 * - Decorative eucalyptus foliage with natural transparent alpha contact shadow.
 * - Retains floating scientific assurance badge with coded HTML content.
 * - Pure Server Component (static/server-rendered, zero client JS, zero CLS).
 */
export function BookStackVisual() {
  return (
    <div className="book-stack-container" aria-hidden="true">
      <div className="book-stack-media-frame">
        <Image
          src="/assets/evidence-books.webp"
          alt=""
          width={360}
          height={210}
          className="book-stack-img"
          priority={false}
        />
      </div>

      {/* Floating Scientific Assurance Badge (Restrained depth object) */}
      <div className="book-stack-floating-pill" role="note" aria-label="Nguồn thẩm định tiêu chuẩn">
        <span className="floating-pill-dot" />
        <span className="floating-pill-title">IUPAC · IAPWS · EPA</span>
        <span className="floating-pill-divider">·</span>
        <span className="floating-pill-count">19 nguồn kiểm chứng</span>
      </div>
    </div>
  )
}
