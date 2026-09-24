/**
 * Route-transition placeholder.
 *
 * Shown while a Server Component segment is still streaming. It is a SKELETON rather than
 * a spinner because the shape of every screen in this app is known in advance — a header,
 * then cards — and a placeholder that matches the shape stops the layout from jumping when
 * the real content lands.
 *
 * `aria-hidden` on the bars, with one live region carrying the words: a screen reader
 * should hear "đang tải" once, not read out a dozen decorative rectangles.
 */

export default function Loading() {
  return (
    <div className="page stack-loose">
      <p className="visually-hidden" role="status" aria-live="polite">
        Đang tải nội dung…
      </p>

      <div className="stack" aria-hidden="true">
        <div className="skeleton" style={{ height: '0.625rem', width: '7rem' }} />
        <div className="skeleton" style={{ height: '2rem', width: 'min(100%, 26rem)' }} />
        <div className="skeleton" style={{ height: '0.875rem', width: 'min(100%, 40rem)' }} />
      </div>

      <div className="grid-2" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div className="card stack" key={index}>
            <div className="skeleton skeleton-line" style={{ width: '55%' }} />
            <div className="skeleton skeleton-block" />
            <div>
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
