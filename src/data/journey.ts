import { useMemo } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import { fetchMyMemories, type MemoryRecord } from '@/features/memories/api'
import { fetchMyVisits, type VisitRow } from '@/features/places/api'
import type { LocalizedPlace } from '@/features/places/localize'
import { fetchMySuggestions, type MySuggestionRow } from '@/features/community/api'
import { regionOf, usePlaces, type PlaceIndex } from '@/data/places'
import { invalidate, privateKey, update, useResource } from '@/data/store'
import type { Locale } from '@/lib/i18n/locale'

/**
 * PRIVATE USER DATA — one person's journey, readable only by them (RLS).
 *
 *   TouchPoint → TouchEvent ─┐
 *                TouchEvent ─┼─ Visit  (one per place per local day: the proof of presence)
 *                TouchEvent ─┘    └── Memory (mood · note · photos: what they kept of it)
 *
 * TouchEvents are evidence and analytics; nothing a person sees is counted
 * from them. Every screen reads the journey from `buildJourney`, so the
 * relationship is built in exactly one place.
 *
 *                Memory (kind 'past') — a journal entry: a place and a time the
 *                person records themselves. No visit, no touch.
 *
 * Verified presence comes ONLY from visits, which only `record_touch()` (a
 * physical Touch) can create. A past entry joins `JourneyEntry` as its own
 * kind and is never a visit: it must not colour the map, count as a verified
 * place, move region progress or reach visitor analytics. Everything below
 * that means "verified" reads `journey.verified`, which is built from visits
 * alone — past entries are not even passed to it.
 */

const keys = {
  visits: (userId: string) => privateKey(userId, 'visits'),
  memories: (userId: string) => privateKey(userId, 'memories'),
  suggestions: (userId: string) => privateKey(userId, 'suggestions'),
}

export function useMyVisits() {
  const { user } = useAuth()
  return useResource(user ? keys.visits(user.id) : null, fetchMyVisits)
}

export function useMyMemories(enabled = true) {
  const { user } = useAuth()
  return useResource(user && enabled ? keys.memories(user.id) : null, fetchMyMemories)
}

export function useMySuggestions() {
  const { user } = useAuth()
  return useResource(user ? keys.suggestions(user.id) : null, fetchMySuggestions)
}

/** A Touch was recorded: the visit list may have a new or longer visit. */
export function visitsChanged(userId: string) {
  invalidate(keys.visits(userId))
}

/** A memory was saved: show it everywhere at once, without a refetch. */
export function memorySaved(userId: string, memory: MemoryRecord) {
  update<MemoryRecord[]>(keys.memories(userId), (list = []) =>
    list.some((m) => m.id === memory.id) ? list.map((m) => (m.id === memory.id ? memory : m)) : [memory, ...list],
  )
}

export function suggestionsChanged(userId: string) {
  invalidate(keys.suggestions(userId))
}

/** A verified visit to a place, and whatever the user kept of it. */
export type VisitEntry = {
  kind: 'visit'
  id: string
  visit: VisitRow
  place: LocalizedPlace
  memory: MemoryRecord | null
}

/**
 * A past journal entry. `place` is a LINKA place when the person chose one,
 * else null and `label` holds their own words. `date` is what they chose, as
 * precisely as they know it — never a visit's date.
 */
export type PastEntry = {
  kind: 'past'
  id: string
  memory: MemoryRecord
  place: LocalizedPlace | null
  label: string | null
  date: string | null
  precision: 'day' | 'month' | 'year'
}

/** One entry in a person's journal: a verified visit, or a past entry. */
export type JourneyEntry = VisitEntry | PastEntry

export type RegionProgress = { region: string; visited: number; total: number } | null

export type Journey = {
  /** Newest first: one per visit (never one per touch), and one per past entry. */
  entries: readonly JourneyEntry[]
  /** Only the verified visits, newest first. */
  visits: readonly VisitEntry[]
  /** Only the past entries, newest first. */
  past: readonly PastEntry[]
  /** Presence proven by a physical Touch. The only source for colour, progress and "places". */
  verified: {
    placeIds: ReadonlySet<string>
    firstVisit: ReadonlyMap<string, VisitRow>
    lastVisit: ReadonlyMap<string, VisitRow>
    /** The most recently touched visit, for the map's "recent" mark. */
    latest: VisitRow | null
  }
  /** Verified places, grouped by region, newest region first. */
  regions: readonly { region: LocalizedPlace | null; places: LocalizedPlace[] }[]
  /**
   * places / regions: verified only. memories / photos: everything kept, of
   * both kinds. journalPlaces: distinct places in the journal of either kind
   * (LINKA places and the person's own words) — never shown as "visited".
   */
  stats: { places: number; regions: number; memories: number; photos: number; pastMemories: number; journalPlaces: number }
}

/** The date an entry sorts and is shown by: a visit's local date, or the date the person chose. */
export function entryDate(entry: JourneyEntry): string | null {
  return entry.kind === 'visit' ? entry.visit.local_date : entry.date
}

export function buildJourney(index: PlaceIndex, visits: readonly VisitRow[], memories: readonly MemoryRecord[]): Journey {
  const memoryByVisit = new Map(memories.flatMap((m) => (m.kind !== 'past' && m.visit_id ? [[m.visit_id, m] as const] : [])))
  const ordered = [...visits].sort(
    (a, b) => b.local_date.localeCompare(a.local_date) || b.last_touched_at.localeCompare(a.last_touched_at),
  )

  const visitEntries: VisitEntry[] = ordered.flatMap((visit) => {
    const place = index.byId.get(visit.place_id)
    return place ? [{ kind: 'visit' as const, id: visit.id, visit, place, memory: memoryByVisit.get(visit.id) ?? null }] : []
  })

  const firstVisit = new Map<string, VisitRow>()
  const lastVisit = new Map<string, VisitRow>()
  let latest: VisitRow | null = null
  for (const { visit } of visitEntries) {
    const first = firstVisit.get(visit.place_id)
    if (!first || visit.first_touched_at < first.first_touched_at) firstVisit.set(visit.place_id, visit)
    const last = lastVisit.get(visit.place_id)
    if (!last || visit.last_touched_at > last.last_touched_at) lastVisit.set(visit.place_id, visit)
    if (!latest || visit.last_touched_at > latest.last_touched_at) latest = visit
  }

  const regions = new Map<string, { region: LocalizedPlace | null; places: LocalizedPlace[] }>()
  for (const { place } of visitEntries) {
    const key = place.parentId ?? place.id
    const group = regions.get(key) ?? { region: regionOf(place, index), places: [] }
    if (!group.places.some((p) => p.id === place.id)) group.places.push(place)
    regions.set(key, group)
  }

  // Past entries: built after, and apart from, everything verified above.
  const past: PastEntry[] = memories
    .filter((m) => m.kind === 'past')
    .map((m) => ({
      kind: 'past' as const,
      id: m.id,
      memory: m,
      place: (m.place_id && index.byId.get(m.place_id)) || null,
      label: m.place_label,
      date: m.remembered_on,
      precision: (m.date_precision === 'month' || m.date_precision === 'year' ? m.date_precision : 'day') as PastEntry['precision'],
    }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.memory.created_at.localeCompare(a.memory.created_at))

  const entries: JourneyEntry[] = [...visitEntries, ...past].sort(
    (a, b) => (entryDate(b) ?? '').localeCompare(entryDate(a) ?? '') || createdAt(b).localeCompare(createdAt(a)),
  )

  const journalPlaces = new Set([
    ...firstVisit.keys(),
    ...past.map((p) => p.place?.id ?? `label:${(p.label ?? '').trim().toLowerCase()}`),
  ])
  const kept = memories.filter((m) => m.kind === 'past' || m.note || m.mood || m.memory_photos.length > 0)
  return {
    entries,
    visits: visitEntries,
    past,
    verified: { placeIds: new Set(firstVisit.keys()), firstVisit, lastVisit, latest },
    regions: [...regions.values()],
    stats: {
      places: firstVisit.size,
      regions: regions.size,
      memories: kept.length,
      photos: memories.reduce((sum, m) => sum + m.memory_photos.length, 0),
      pastMemories: past.length,
      journalPlaces: journalPlaces.size,
    },
  }
}

/**
 * "Exploring Sado · 1 / 5": the region's published, discoverable places, and
 * how many of them the user has verified. Places, not touches or visits.
 */
export function regionProgress(place: LocalizedPlace, index: PlaceIndex, verified: ReadonlySet<string>, locale: Locale): RegionProgress {
  const region = regionOf(place, index)
  if (!region) return null
  const inRegion = index.all.filter((p) => p.parentId === region.id && p.discoverable)
  return {
    region: locale === 'ja' ? region.name : region.nameLatin,
    visited: inRegion.filter((p) => verified.has(p.id)).length,
    total: inRegion.length,
  }
}

/**
 * The signed-in user's journey, built once from places, visits and memories.
 *
 * `journey` is null for a guest (nothing private is requested) and until the
 * places and visits have arrived — which is all the map needs. Memories fill
 * in when they arrive; `memoriesReady` says whether they have, so screens
 * that show memories never mistake "not loaded yet" for "none". A screen
 * that shows no memories (the map) passes `withMemories: false` and never
 * asks for them.
 */
export function useJourneyModel({ withMemories = true }: { withMemories?: boolean } = {}): {
  journey: Journey | null
  memoriesReady: boolean
  index: PlaceIndex | null
  error: unknown
  reload: () => void
} {
  const { index, error: placesError, reload: reloadPlaces } = usePlaces()
  const visits = useMyVisits()
  const memories = useMyMemories(withMemories)

  const journey = useMemo(
    () => (index && visits.data ? buildJourney(index, visits.data, memories.data ?? []) : null),
    [index, visits.data, memories.data],
  )
  const memoriesReady = memories.data !== undefined
  const error = placesError ?? visits.error ?? memories.error ?? null
  const reload = () => {
    reloadPlaces()
    visits.reload()
    memories.reload()
  }
  return { journey, memoriesReady, index, error, reload }
}

/** A past entry was saved or deleted: show it everywhere at once. */
export function memoryRemoved(userId: string, memoryId: string) {
  update<MemoryRecord[]>(keys.memories(userId), (list = []) => list.filter((m) => m.id !== memoryId))
}

function createdAt(entry: JourneyEntry): string {
  return entry.kind === 'visit' ? entry.visit.first_touched_at : entry.memory.created_at
}

export type SuggestionRow = MySuggestionRow
