import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext'
import { getSupabase } from '@/lib/supabase'

/**
 * Single source of truth for the Supabase session.
 *
 * Mounting this once at the root is what lets a returning user skip signing
 * in: Supabase restores the persisted session from browser storage and this
 * provider republishes it to the whole tree. The client itself is loaded here,
 * after the first render, so it never delays the Door's first paint.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}

    void getSupabase().then((supabase) => {
      if (!active) return

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (active) setSession(nextSession)
      })
      unsubscribe = () => subscription.unsubscribe()

      return supabase.auth.getSession().then(({ data }) => {
        if (active) setSession(data.session)
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session: session ?? null,
      user: session?.user ?? null,
      loading: session === undefined,
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
