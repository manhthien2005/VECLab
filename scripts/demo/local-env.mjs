export function parseEnv(text) {
  if (text.trim().startsWith('{')) return JSON.parse(text)
  const values = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (!match) continue
    const raw = match[2].trim()
    values[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw.replace(/^'|'$/g, '')
  }
  return values
}

export function createLocalEnv(statusText, previousText = '') {
  const status = parseEnv(statusText)
  const previous = parseEnv(previousText)
  const url = status.API_URL
  const local = value => {
    try { const parsed = new URL(value); return parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname) } catch { return false }
  }
  if (!local(url)) throw new Error('Chỉ chấp nhận Supabase local trên máy này.')
  if (previous.NEXT_PUBLIC_SUPABASE_URL && !local(previous.NEXT_PUBLIC_SUPABASE_URL)) {
    throw new Error('Không ghi đè cấu hình Supabase ngoài máy local.')
  }
  const publishable = status.PUBLISHABLE_KEY || status.ANON_KEY
  const secret = status.SECRET_KEY || status.SERVICE_ROLE_KEY
  if (!publishable || !secret) throw new Error('Supabase local chưa cung cấp đủ khóa kết nối.')
  return '# Chỉ dành cho demo local; được tạo lại bằng npm run demo:setup.\n' + [
    ['NEXT_PUBLIC_SUPABASE_URL', url],
    ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', publishable],
    ['SUPABASE_SECRET_KEY', secret],
  ].map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n'
}
