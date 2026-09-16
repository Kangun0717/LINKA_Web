import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'
import type { Database } from '@/types/database.types'

export type LinkaSupabaseClient = SupabaseClient<Database>

let client: LinkaSupabaseClient | null = null

/**
 * Lazily created singleton Supabase browser client.
 *
 * It is created on first use rather than at module load so that screens which
 * do not talk to Supabase keep rendering even before `.env` is configured.
 *
 * Session persistence is left on Supabase's browser defaults (localStorage +
 * auto refresh), which is what lets a returning user skip the OTP step.
 */
export function getSupabase(): LinkaSupabaseClient {
  if (!client) {
    client = createClient<Database>(env.supabaseUrl(), env.supabasePublishableKey())
  }

  return client
}
