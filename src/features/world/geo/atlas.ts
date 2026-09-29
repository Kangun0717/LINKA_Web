import { LAND_RINGS } from '@/features/world/geo/landRings'
import { areaAt, countryAt, REGIONS, type LngLat, type RegionArea, type RegionCountry, type WorldPath } from '@/features/world/geo/regions'
import { SADO_MAP } from '@/features/world/geo/sado'

/**
 * The geography My World draws: the region registry (regions.ts) with each
 * area's drawn local map attached, the world's land, and the ladder.
 *
 *   My World → country → local area → Touch Point
 *
 * This is the world's shape, not anyone's history: it says what Japan and
 * Sado are and where they sit, never who has been there. Which parts of it a
 * person sees is decided entirely by their own places. The ladder is kept
 * whole — a country with a single touched area is still entered as a country
 * first — so every level always means the same thing.
 *
 * It carries the heavy geometry, so only My World imports it. Everything else
 * reads the light registry in regions.ts. An area without a drawn map can be
 * seen at country scale but not yet entered.
 */

export type { LngLat, WorldPath } from '@/features/world/geo/regions'

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

/** A region-registry area, with its drawn map when it has one. */
export type LocalArea = RegionArea & { map: LocalMapData | null }

export type Country = Omit<RegionCountry, 'areas'> & { areas: readonly LocalArea[] }

/** The drawn local maps, by area id. An area listed here can be entered. */
const MAPS: Readonly<Record<string, LocalMapData>> = { sado: SADO_MAP }

export const COUNTRIES: readonly Country[] = REGIONS.map((country) => ({
  ...country,
  areas: country.areas.map((area) => {
    if (import.meta.env.DEV && area.drawn !== area.id in MAPS) {
      throw new Error(`regions.ts says ${area.id} is ${area.drawn ? '' : 'not '}drawn; atlas.ts disagrees`)
    }
    return { ...area, map: MAPS[area.id] ?? null }
  }),
}))

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
  return countryAt(COUNTRIES, place)
}

export function areaOf(country: Country, place: LngLat): LocalArea | null {
  return areaAt(country.areas, place)
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
