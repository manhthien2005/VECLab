import Link from 'next/link'
import type { Metadata } from 'next'
import { APP_STRINGS } from '@/content/index.js'

/**
 * 404 (web scope §11: abnormal states must have a clear status and a way out).
 *
 * Replaces Next's built-in "This page could not be found", which is English, unstyled and
 * offers no route onward — on a Vietnamese product that is a dead end rather than an
 * error message. Every destination here is public, because a learner who mistyped a URL
 * may well be signed out.
 *
 * Also rendered by `notFound()` from the experiment detail route when a scenario key is
 * not a locked release, so the copy has to work for both "no such page" and "no such
 * experiment".
 */

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="page page-narrow stack-loose rise">
      <header className="stack">
        <p className="eyebrow">Lỗi 404</p>
        <h1>Không tìm thấy trang này</h1>
        <p className="lede">
          Đường dẫn không tồn tại, hoặc kịch bản bạn tìm chưa được khóa phiên bản trong bản
          triển khai hiện tại. Không có dữ liệu nào của bạn bị ảnh hưởng.
        </p>
      </header>

      <div className="row">
        <Link className="btn btn-primary" href="/">
          {APP_STRINGS.errors.backHome}
        </Link>
        <Link className="btn" href="/experiments">
          {APP_STRINGS.nav.experiments}
        </Link>
        <Link className="btn btn-ghost" href="/lab">
          {APP_STRINGS.nav.lab}
        </Link>
      </div>

      <section className="card stack-tight">
        <h2>Có thể bạn đang tìm</h2>
        <ul className="stack-tight small muted">
          <li>
            <Link href="/experiments">Danh mục thí nghiệm</Link> — các kịch bản đã khóa và
            phiên bản mô hình của chúng.
          </li>
          <li>
            <Link href="/evidence">Nguồn khoa học</Link> — sổ đăng ký bằng chứng cho mọi
            hằng số và giới hạn.
          </li>
          <li>
            <Link href="/lab">Phòng lab của tôi</Link> — các lượt thử đang làm và đã hoàn
            thành.
          </li>
        </ul>
      </section>
    </div>
  )
}
