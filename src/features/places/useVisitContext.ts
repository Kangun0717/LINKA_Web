import { regionProgress, useJourneyModel, type RegionProgress } from '@/data/journey'
import type { PlaceIndex } from '@/data/places'
import type { LocalizedPlace } from '@/features/places/localize'
import { useLocale } from '@/lib/i18n/LocaleContext'

/** Visit state for a place, from the user's verified visits only. */
export type VisitContext = { visitedOn: string | null; progress: RegionProgress }

/**
 * The signed-in user's relation to a place. `justVisited` is a visit the
 * server has just returned (its date, and its place counted) before the visit
 * list has caught up. Null for a guest.
 */
export function useVisitContext(
  place: LocalizedPlace | null,
  index: PlaceIndex | null,
  justVisited: { placeId: string; localDate: string } | null = null,
): VisitContext | null {
  const { locale } = useLocale()
  const { journey } = useJourneyModel({ withMemories: false })
  if (!place || !index || !journey) return null
  const verified = new Set(journey.verified.placeIds)
  if (justVisited) verified.add(justVisited.placeId)
  const current = justVisited?.placeId === place.id ? justVisited.localDate : null
  return {
    visitedOn: current ?? journey.verified.firstVisit.get(place.id)?.local_date ?? null,
    progress: regionProgress(place, index, verified, locale),
  }
}
