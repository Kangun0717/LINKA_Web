import { useMemo } from 'react'

import { useJourneyModel, useMySuggestions, type Journey, type JourneyEntry, type SuggestionRow } from '@/data/journey'

/** One Moment is one journey entry: today, always a verified visit and whatever was kept of it. */
export type Moment = JourneyEntry

export type JourneyView = {
  /** Places, visits and memories have all arrived. */
  ready: boolean
  error: unknown
  /** Newest first — one per visit, never one per touch. */
  moments: readonly Moment[]
  /** Verified places, with the region each belongs to. */
  visited: Journey['regions']
  stats: Journey['stats']
  suggestions: readonly SuggestionRow[]
  reload: () => void
}

const NO_STATS: Journey['stats'] = { places: 0, regions: 0, memories: 0, photos: 0 }

/**
 * Moments and Me, read from the one journey model (src/data/journey.ts).
 * Every number they show is counted from the user's own verified visits and
 * memories — nothing is estimated, and touches never inflate a count.
 */
export function useJourney(): JourneyView {
  const { journey, memoriesReady, error, reload } = useJourneyModel()
  const suggestions = useMySuggestions()

  return useMemo(() => {
    const ready = journey !== null && memoriesReady
    return {
      ready,
      error: ready ? null : error,
      moments: ready ? journey.entries : [],
      visited: ready ? journey.regions : [],
      stats: ready ? journey.stats : NO_STATS,
      suggestions: suggestions.data ?? [],
      reload: () => {
        reload()
        suggestions.reload()
      },
    }
  }, [journey, memoriesReady, error, reload, suggestions])
}
