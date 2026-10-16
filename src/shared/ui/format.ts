const VI_LOCALE = 'vi-VN'

/** Format a saved date; invalid or missing values stay unavailable. */
export function formatRelativeDate(date: Date | string): string {
  const parsed = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat(VI_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}
