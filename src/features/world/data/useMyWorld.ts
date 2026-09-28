import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import { fetchMyTouches, fetchPlaces, type PlaceRecord, type TouchRow } from '@/features/places/api'
import { localizePlace, type LocalizedPlace } from '@/features/places/localize'
import {
  EMPTY_WORLD,
  NO_DISCOVERY,
  type DiscoveryPlace,
  type WorldPlace,
  type WorldSnapshot,
} from '@/features/world/model/types'
import type { SheetProgress } from '@/features/places/components/PlaceSheet'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Locale } from '@/lib/i18n/locale'

export type MyWorldData = {
  snapshot: WorldSnapshot
  discovery: readonly DiscoveryPlace[]
  /** False until both the places and the user's touches have arrived. */
  ready: boolean
  error: unknown
}

type Loaded = { userId: string | null; places: PlaceRecord[]; touches: TouchRow[] }

/**
 * The signed-in user's world — the only source production `/home` reads.
 *
 * Published places are the geography that can be discovered; the user's own
 * touch events are what gives it colour. Both are fetched once per visit to
 * My World; the language only changes how they are presented, so switching it
 * is instant and never refetches.
 */
export function useMyWorld(): MyWorldData {
  const { user } = useAuth()
  const { locale } = useLocale()
  const userId = user?.id ?? null
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<unknown>(null)

  const { loading: authLoading } = useAuth()

  // A guest sees the whole public geography and its places, and no colour:
  // colour only ever comes from the signed-in user's own touches.
  useEffect(() => {
    if (authLoading) return
    let active = true
    Promise.all([fetchPlaces(), userId ? fetchMyTouches() : Promise.resolve([] as TouchRow[])])
      .then(([places, touches]) => {
        if (active) setLoaded({ userId, places, touches })
      })
      .catch((cause: unknown) => {
        if (active) setError(cause)
      })
    return () => {
      active = false
    }
  }, [userId, authLoading])

  const fresh = loaded && loaded.userId === userId && !authLoading ? loaded : null

  return useMemo(() => {
    if (!fresh) return { snapshot: EMPTY_WORLD, discovery: NO_DISCOVERY, ready: false, error }

    const places = new Map(fresh.places.map((p) => [p.id, localizePlace(p, locale)]))
    const snapshot = worldOf(fresh.touches, places)
    const visited = new Set(fresh.touches.map((t) => t.place_id))
    // Every discoverable place, visited or not: MyWorld draws only the unvisited
    // ones as ○, but a visited place's card opens the same sheet.
    const discovery = [...places.values()]
      .filter((p) => p.discoverable)
      // Progress is personal: a guest has explored nothing, so none is shown.
      .map((p) => toDiscovery(p, fresh.userId ? progressOf(p, places, visited, locale) : null, regionNameOf(p, places, locale)))

    return { snapshot, discovery, ready: true, error: null }
  }, [fresh, locale, error])
}

/** Touches grouped by place: one coloured place however many times it was touched. */
function worldOf(touches: readonly TouchRow[], places: Map<string, LocalizedPlace>): WorldSnapshot {
  const byPlace = new Map<string, WorldPlace>()
  let recent: TouchRow | null = null

  for (const touch of touches) {
    const place = touch.place_id ? places.get(touch.place_id) : undefined
    if (!place) continue
    recent = touch

    const known = byPlace.get(place.id)
    if (known) {
      known.lastTouchedAt = touch.touched_at
      continue
    }

    byPlace.set(place.id, {
      id: place.id,
      name: place.name,
      nameLatin: place.nameLatin,
      locality: place.locality,
      lat: place.lat,
      lng: place.lng,
      firstTouchedAt: touch.touched_at,
      lastTouchedAt: touch.touched_at,
      firstTouchedOn: touch.local_date ?? undefined,
    })
  }

  return byPlace.size === 0
    ? EMPTY_WORLD
    : { places: [...byPlace.values()], recentPlaceId: recent?.place_id ?? null }
}

/** "Exploring Sado · 1 / 5": the region's published, discoverable places, and how many were touched. */
function progressOf(
  place: LocalizedPlace,
  places: Map<string, LocalizedPlace>,
  visited: Set<string | null>,
  locale: Locale,
): SheetProgress {
  const region = place.parentId ? places.get(place.parentId) : undefined
  if (!region) return null
  const inRegion = [...places.values()].filter((p) => p.parentId === region.id && p.discoverable)
  return {
    region: locale === 'ja' ? region.name : region.nameLatin,
    visited: inRegion.filter((p) => visited.has(p.id)).length,
    total: inRegion.length,
  }
}

function regionNameOf(place: LocalizedPlace, places: Map<string, LocalizedPlace>, locale: Locale): string | null {
  const region = place.parentId ? places.get(place.parentId) : undefined
  if (!region) return null
  return locale === 'en' ? region.nameLatin : region.name
}

function toDiscovery(place: LocalizedPlace, progress: SheetProgress, regionName: string | null): DiscoveryPlace {
  return {
    id: place.id,
    name: place.name,
    nameLatin: place.nameLatin,
    lat: place.lat,
    lng: place.lng,
    labelSide: place.labelSide,
    locality: place.locality,
    summary: place.summary,
    practical: place.practical,
    officialUrl: place.officialUrl,
    sources: place.sources,
    image: null,
    hero: place.hero,
    regionId: place.parentId,
    regionName,
    progress,
    activities: [],
  }
}
