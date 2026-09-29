import { env } from '@/lib/env'
import { getSupabase } from '@/lib/supabase'
import { preparePhoto, randomName } from '@/features/memories/photos'
import type { Database, Tables } from '@/types/database.types'

/**
 * Community — public suggestions on their way to becoming LINKA places.
 *
 * Everything public is read through the SECURITY DEFINER read model of
 * 20261001100000_community_journal.sql (community_suggestions /
 * community_suggestion / community_suggestion_timeline), which returns only
 * public-safe columns: the moderated `public_reason`, never the original;
 * LINKA's approximate point, never the proposer's; approved public copies of
 * photos, never private paths; a count of supporters, never who. Nothing
 * here filters privacy itself — it cannot receive what it must not show.
 *
 * A person's own rows (their suggestions, their supports) come through RLS,
 * which returns only theirs.
 */

type Rpc = Database['public']['Functions']
export type PublicSuggestionRow = Rpc['community_suggestions']['Returns'][number]
export type PublicSuggestionDetail = Rpc['community_suggestion']['Returns'][number]
export type TimelineRow = Rpc['community_suggestion_timeline']['Returns'][number]

/** The statuses the public model returns. */
export const PUBLIC_STATUSES = ['open', 'under_review', 'contacting_partner', 'approved', 'published'] as const
export type PublicStatus = (typeof PUBLIC_STATUSES)[number]

export function isPublicStatus(status: string): status is PublicStatus {
  return (PUBLIC_STATUSES as readonly string[]).includes(status)
}

/** Open for 行ってみたい: public and not yet a LINKA place (then the count is frozen). */
export function acceptsSupport(status: string): boolean {
  return isPublicStatus(status) && status !== 'published'
}

export async function fetchCommunitySuggestions(statuses: readonly PublicStatus[] | null = null, limit = 60): Promise<PublicSuggestionRow[]> {
  const { data, error } = await (await getSupabase()).rpc('community_suggestions', {
    p_statuses: statuses ? [...statuses] : undefined,
    p_limit: limit,
  })
  if (error) throw error
  return data
}

/** One public suggestion, or null when it is not public (submitted, declined, withdrawn — or not there). */
export async function fetchCommunitySuggestion(id: string): Promise<PublicSuggestionDetail | null> {
  const { data, error } = await (await getSupabase()).rpc('community_suggestion', { p_id: id })
  if (error) throw error
  return data[0] ?? null
}

/** Public events of a public suggestion — or, for its proposer, of their own at any stage. */
export async function fetchSuggestionTimeline(id: string): Promise<TimelineRow[]> {
  const { data, error } = await (await getSupabase()).rpc('community_suggestion_timeline', { p_id: id })
  if (error) throw error
  return data
}

/**
 * The signed-in person's own suggestions, at every stage. RLS returns only
 * theirs. The reviewer's fields (reviewed_by, review_note) are not asked for.
 */
export type MySuggestionRow = Pick<
  Tables<'place_suggestions'>,
  | 'id'
  | 'name'
  | 'address'
  | 'reason'
  | 'public_reason'
  | 'public_area'
  | 'reference_url'
  | 'attribution'
  | 'status'
  | 'support_count'
  | 'place_id'
  | 'created_at'
  | 'opened_at'
  | 'published_at'
  | 'withdrawn_at'
>

const MY_SUGGESTION_COLUMNS =
  'id, name, address, reason, public_reason, public_area, reference_url, attribution, status, support_count, place_id, created_at, opened_at, published_at, withdrawn_at'

export async function fetchMySuggestions(): Promise<MySuggestionRow[]> {
  const { data, error } = await (await getSupabase())
    .from('place_suggestions')
    .select(MY_SUGGESTION_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchMySuggestion(id: string): Promise<MySuggestionRow | null> {
  const { data, error } = await (await getSupabase()).from('place_suggestions').select(MY_SUGGESTION_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

/** The suggestions this person would like to go to (their own rows only). */
export type MySupportRow = { suggestion_id: string; created_at: string }

export async function fetchMySupports(): Promise<MySupportRow[]> {
  const { data, error } = await (await getSupabase())
    .from('place_suggestion_supports')
    .select('suggestion_id, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** 行ってみたい. The server refuses one's own suggestion and a closed one, and limits the rate. */
export async function addSupport(suggestionId: string): Promise<void> {
  const { error } = await (await getSupabase()).from('place_suggestion_supports').insert({ suggestion_id: suggestionId })
  // Already there (another tab): what was asked for is true.
  if (error && error.code !== '23505') throw error
}

/**
 * Take a support back. After publication the policy keeps it (the count is
 * frozen), so no row is removed — that is reported, not hidden.
 */
export async function removeSupport(suggestionId: string, userId: string): Promise<boolean> {
  const { data, error } = await (await getSupabase())
    .from('place_suggestion_supports')
    .delete()
    .eq('suggestion_id', suggestionId)
    .eq('user_id', userId)
    .select('suggestion_id')
  if (error) throw error
  return data.length > 0
}

export type SuggestionInput = {
  name: string
  area: string
  reason: string
  referenceUrl: string | null
  point: { lng: number; lat: number } | null
  attribution: 'nickname' | 'anonymous'
  locale: string
}

/** Submit. It starts `submitted`: private to its proposer until LINKA opens it. */
export async function submitSuggestion(input: SuggestionInput): Promise<string> {
  const { data, error } = await (await getSupabase())
    .from('place_suggestions')
    .insert({
      name: input.name.trim(),
      address: input.area.trim(),
      reason: input.reason.trim(),
      reference_url: input.referenceUrl,
      latitude: input.point?.lat ?? null,
      longitude: input.point?.lng ?? null,
      attribution: input.attribution,
      locale: input.locale,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function withdrawSuggestion(id: string): Promise<void> {
  const { error } = await (await getSupabase()).rpc('withdraw_suggestion', { p_id: id })
  if (error) throw error
}

/**
 * One photo for a suggestion: re-encoded on this device (EXIF and location
 * do not survive), uploaded to the PRIVATE suggestion-photos bucket in the
 * proposer's own folder, and recorded as pending review. Only a copy LINKA
 * approves and places in community-media is ever public.
 */
export async function addSuggestionPhoto(suggestionId: string, userId: string, file: File, position: number): Promise<void> {
  const supabase = await getSupabase()
  // Reviewers look at the full photo; no thumbnail is kept privately.
  const { blob, width, height } = await preparePhoto(file)
  const path = `${userId}/${suggestionId}/${randomName()}.jpg`
  const upload = await supabase.storage.from('suggestion-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (upload.error) throw upload.error
  const { error } = await supabase
    .from('place_suggestion_photos')
    .insert({ suggestion_id: suggestionId, storage_path: path, width, height, position })
  if (error) {
    await supabase.storage.from('suggestion-photos').remove([path])
    throw error
  }
}

/** The public URL of an approved copy in community-media (a public bucket). */
export function communityMediaUrl(path: string): string {
  return `${env.supabaseUrl()}/storage/v1/object/public/community-media/${path.split('/').map(encodeURIComponent).join('/')}`
}

/**
 * What went wrong, in words the interface can say — never the database's
 * own message. `rate_limited` is the server's per-account limit (HTTP 429,
 * SQLSTATE PT429); `own` and `closed` are the support guard's reasons.
 */
export type CommunityProblem = 'rate_limited' | 'own' | 'closed' | 'offline' | 'unknown'

export function problemOf(error: unknown): CommunityProblem {
  const e = (error ?? {}) as { code?: string; message?: string; status?: number }
  if (e.code === 'PT429' || e.message === 'rate_limited' || e.status === 429) return 'rate_limited'
  if (e.message === 'own_suggestion') return 'own'
  if (e.message === 'support_closed') return 'closed'
  if (error instanceof TypeError || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 'offline'
  return 'unknown'
}
