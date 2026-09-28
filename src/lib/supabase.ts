import type { SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'
import type { Database } from '@/types/database.types'

export type LinkaSupabaseClient = SupabaseClient<Database>

let client: Promise<LinkaSupabaseClient> | null = null

/**
 * The Supabase browser client, loaded on first use.
 *
 * supabase-js is about half of what the app downloads before first paint, and
 * the Door draws nothing from it. So it lives in its own chunk: `AuthProvider`
 * asks for it as soon as the first screen has rendered, and it arrives while
 * the Door plays. Only the type is imported statically — that is erased.
 *
 * Session persistence stays on Supabase's browser defaults (localStorage +
 * auto refresh), which is what lets a returning user skip signing in.
 */
export function getSupabase(): Promise<LinkaSupabaseClient> {
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient<Database>(env.supabaseUrl(), env.supabasePublishableKey()),
  )

  return client
}
