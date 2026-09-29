import PlaceSheet from '@/features/places/components/PlaceSheet'
import { nearbyPlaces } from '@/features/places/nearby'
import { usePlaceExtras } from '@/data/places'
import type { DiscoveryPlace } from '@/features/world/model/types'
import { cn } from '@/lib/cn'
import { useMessages } from '@/lib/i18n/useMessages'

type DiscoveryCardProps = {
  place: DiscoveryPlace
  shown: boolean
  onClose: () => void
  /** `YYYY-MM-DD` at the place when the user first touched it; null if never. */
  visitedOn?: string | null
  /** Other discoverable places, for "More LINKA places nearby". */
  others?: readonly DiscoveryPlace[]
  onOpenOther?: (id: string) => void
}

/**
 * A place, opened from the map — the Place Sheet on warm paper.
 *
 * Before a visit it carries nothing personal: no date, no :))), no photograph
 * of theirs, and it never says "visited". Looking is not touching. After a
 * visit, the same sheet opens from the place's Memory Card and says when.
 *
 * It rises from the navigation rather than hanging from its mark, because it
 * carries more than a name; the map above stays in view.
 */
export default function DiscoveryCard({ place, shown, onClose, visitedOn = null, others = [], onOpenOther }: DiscoveryCardProps) {
  const copy = useMessages()
  const tab = shown ? 0 : -1
  const extras = usePlaceExtras(shown ? place.id : null, place.regionId ?? null)

  return (
    <section
      aria-label={visitedOn ? place.name : copy.a11y.discoverable(place.name, place.nameLatin)}
      aria-hidden={!shown}
      className={cn(
        'absolute inset-x-3 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] max-h-[74dvh] overflow-y-auto overscroll-contain rounded-2xl pb-5',
        'bg-[rgba(252,249,242,0.96)] backdrop-blur-[12px]',
        'shadow-[0_0_0_0.5px_rgba(51,48,43,0.07),0_12px_36px_-14px_rgba(80,112,128,0.3)]',
        'transition-[opacity,translate] duration-500 ease-calm',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      {/* A zero-height sticky row: the ✕ stays reachable while scrolling and never narrows the photo. */}
      <div className="sticky top-0 z-10 h-0">
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.place.close}
          tabIndex={tab}
          className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-paper-lit/85 text-graphite-soft shadow-[0_0_0_0.5px_rgba(51,48,43,0.12)] outline-none backdrop-blur-sm focus-visible:ring-1 focus-visible:ring-graphite/30"
        >
          <svg aria-hidden viewBox="0 0 10 10" className="size-2.5">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="overflow-hidden rounded-t-2xl">
        <PlaceSheet
          place={{
            ...place,
            hero:
              place.hero ??
              (place.image
                ? { src: place.image.src, srcSet: place.image.src, alt: place.image.alt, credit: place.image.credit, sourceUrl: null, license: null, licenseUrl: null }
                : null),
          }}
          visitedOn={visitedOn}
          extras={extras}
          progress={place.progress ?? null}
          tabIndex={tab}
          scope={{ placeId: place.id, regionId: place.regionId ?? null, regionName: place.regionName ?? null }}
          others={nearbyPlaces(place, others.filter((o) => o.regionId === place.regionId)).map((o) => ({
            id: o.id,
            name: o.name,
            nameLatin: o.nameLatin,
            hero: o.hero ?? null,
            distance: o.distance,
          }))}
          onOpenOther={onOpenOther}
        />
        {place.activities.length > 0 && (
          <div className="mt-4 px-5">
            <h3 className="text-[0.58rem] uppercase tracking-[0.22em] text-graphite-soft">{copy.place.activities}</h3>
            <ul className="mt-2 space-y-2.5 border-l border-graphite/10 pl-3">
              {place.activities.map((activity) => (
                <li key={activity.title}>
                  <p className="text-[0.76rem] tracking-[0.02em] text-graphite">{activity.title}</p>
                  <p className="mt-0.5 text-[0.7rem] font-light leading-snug text-graphite-soft">{activity.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
