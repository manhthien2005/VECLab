import localFont from 'next/font/local'

/**
 * Self-hosted Manrope variable font (OFL 1.1).
 * Verified Vietnamese glyph coverage (134/134 standard diacritics).
 * Zero runtime external network requests.
 */
export const manrope = localFont({
  src: './fonts/manrope-variable.ttf',
  variable: '--font-manrope',
  display: 'swap',
  weight: '200 800',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
})
