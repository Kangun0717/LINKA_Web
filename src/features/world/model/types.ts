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
   * "Sado, Niigata". There is no column for this yet, so real data will carry
   * `null` until the schema has one — the card simply omits the line.
   */
  locality: string | null
  lat: number
  lng: number
  /** ISO timestamps. */
  firstTouchedAt: string
  lastTouchedAt: string
}

export type WorldSnapshot = {
  places: readonly WorldPlace[]
  /** The single place carrying the "recent" treatment, if any. */
  recentPlaceId: string | null
}

/**
 * The zoom ladder My World grows into. Only `world` is drawn in Sprint 3A:
 * world scale is the quiet globe, local scale will be the illustrated map.
 */
export type WorldScale = 'world' | 'country' | 'city' | 'local' | 'touchpoint'

export const EMPTY_WORLD: WorldSnapshot = { places: [], recentPlaceId: null }
