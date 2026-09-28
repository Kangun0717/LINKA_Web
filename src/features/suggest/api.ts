import type { SuggestionStatus } from '@/lib/i18n/journeyMessages'
import { getSupabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

/**
 * Suggest a Place. A suggestion is a proposal, never a place: nothing here
 * writes to `places`, and a client cannot set a status — RLS and the column
 * grants allow only the proposal fields. Voting will attach to a suggestion's
 * id later without changing any of this.
 */

export type SuggestionRow = Pick<Tables<'place_suggestions'>, 'id' | 'name' | 'address' | 'reason' | 'reference_url' | 'created_at'> & {
  status: string
}

export async function submitSuggestion(input: {
  name: string
  address: string
  reason: string
  referenceUrl: string | null
  locale: string
}): Promise<void> {
  const { error } = await (await getSupabase()).from('place_suggestions').insert({
    name: input.name.trim(),
    address: input.address.trim(),
    reason: input.reason.trim(),
    reference_url: input.referenceUrl,
    locale: input.locale,
  })
  if (error) throw error
}

export async function fetchMySuggestions(): Promise<SuggestionRow[]> {
  const { data, error } = await (await getSupabase())
    .from('place_suggestions')
    .select('id, name, address, reason, reference_url, status, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Before the review-pipeline migration the only stored value is `pending`. */
export function normalizeStatus(status: string): SuggestionStatus {
  if (status === 'pending') return 'submitted'
  if (status === 'approved') return 'added'
  if (status === 'rejected') return 'not_proceeding'
  return status as SuggestionStatus
}
