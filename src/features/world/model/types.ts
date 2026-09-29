import type { RegionProgress } from '@/data/journey'
import type { Hero, LocalizedText, Practical } from '@/features/places/localize'

/**
 * My World's vocabulary.
 *
 * A place gains colour in someone's world only because they physically
 * touched it. Everything is keyed by place, so every scale — country, the
 * illustrated local map, the discovery card — talks about the same places.
 */

/** One touched place. Several touches there, at any of its Touch Points, are one place. */
export type WorldPlace = {
  /** The place id — stable across every scale, shared with its discovery entry. */
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
   * `YYYY-MM-DD`: the calendar date AT THE PLACE of the first touch
   * (`touch_events.local_date`). What the card shows. Absent only in preview
   * scenarios, which fall back to the date written in `firstTouchedAt`.
   */
  firstTouchedOn?: string
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
 * A place that can be discovered before it is visited — a published place
 * with discovery switched on. It shares its id with the place, so once the
 * user physically touches it the same place simply becomes theirs.
 *
 * Seeing it here is never a Touch. Only the physical NFC Touch is.
 */
export type DiscoveryPlace = {
  id: string
  /** The place's public page is /place/:slug. Absent for dev-preview samples. */
  slug?: string
  /** The place's own name, first. */
  name: string
  /** A verified name in the reader's language, or a romanization. */
  nameLatin: string
  lat: number
  lng: number
  /** Which side of its mark its name is written on the local map. */
  labelSide?: 'left' | 'right' | 'below'
  locality: string | null
  /** A short introduction, and the language it is really in. */
  summary: LocalizedText | null
  /** Hours, closures, fees, access — time-sensitive, so dated. */
  practical: Practical | null
  officialUrl: string | null
  sources: readonly { url: string; publisher: string | null }[]
  image: { src: string; alt: string; credit: string } | null
  /** The licensed photograph, with its credit (production places). */
  hero?: Hero | null
  /** The region it belongs to, for its official safety links. */
  regionId?: string | null
  /** "Exploring Sado · 1 / 5" — signed-in users only. */
  progress?: RegionProgress
  /** The region's name in the reader's language, for the safety headings. */
  regionName?: string | null
  /** Curated things to do or see there. */
  activities: readonly { title: string; detail: string }[]
  /**
   * Dev-preview sample content only: the note the card shows to say it is not
   * official. Supplied by the preview data, so the words never ship.
   */
  sampleNote?: string
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
