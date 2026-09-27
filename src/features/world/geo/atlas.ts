import { LAND_RINGS } from '@/features/world/geo/landRings'
import { SADO_MAP } from '@/features/world/geo/sado'

/**
 * The geography My World can be entered into.
 *
 *   My World → country → local area → Touch Point
 *
 * This is the world's shape, not anyone's history: it says what Japan and
 * Sado are and where they sit, never who has been there. Which parts of it a
 * person sees is decided entirely by their own places. The ladder is kept
 * whole — a country with a single touched area is still entered as a country
 * first — so every level always means the same thing.
 *
 * Areas are defined by hand for the prototype. An area without a drawn map
 * can be seen at country scale but not yet entered.
 */

export type LngLat = { lng: number; lat: number }

/** A drawn local map. Coordinates are `lng, lat` pairs, like `LAND_RINGS`. */
export type LocalMapData = {
  coast: readonly number[]
  lakes: readonly (readonly number[])[]
  contours: readonly (readonly number[])[]
  roads: readonly (readonly number[])[]
  rivers: readonly (readonly number[])[]
  trees: readonly { lng: number; lat: number; size: number; filled: boolean }[]
  /** Four corners each; `rows` is how many furrows are sketched across it. */
  fields: readonly { corners: readonly number[]; fill: 'meadow' | 'sun' | null; rows: number }[]
  motifs: readonly { kind: 'toki'; lng: number; lat: number }[]
  /** How far around a touch the map reveals itself, km. */
  pocketKm: number
}

export type LocalArea = {
  id: string
  /** Native name first, always. */
  name: string
  nameLatin: string
  /** Which places belong to it: `[west, south, east, north]`. */
  bounds: readonly [number, number, number, number]
  /** The wash it receives at country scale once touched. */
  reveal: { centre: LngLat; km: number; minPx: number }
  /** Which side of the area its name is written on. */
  labelSide: 'left' | 'right' | 'below'
  map: LocalMapData | null
}

export type Country = {
  id: string
  name: string
  nameLatin: string
  /** A rough outline of its waters, `lng, lat, …`, to tell which places belong. */
  waters: readonly number[]
  /** What must be on screen when the country is shown whole. */
  frame: readonly [number, number, number, number]
  /** Where its name is written on the globe before anywhere in it is touched. */
  labelAt: LngLat
  areas: readonly LocalArea[]
}

const SADO: LocalArea = {
  id: 'sado',
  name: '佐渡',
  nameLatin: 'Sado',
  bounds: [138.15, 37.75, 138.65, 38.4],
  reveal: { centre: { lng: 138.39, lat: 38.07 }, km: 42, minPx: 26 },
  labelSide: 'left',
  map: SADO_MAP,
}

const TOKYO: LocalArea = {
  id: 'tokyo',
  name: '東京',
  nameLatin: 'Tokyo',
  bounds: [138.9, 35.45, 140.0, 35.92],
  reveal: { centre: { lng: 139.62, lat: 35.68 }, km: 50, minPx: 28 },
  labelSide: 'right',
  map: null,
}

const KYOTO: LocalArea = {
  id: 'kyoto',
  name: '京都',
  nameLatin: 'Kyoto',
  bounds: [135.5, 34.85, 136.05, 35.35],
  reveal: { centre: { lng: 135.76, lat: 35.05 }, km: 38, minPx: 24 },
  labelSide: 'below',
  map: null,
}

const JAPAN: Country = {
  id: 'jp',
  name: '日本',
  nameLatin: 'Japan',
  waters: [
    122.5, 24.0, 131.5, 24.0, 142.5, 26.5, 145.2, 35.0, 146.6, 42.6, 145.9, 45.9, 141.4, 45.9,
    139.3, 42.2, 135.6, 38.6, 133.0, 37.3, 131.0, 35.4, 129.6, 34.95, 129.35, 34.85, 128.2, 33.8,
    127.4, 31.6, 122.5, 25.0,
  ],
  frame: [128.6, 30.95, 145.85, 45.55],
  labelAt: { lng: 138.2, lat: 33.6 },
  areas: [SADO, TOKYO, KYOTO],
}

export const COUNTRIES: readonly Country[] = [JAPAN]

/** A position in the ladder, as it appears in the URL: `[]`, `['jp']`, `['jp', 'sado']`. */
export type WorldPath = readonly string[]

export type WorldLocation =
  | { level: 0 }
  | { level: 1; country: Country }
  | { level: 2; country: Country; area: LocalArea & { map: LocalMapData } }

/** Anything that is not a real, enterable place falls back to its nearest real parent. */
export function locate(path: WorldPath): WorldLocation {
  const country = COUNTRIES.find(({ id }) => id === path[0])
  if (!country) return { level: 0 }

  const area = country.areas.find(({ id }) => id === path[1])
  if (!area || !area.map) return { level: 1, country }

  return { level: 2, country, area: { ...area, map: area.map } }
}

export function pathOf(location: WorldLocation): WorldPath {
  if (location.level === 0) return []
  if (location.level === 1) return [location.country.id]
  return [location.country.id, location.area.id]
}

/**
 * Generates a map's lazily drawn detail now, so it is ready before it is
 * needed. Returns how much there is, which is only a way of reading it.
 */
export function warmLocalMap(map: LocalMapData): number {
  return map.trees.length + map.fields.length + map.contours.length
}

export function countryOf(place: LngLat): Country | null {
  return COUNTRIES.find((country) => insideRing(place, country.waters)) ?? null
}

export function areaOf(country: Country, place: LngLat): LocalArea | null {
  return (
    country.areas.find(({ bounds: [w, s, e, n] }) =>
      place.lng >= w && place.lng <= e && place.lat >= s && place.lat <= n,
    ) ?? null
  )
}

function insideRing({ lng, lat }: LngLat, ring: readonly number[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [ring[i], ring[i + 1], ring[j], ring[j + 1]]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/**
 * The land drawn close in. It is the globe's own land, so nothing shifts as
 * the view moves between them — except that an island with a drawn map uses
 * that map's coast, so the island never changes shape on the way down.
 */
let detailedLand: readonly (readonly number[])[] | null = null

export function getDetailedLand(): readonly (readonly number[])[] {
  return (detailedLand ??= buildDetailedLand())
}

function buildDetailedLand(): readonly (readonly number[])[] {
  const drawn = COUNTRIES.flatMap((country) => country.areas.flatMap((area) => area.map ?? []))

  const replaced = (ring: readonly number[]) =>
    drawn.some((map) => {
      const [w, s, e, n] = boundsOf(map.coast)
      const [rw, rs, re, rn] = boundsOf(ring)
      return rw >= w - 0.1 && re <= e + 0.1 && rs >= s - 0.1 && rn <= n + 0.1
    })

  return [...LAND_RINGS.filter((ring) => !replaced(ring)), ...drawn.map((map) => map.coast)]
}

export function boundsOf(ring: readonly number[]): [number, number, number, number] {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let i = 0; i < ring.length; i += 2) {
    w = Math.min(w, ring[i])
    e = Math.max(e, ring[i])
    s = Math.min(s, ring[i + 1])
    n = Math.max(n, ring[i + 1])
  }
  return [w, s, e, n]
}
