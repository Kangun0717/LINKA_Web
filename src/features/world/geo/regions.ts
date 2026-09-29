/**
 * The regions My World can be entered into — as a light registry, with no
 * geometry: what each country and area is called, where it lies, and whether
 * it has a drawn local map yet.
 *
 *   My World → country → local area → Touch Point
 *
 * Anything outside the map itself (a Place page linking into the map, Me
 * listing a region) reads this, so it never downloads the drawings. The
 * drawings are attached by `atlas.ts`, inside My World's own chunk.
 *
 * Adding a region, a country — or a campus — is an entry here, plus a drawn
 * map in atlas.ts if it should be enterable. Nothing else names a region.
 */

export type LngLat = { lng: number; lat: number }

/** A position in the ladder, as it appears in the URL: `[]`, `['jp']`, `['jp', 'sado']`. */
export type WorldPath = readonly string[]

export type RegionArea = {
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
  /** Has a drawn local map (atlas.ts), so it can be entered. */
  drawn: boolean
}

export type RegionCountry = {
  id: string
  name: string
  nameLatin: string
  /** A rough outline of its waters, `lng, lat, …`, to tell which places belong. */
  waters: readonly number[]
  /** What must be on screen when the country is shown whole. */
  frame: readonly [number, number, number, number]
  /** Where its name is written on the globe before anywhere in it is touched. */
  labelAt: LngLat
  areas: readonly RegionArea[]
}

export const REGIONS: readonly RegionCountry[] = [
  {
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
    areas: [
      {
        id: 'sado',
        name: '佐渡',
        nameLatin: 'Sado',
        bounds: [138.15, 37.75, 138.65, 38.4],
        reveal: { centre: { lng: 138.39, lat: 38.07 }, km: 42, minPx: 26 },
        labelSide: 'left',
        drawn: true,
      },
      {
        id: 'tokyo',
        name: '東京',
        nameLatin: 'Tokyo',
        bounds: [138.9, 35.45, 140.0, 35.92],
        reveal: { centre: { lng: 139.62, lat: 35.68 }, km: 50, minPx: 28 },
        labelSide: 'right',
        drawn: false,
      },
      {
        id: 'kyoto',
        name: '京都',
        nameLatin: 'Kyoto',
        bounds: [135.5, 34.85, 136.05, 35.35],
        reveal: { centre: { lng: 135.76, lat: 35.05 }, km: 38, minPx: 24 },
        labelSide: 'below',
        drawn: false,
      },
    ],
  },
]

/** The country whose waters hold a point. */
export function countryAt<C extends { waters: readonly number[] }>(countries: readonly C[], point: LngLat): C | null {
  return countries.find((country) => insideRing(point, country.waters)) ?? null
}

/** The area whose bounds hold a point. */
export function areaAt<A extends { bounds: readonly [number, number, number, number] }>(areas: readonly A[], point: LngLat): A | null {
  return areas.find(({ bounds: [w, s, e, n] }) => point.lng >= w && point.lng <= e && point.lat >= s && point.lat <= n) ?? null
}

/**
 * The deepest level of My World that shows a point: its area when that area
 * has a drawn map (`['jp', 'sado']`), else its country (`['jp']`), else the
 * whole world (`[]`).
 */
export function worldPathOf(point: LngLat): WorldPath {
  const country = countryAt(REGIONS, point)
  if (!country) return []
  const area = areaAt(country.areas, point)
  return area?.drawn ? [country.id, area.id] : [country.id]
}

/** A link into My World at a level, optionally with a place's card open. */
export function worldHref(path: WorldPath, place?: string): string {
  const search = new URLSearchParams()
  if (path.length > 0) search.set('at', path.join('/'))
  if (place) search.set('place', place)
  const query = search.toString().replace(/%2F/g, '/')
  return query ? `/home?${query}` : '/home'
}

function insideRing({ lng, lat }: LngLat, ring: readonly number[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [ring[i], ring[i + 1], ring[j], ring[j + 1]]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}
