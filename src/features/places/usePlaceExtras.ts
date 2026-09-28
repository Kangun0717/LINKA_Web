import { useEffect, useState } from 'react'

import {
  fetchPlaceEvents,
  fetchSafetyResources,
  fetchVisitorsToday,
  visitorCountToShow,
  type PlaceEventRow,
  type SafetyResource,
} from '@/features/places/api'

export type PlaceExtras = {
  /** Today's unique real visitors, only when there is one to show (3+). */
  visitors: number | null
  events: PlaceEventRow[]
  safety: SafetyResource[]
  /** The official safety links could not be loaded (shown as such, never hidden). */
  safetyFailed: boolean
  loaded: boolean
}

const EMPTY: PlaceExtras = { visitors: null, events: [], safety: [], safetyFailed: false, loaded: false }
/** Only real places are asked about; dev-preview samples ("preview-sado") are not. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const cache = new Map<string, Promise<Omit<PlaceExtras, 'loaded'>>>()

/**
 * The live parts of a place — today's visitors, its events and its official
 * safety links (its own, its region's, national) — fetched together once per
 * place per visit to the page. The card renders at once without them and
 * fills them in; nothing waits for them.
 */
export function usePlaceExtras(placeId: string | null, regionId: string | null): PlaceExtras {
  const key = `${placeId}|${regionId}`
  const [loaded, setLoaded] = useState<{ key: string; value: Omit<PlaceExtras, 'loaded'> } | null>(null)

  useEffect(() => {
    if (!placeId || !UUID.test(placeId)) return
    let active = true
    let request = cache.get(key)
    if (!request) {
      request = Promise.all([
        fetchVisitorsToday(placeId),
        fetchPlaceEvents(placeId),
        fetchSafetyResources([placeId, regionId && UUID.test(regionId) ? regionId : '']).then(
          (rows) => ({ rows, failed: false }),
          () => ({ rows: [] as SafetyResource[], failed: true }),
        ),
      ]).then(([count, events, safety]) => ({
        visitors: visitorCountToShow(count),
        events,
        safety: safety.rows,
        safetyFailed: safety.failed,
      }))
      cache.set(key, request)
      // Visitors change through the day; let the next visit ask again.
      window.setTimeout(() => cache.delete(key), 60_000)
    }
    request.then((value) => active && setLoaded({ key, value }), () => {})
    return () => {
      active = false
    }
  }, [key, placeId, regionId])

  return loaded && loaded.key === key ? { ...loaded.value, loaded: true } : EMPTY
}
