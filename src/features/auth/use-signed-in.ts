'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browser.js'
import { isSupabaseConfigured } from './is-configured.js'

/**
 * Whether the browser currently has a verified session.
 *
 * Starts false and resolves after mount so the root layout can stay static:
 * guest destinations render on the server, and signed-in extras (compare,
 * account) appear once the client knows. An unconfigured deployment stays
 * guest-only.
 */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined

    const supabase = createSupabaseBrowserClient()
    let cancelled = false

    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setSignedIn(data.user !== null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(session?.user != null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return signedIn
}
