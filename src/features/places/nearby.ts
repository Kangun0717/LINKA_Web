import { HTML_LANG, type Locale } from '@/lib/i18n/locale'

/**
 * How far another LINKA place is — and exactly what that number means.
 *
 * Today every distance is the straight line between two places' published
 * coordinates, measured from the place being viewed: no device location is
 * asked for, and it is never a route. The two fields name that meaning, so a
 * later version can supply another (from the visitor's own position, along a
 * walking / driving / transit route, with a time) without the Place Card
 * changing: it formats `meters` and explains the number by `from` + `basis`.
 */
export type PlaceDistance = {
  meters: number
  /** Only 'straight_line' today. Later: 'walking' | 'driving' | 'transit', which would add `seconds`. */
  basis: 'straight_line'
  /** Only 'place' today (from the place being viewed). Later: 'visitor' (device location, with permission). */
  from: 'place'
}

export type Coordinates = { lat: number; lng: number }

const EARTH_RADIUS_M = 6_371_008.8

/** Great-circle (haversine) distance in metres. */
export function straightLineMeters(a: Coordinates, b: Coordinates): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Other places, nearest first, each with its distance from `origin`. The origin itself is left out. */
export function nearbyPlaces<T extends Coordinates & { id: string }>(
  origin: Coordinates & { id: string },
  candidates: readonly T[],
): (T & { distance: PlaceDistance })[] {
  return candidates
    .filter((place) => place.id !== origin.id)
    .map((place) => ({
      ...place,
      distance: { meters: straightLineMeters(origin, place), basis: 'straight_line' as const, from: 'place' as const },
    }))
    .sort((a, b) => a.distance.meters - b.distance.meters)
}

/**
 * An approximate distance people read at a glance: `850 m`, `1.4 km`, `12 km`.
 * Metres to the nearest 10 under 1 km, one decimal under 10 km, whole
 * kilometres beyond — precise enough for a straight line, never falsely exact.
 */
export function formatDistance(meters: number, locale: Locale): string {
  const number = (value: number, digits: number) =>
    new Intl.NumberFormat(HTML_LANG[locale], { maximumFractionDigits: digits }).format(value)
  const rounded = Math.max(10, Math.round(meters / 10) * 10)
  if (rounded < 1000) return `${number(rounded, 0)} m`
  const km = meters / 1000
  return km < 10 ? `${number(Math.round(km * 10) / 10, 1)} km` : `${number(Math.round(km), 0)} km`
}
