import { env } from '@/lib/env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Lazily created singleton Supabase browser client.
 *
 * It is created on first use rather than at module load so that screens which
 * do not talk to Supabase keep rendering even before `.env` is configured.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseAnonKey())
  }

  return client
}
