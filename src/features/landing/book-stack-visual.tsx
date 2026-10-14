import Image from 'next/image'

/** Archived decorative asset: no source count or third-party endorsement is implied. */
export function BookStackVisual() {
  return (
    <div className="book-stack-container" aria-hidden="true">
      <Image src="/assets/evidence-books.webp" alt="" width={360} height={210}
        className="book-stack-img" priority={false} />
    </div>
  )
}
