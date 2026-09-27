/**
 * My World's vocabulary.
 *
 * A place exists in someone's world only because they physically touched it.
 * Everything here is keyed by Touch Point, so every future scale — country,
 * city, the illustrated local map — talks about the same places as the globe.
 */

/** One touched place. Several touches at the same Touch Point are one place. */
export type WorldPlace = {
  /** The Touch Point id — stable across every scale. */
  id: string
  /** The place's own name, in its original language. */
  name: string
  /**
   * The same name for everyone else — English or romanised, always second.
   * Real data has no column for it yet and carries `null`.
   */
  nameLatin?: string | null
  /**
   * "Sado, Niigata". There is no column for this yet, so real data will carry
   * `null` until the schema has one — the card simply omits the line.
   */
  locality: string | null
  lat: number
  lng: number
  /** ISO timestamps. */
  firstTouchedAt: string
  lastTouchedAt: string
  /**
   * The one photograph that stands for this place on the map, if the user
   * has added any. A place may hold many; the map only ever shows one.
   */
  photo?: MemoryPhoto | null
}

/** A photograph the user took there — a memory, not an illustration. */
export type MemoryPhoto = {
  src: string
  alt: string
  width: number
  height: number
}

/**
 * A place that can be discovered before it is visited — a LINKA partner or
 * supported Touch Point. It shares its id with the Touch Point, so once the
 * user physically touches it the same place simply becomes theirs.
 *
 * Seeing it here is never a Touch. Only the physical NFC Touch is.
 */
export type DiscoveryPlace = {
  id: string
  name: string
  nameLatin: string
  lat: number
  lng: number
  /** Which side of its mark its name is written on the local map. */
  labelSide?: 'left' | 'right' | 'below'
  intro: { en: string; ja: string }
  image: { src: string; alt: string; credit: string } | null
  /** Curated things to do or see there. */
  activities: readonly { title: string; detail: string }[]
}

export type WorldSnapshot = {
  places: readonly WorldPlace[]
  /** The single place carrying the "recent" treatment, if any. */
  recentPlaceId: string | null
}

/**
 * The zoom ladder My World grows into. Sprint 3B draws world, country and
 * local; the ladder itself lives in `geo/atlas` as a `WorldPath`.
 */
export type WorldScale = 'world' | 'country' | 'city' | 'local' | 'touchpoint'

export const EMPTY_WORLD: WorldSnapshot = { places: [], recentPlaceId: null }

export const NO_DISCOVERY: readonly DiscoveryPlace[] = []
