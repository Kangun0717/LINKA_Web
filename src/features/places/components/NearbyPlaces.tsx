import type { Hero } from '@/features/places/localize'
import { formatDistance, type PlaceDistance } from '@/features/places/nearby'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useMessages } from '@/lib/i18n/useMessages'

export type NearbyPlace = { id: string; name: string; nameLatin: string; hero: Hero | null; distance?: PlaceDistance | null }

/**
 * Other LINKA places, in the order given (nearest first — see `nearbyPlaces`),
 * each with its distance. What the distance means is said once, underneath,
 * from the distance itself (`from` + `basis`): today always a straight line
 * from this place — never a route or a travel time.
 */
export default function NearbyPlaces({
  places,
  onOpen,
  tabIndex,
}: {
  places: readonly NearbyPlace[]
  onOpen: (id: string) => void
  tabIndex: number
}) {
  const copy = useMessages()
  const { locale } = useLocale()
  const first = places[0]?.distance

  return (
    <>
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {places.map((other) => (
          <li key={other.id} className="w-36 shrink-0">
            <button
              type="button"
              tabIndex={tabIndex}
              onClick={() => onOpen(other.id)}
              className="block w-full overflow-hidden rounded-xl bg-white/70 text-left ring-1 ring-graphite/[0.08] outline-none focus-visible:ring-graphite/40"
            >
              {other.hero ? (
                <img src={other.hero.src} alt="" loading="lazy" decoding="async" className="block aspect-[4/3] w-full object-cover" />
              ) : (
                <span className="block aspect-[4/3] w-full bg-graphite/[0.06]" />
              )}
              <span lang="ja" className="block px-2.5 pt-2 text-[0.8rem] tracking-[0.04em] text-graphite">{other.name}</span>
              <span className={cn('block px-2.5 text-[0.52rem] uppercase tracking-[0.18em] text-graphite-soft', other.distance ? 'pb-0.5' : 'pb-2')}>
                {other.nameLatin}
              </span>
              {other.distance && (
                <span className="block px-2.5 pb-2 text-[0.62rem] tabular-nums tracking-[0.04em] text-graphite-soft">
                  {formatDistance(other.distance.meters, locale)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {first && (
        <p className="mt-1.5 text-[0.56rem] leading-snug tracking-[0.03em] text-graphite-faint">
          {copy.sheet.distanceNote[`${first.from}:${first.basis}` as const]}
        </p>
      )}
    </>
  )
}
