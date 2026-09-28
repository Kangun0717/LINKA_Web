import { getSupabase } from '@/lib/supabase'
import type { Database, Tables } from '@/types/database.types'

/**
 * Production place data: what LINKA publishes, and what the signed-in user
 * has actually touched. RLS decides what each query can see — published
 * places for everyone, touch events only for their owner — and every write
 * goes through a checked path (`record_touch`, the memories policies).
 */

export type TranslationRow = Tables<'place_translations'>
export type SourceRow = Pick<Tables<'place_sources'>, 'url' | 'publisher' | 'covers' | 'checked_at'>

export type PlaceRecord = Pick<
  Tables<'places'>,
  | 'id'
  | 'slug'
  | 'parent_id'
  | 'kind'
  | 'native_name'
  | 'native_locale'
  | 'romanized_name'
  | 'latitude'
  | 'longitude'
  | 'timezone'
  | 'official_url'
  | 'discovery_enabled'
  | 'label_side'
  | 'hero_image_path'
  | 'hero_image_credit'
> & {
  /** Present once the hero migration is applied; absent (undefined) before. */
  hero_image_source_url?: string | null
  hero_image_license?: string | null
  hero_image_license_url?: string | null
  place_translations: (TranslationRow & { hero_image_alt?: string | null })[]
  place_sources: SourceRow[]
}

// `*` rather than a column list, so a column added by a later migration is
// picked up — and its absence before then is not an error.
const PLACE_COLUMNS = '*, place_translations(*), place_sources(url, publisher, covers, checked_at)'

let placesRequest: Promise<PlaceRecord[]> | null = null

/**
 * Every published place, with all its translations — so switching language
 * never needs another request. Cached for the session; it changes rarely.
 */
export function fetchPlaces(): Promise<PlaceRecord[]> {
  placesRequest ??= getSupabase()
    .then((supabase) => supabase.from('places').select(PLACE_COLUMNS).order('slug'))
    .then(({ data, error }) => {
      if (error) throw error
      return data as unknown as PlaceRecord[]
    })
    .catch((error: unknown) => {
      placesRequest = null
      throw error
    })

  return placesRequest
}

export type TouchRow = Pick<
  Tables<'touch_events'>,
  'id' | 'place_id' | 'touchpoint_id' | 'touched_at' | 'local_date' | 'is_test'
>

/** The signed-in user's own touches, oldest first. RLS returns nobody else's. */
export async function fetchMyTouches(): Promise<TouchRow[]> {
  const { data, error } = await (await getSupabase())
    .from('touch_events')
    .select('id, place_id, touchpoint_id, touched_at, local_date, is_test')
    .order('touched_at')

  if (error) throw error
  return data
}

export type ResolvedTouchPoint = Database['public']['Functions']['resolve_touch_point']['Returns'][number]

/**
 * What an NFC URL points at, or `null`. Signed out, a test point (or any
 * point that is not for this viewer) resolves to nothing — indistinguishable
 * from an unknown one, on purpose.
 */
export async function resolveTouchPoint(publicId: string): Promise<ResolvedTouchPoint | null> {
  const { data, error } = await (await getSupabase()).rpc('resolve_touch_point', { p_public_id: publicId })

  if (error) throw error
  return data[0] ?? null
}

export type RecordedTouch = Database['public']['Functions']['record_touch']['Returns'][number]

/**
 * Record a Touch for the signed-in user. The server derives who, where and
 * when; the client only says which Touch Point URL it opened. A repeat tap
 * within ten minutes returns the same event with `duplicate: true`.
 */
export async function recordTouch(publicId: string): Promise<RecordedTouch> {
  const { data, error } = await (await getSupabase()).rpc('record_touch', { p_public_id: publicId })

  if (error) throw error
  const touch = data[0]
  if (!touch) throw new Error('record_touch returned no row')
  return touch
}

/**
 * Today's unique real visitors at a place — the approved source of truth for
 * any visitor number. Test touches are excluded by the function itself.
 * Callers must hide the module below 3 (see `visitorCountToShow`).
 */
export async function fetchVisitorsToday(placeId: string): Promise<number | null> {
  const { data, error } = await (await getSupabase()).rpc('place_visitors_today', { p_place_id: placeId })
  if (error) return null
  return data
}

/** 0–2 is never shown (it would point at a person); 3+ is shown exactly. */
export function visitorCountToShow(count: number | null): number | null {
  return count !== null && count >= 3 ? count : null
}

export type PlaceEventRow = Tables<'place_events'> & { place_event_translations: Tables<'place_event_translations'>[] }

/** Published (or cancelled) events at a place that have not ended. */
export async function fetchPlaceEvents(placeId: string): Promise<PlaceEventRow[]> {
  const { data, error } = await (await getSupabase())
    .from('place_events')
    .select('*, place_event_translations(*)')
    .eq('place_id', placeId)
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .order('starts_at')
  if (error) return []
  return data as PlaceEventRow[]
}

export type SafetyResource = {
  id: string
  place_id: string | null
  kind: string
  title: string
  languages: string[]
  url: string
  phone: string | null
  publisher: string
  summary: Record<string, string>
  sort: number
  checked_at: string
}

/**
 * Official safety resources for a place: its own, its region's, and the
 * national ones. A failure is thrown, so the card can say the official
 * information could not be loaded rather than silently leaving it out.
 */
export async function fetchSafetyResources(placeIds: string[]): Promise<SafetyResource[]> {
  const ids = placeIds.filter(Boolean)
  const supabase = await getSupabase()
  // The table is newer than the generated types until they are regenerated.
  const { data, error } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
    .from('safety_resources')
    .select('*')
    .or([`place_id.is.null`, ...(ids.length ? [`place_id.in.(${ids.join(',')})`] : [])].join(','))
    .order('sort')
  if (error) throw error
  return data as unknown as SafetyResource[]
}
