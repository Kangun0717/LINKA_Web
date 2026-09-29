import type { ReactNode } from 'react'

import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { regionOf, usePlaceExtras, type PlaceIndex } from '@/data/places'
import PlaceSheet from '@/features/places/components/PlaceSheet'
import type { LocalizedPlace } from '@/features/places/localize'
import { nearbyPlaces } from '@/features/places/nearby'
import type { VisitContext } from '@/features/places/useVisitContext'
import { useLocale } from '@/lib/i18n/LocaleContext'

/**
 * The Place as a page — shared by the public /place/:slug and the physical
 * Touch entry /t/:publicId, so there is one implementation of what a place
 * says, and the entries differ only in what they add around it.
 *
 *   PlaceView      what LINKA publishes: photo, identity, introduction,
 *                  official information, safety, sources, nearby places
 *   VisitContext   what this person has lived there (signed in only):
 *                  verified visit date and region progress
 *   children       the entry's own actions (the Touch check-in, …)
 */

export function PlaceView({
  place,
  index,
  visit,
  compact = false,
  onOpenPlace,
  children,
}: {
  place: LocalizedPlace
  index: PlaceIndex
  visit: VisitContext | null
  /** Only the photo, identity and introduction (the NFC landing before a choice is made). */
  compact?: boolean
  onOpenPlace: (place: LocalizedPlace) => void
  children?: ReactNode
}) {
  const { locale } = useLocale()
  const region = regionOf(place, index)
  const extras = usePlaceExtras(place.id, region?.id ?? null)
  const nearby = nearbyPlaces(place, index.all.filter((p) => p.discoverable && p.parentId === place.parentId))

  return (
    <PlaceSheet
      place={place}
      visitedOn={visit?.visitedOn ?? null}
      extras={extras}
      progress={visit?.progress ?? null}
      heroPriority
      compact={compact}
      scope={{
        placeId: place.id,
        regionId: region?.id ?? null,
        regionName: region ? (locale === 'en' ? region.nameLatin : region.name) : null,
      }}
      others={nearby}
      onOpenOther={(id) => {
        const other = index.byId.get(id)
        if (other) onOpenPlace(other)
      }}
    >
      {children}
    </PlaceSheet>
  )
}

/** The paper page a place is shown on, with the language in the corner. */
export function PlacePageShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh w-full bg-paper-lit pt-[env(safe-area-inset-top)]">
      <div className="relative mx-auto w-full max-w-md">
        <LanguageSwitcher className="absolute right-2 top-2 z-10 rounded-full bg-paper-lit/80 backdrop-blur-sm" />
        {children}
      </div>
    </main>
  )
}

/** The page's shape while the place loads — photo, name, a few lines. */
export function PlaceSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="animate-pulse motion-reduce:animate-none">
      <div className="mt-4 aspect-[16/10] w-full bg-graphite/[0.06]" />
      <div className="px-5 pt-5">
        <div className="h-6 w-40 rounded bg-graphite/[0.08]" />
        <div className="mt-2 h-3 w-28 rounded bg-graphite/[0.06]" />
        <div className="mt-6 h-3 w-full rounded bg-graphite/[0.05]" />
        <div className="mt-2 h-3 w-5/6 rounded bg-graphite/[0.05]" />
      </div>
    </div>
  )
}
