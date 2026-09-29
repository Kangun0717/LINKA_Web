import { useMemo } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import type { LocalizedPlace } from '@/features/places/localize'
import {
  EMPTY_WORLD,
  NO_DISCOVERY,
  type DiscoveryPlace,
  type WorldPlace,
  type WorldSnapshot,
} from '@/features/world/model/types'
import { regionProgress, useJourneyModel, type Journey, type RegionProgress } from '@/data/journey'
import { regionOf, type PlaceIndex } from '@/data/places'
import { useLocale } from '@/lib/i18n/LocaleContext'

export type MyWorldData = {
  snapshot: WorldSnapshot
  discovery: readonly DiscoveryPlace[]
  /** False until the places (and, signed in, the user's journey) have arrived. */
  ready: boolean
  error: unknown
}

/**
 * The world as this person has lived it — the only source production `/home`
 * reads.
 *
 * Published places are the geography anyone can discover; colour comes only
 * from the user's verified visits (`journey.verified`), never from looking,
 * and never from anything that is not a physical Touch. A guest sees the
 * whole geography and no colour.
 */
export function useMyWorld(): MyWorldData {
  const { user, loading: authLoading } = useAuth()
  const { locale } = useLocale()
  // Colour needs visits only: the map never asks for memories.
  const { journey, index, error } = useJourneyModel({ withMemories: false })
  const signedIn = Boolean(user)

  return useMemo(() => {
    const ready = !authLoading && index !== null && (!signedIn || journey !== null)
    if (!ready) return { snapshot: EMPTY_WORLD, discovery: NO_DISCOVERY, ready: false, error }

    const snapshot = journey ? worldOf(journey) : EMPTY_WORLD
    // Every discoverable place, visited or not: MyWorld draws only the unvisited
    // ones as ○, but a visited place's card opens the same sheet.
    const discovery = index.all
      .filter((p) => p.discoverable)
      // Progress is personal: a guest has explored nothing, so none is shown.
      .map((p) => toDiscovery(p, index, journey ? regionProgress(p, index, journey.verified.placeIds, locale) : null, locale))

    return { snapshot, discovery, ready: true, error: null }
  }, [authLoading, index, signedIn, journey, locale, error])
}

/** One coloured place per verified place, however many visits and touches it has had. */
function worldOf(journey: Journey): WorldSnapshot {
  const places: WorldPlace[] = []
  // In the order the places were first reached — the order the map has always
  // drawn them in (where marks overlap, the later one lies on top).
  const firsts = [...journey.verified.firstVisit].sort(([, a], [, b]) => a.first_touched_at.localeCompare(b.first_touched_at))
  for (const [placeId, first] of firsts) {
    const place = journey.entries.find((entry) => entry.place.id === placeId)!.place
    places.push({
      id: place.id,
      name: place.name,
      nameLatin: place.nameLatin,
      locality: place.locality,
      lat: place.lat,
      lng: place.lng,
      firstTouchedAt: first.first_touched_at,
      lastTouchedAt: journey.verified.lastVisit.get(placeId)!.last_touched_at,
      firstTouchedOn: first.local_date,
    })
  }
  return places.length === 0 ? EMPTY_WORLD : { places, recentPlaceId: journey.verified.latest?.place_id ?? null }
}

function toDiscovery(place: LocalizedPlace, index: PlaceIndex, progress: RegionProgress, locale: string): DiscoveryPlace {
  const region = regionOf(place, index)
  return {
    id: place.id,
    slug: place.slug,
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
    regionName: region ? (locale === 'en' ? region.nameLatin : region.name) : null,
    progress,
    activities: [],
  }
}
