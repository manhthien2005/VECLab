import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/infrastructure/supabase/server.js'
import { safeNextPath } from '@/features/auth/redirect.js'
import { isSupabaseConfigured } from '@/features/auth/is-configured.js'

/** Consume an email credential once, then redirect without exposing it in the destination. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeaders = new Headers({ 'Cache-Control': 'private, no-store' })
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url), { headers: authHeaders })
  if (!isSupabaseConfigured()) return redirect('/verify?status=not_configured')

  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const next = safeNextPath(request.nextUrl.searchParams.get('next'))
  const emailType = type === 'signup' || type === 'email' || type === 'recovery' ? type : null
  if (!code && !(tokenHash && emailType)) return redirect('/verify?status=missing_code')

  try {
    const supabase = await createSupabaseServerClient({
      onAuthHeaders: headers => {
        for (const [key, value] of Object.entries(headers)) authHeaders.set(key, value)
      },
    })
    // PKCE is the default email flow. Token hashes also support server-side email
    // templates whose confirmation link can be opened in a different browser.
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: emailType! })
    if (error !== null) return redirect('/verify?status=failed')
    return redirect(emailType === 'recovery' ? '/reset-password' : next ?? '/lab')
  } catch {
    return redirect('/verify?status=failed')
  }
}
