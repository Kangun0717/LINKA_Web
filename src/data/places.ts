import { useMemo } from 'react'

import {
  fetchPlaceEvents,
  fetchPlaces,
  fetchSafetyResources,
  fetchVisitorsToday,
  visitorCountToShow,
  type PlaceEventRow,
  type PlaceRecord,
  type SafetyResource,
} from '@/features/places/api'
import { localizePlace, type LocalizedPlace } from '@/features/places/localize'
import { useResource } from '@/data/store'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Locale } from '@/lib/i18n/locale'

/**
 * PUBLIC DATA — what LINKA publishes, the same for everyone, signed in or not.
 *
 * Every published place with its translations, sources and hero, fetched once
 * per session and presented in the reader's language; and each place's live
 * extras (today's visitors, events, official safety links).
 */

export type PlaceIndex = {
  /** Every published place, in the current language. */
  all: readonly LocalizedPlace[]
  byId: ReadonlyMap<string, LocalizedPlace>
  bySlug: ReadonlyMap<string, LocalizedPlace>
}

function indexOf(records: readonly PlaceRecord[], locale: Locale): PlaceIndex {
  const all = records.map((record) => localizePlace(record, locale))
  return { all, byId: new Map(all.map((p) => [p.id, p])), bySlug: new Map(all.map((p) => [p.slug, p])) }
}

/** The published places, localized. Switching language never refetches. */
export function usePlaces(): { index: PlaceIndex | null; error: unknown; reload: () => void } {
  const { locale } = useLocale()
  const places = useResource('public:places', fetchPlaces)
  const index = useMemo(() => (places.data ? indexOf(places.data, locale) : null), [places.data, locale])
  return { index, error: places.error, reload: places.reload }
}

/** A place's region (its parent), if it has one. */
export function regionOf(place: LocalizedPlace, index: PlaceIndex): LocalizedPlace | null {
  return place.parentId ? index.byId.get(place.parentId) ?? null : null
}

export type PlaceExtras = {
  /** Today's unique real visitors, only when there is one to show (3+). */
  visitors: number | null
  events: PlaceEventRow[]
  safety: SafetyResource[]
  /** The official safety links could not be loaded (shown as such, never hidden). */
  safetyFailed: boolean
  loaded: boolean
}

const NO_EXTRAS: PlaceExtras = { visitors: null, events: [], safety: [], safetyFailed: false, loaded: false }
/** Only real places are asked about; dev-preview samples ("preview-sado") are not. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Today's visitors change through the day: asked again after a minute. */
const EXTRAS_TTL_MS = 60_000

/**
 * The live parts of a place — today's visitors, its events and its official
 * safety links (its own, its region's, national) — fetched together, once per
 * place per minute however many cards show it. The card renders at once
 * without them and fills them in.
 */
export function usePlaceExtras(placeId: string | null, regionId: string | null): PlaceExtras {
  const real = placeId && UUID.test(placeId) ? placeId : null
  const region = regionId && UUID.test(regionId) ? regionId : ''
  const extras = useResource(
    real ? `public:place-extras:${real}|${region}` : null,
    async (): Promise<PlaceExtras> => {
      const [count, events, safety] = await Promise.all([
        fetchVisitorsToday(real!),
        fetchPlaceEvents(real!),
        fetchSafetyResources([real!, region]).then(
          (rows) => ({ rows, failed: false }),
          () => ({ rows: [] as SafetyResource[], failed: true }),
        ),
      ])
      return { visitors: visitorCountToShow(count), events, safety: safety.rows, safetyFailed: safety.failed, loaded: true }
    },
    EXTRAS_TTL_MS,
  )
  return extras.data ?? NO_EXTRAS
}
