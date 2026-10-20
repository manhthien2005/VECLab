import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { APP_STRINGS } from '@/content/index.js'
import { ArrowRightIcon, FlaskIcon } from '@/features/landing/icons.js'
import { AppFooterNav, AppNav } from './app-nav.js'
import { THEME_STORAGE_KEY } from './theme-storage.js'
import { manrope } from './fonts.js'
import './globals.css'

/**
 * Root layout: Vietnamese-language shell around every route.
 *
 * Server Component. It renders no per-request data, so it stays statically analysable;
 * pages that need a session or a scenario opt into dynamic rendering themselves
 * (docs/system-architecture.md §11.2).
 */

const SITE_DESCRIPTION =
  'Nền tảng mô phỏng quy trình xử lý nước có căn cứ khoa học: mỗi con số đi kèm công thức, nguồn và giới hạn mô hình.'

export const metadata: Metadata = {
  title: {
    default: 'VECLab — Mô phỏng quy trình hóa học',
    template: '%s — VECLab',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'VECLab',
  // Vietnamese is the only locale in MVP (§9), so the OG locale is fixed rather than
  // negotiated. A share card without a title falls back to the URL, which tells a
  // reader nothing about what they are being sent.
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'VECLab',
    title: 'VECLab — Mô phỏng quy trình hóa học có căn cứ khoa học',
    description: SITE_DESCRIPTION,
  },
  formatDetection: { telephone: false, address: false, email: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Learners compare numeric readouts; pinch-zoom is an accessibility feature, never
  // disabled. Two theme colours so the browser chrome matches the page in both themes.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1412' },
  ],
}

/**
 * Applies the stored theme BEFORE first paint.
 *
 * Without this the page renders in the OS theme, hydrates, and then snaps to the stored
 * choice — a white flash on every navigation for a learner who picked dark. The script
 * must therefore be synchronous and inline in `<head>`; a component effect runs far too
 * late.
 *
 * Wrapped in try/catch because `localStorage` access itself throws in a private window
 * or with site data blocked. A throw here would abort the inline script; the page must
 * still render, just in the OS theme.
 */
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={manrope.variable}>
        {/* First tab stop on every page: the workbench has many controls before the
            content, and a keyboard user must be able to skip the header. */}
        <a className="skip-link" href="#main">
          Bỏ qua điều hướng, tới nội dung chính
        </a>

        <div className="shell">
          <header className="app-header">
            <div className="app-header-inner">
              <Link className="brand" href="/" aria-label="Trang chủ VECLab">
                <span className="brand-mark" aria-hidden="true">
                  <FlaskIcon />
                </span>
                <span className="brand-name">{APP_STRINGS.brand}</span>
                <span className="brand-tag">{APP_STRINGS.brandTag}</span>
              </Link>
              <AppNav />
            </div>
          </header>

          {/* `tabIndex={-1}` makes the skip link's target focusable, so the next Tab
              continues from the content rather than restarting at the header. */}
          <main id="main" tabIndex={-1}>
            {children}
          </main>

          <SiteFooter />
        </div>
      </body>
    </html>
  )
}

/** Shared footer; scenario-specific assumptions stay in each lesson and its evidence. */
function SiteFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label="Trang chủ VECLab">
              <span className="brand-mark" aria-hidden="true">
                <FlaskIcon />
              </span>
              <span className="brand-name">{APP_STRINGS.brand}</span>
            </Link>
            <p className="footer-description">{APP_STRINGS.footer.description}</p>
          </div>

          <AppFooterNav />
        </div>

        <div className="footer-legal">
          <div className="footer-note">
            <p><strong>Lưu ý sử dụng</strong>{APP_STRINGS.footer.note}</p>
            <Link href="/evidence">Nguồn và giới hạn <ArrowRightIcon aria-hidden="true" /></Link>
          </div>
          <div className="footer-legal-row">
            <span>© 2026 {APP_STRINGS.brand}</span>
            <a className="footer-back-top" href="#main">Về đầu trang <ArrowRightIcon /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
