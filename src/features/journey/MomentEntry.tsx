import { Link } from 'react-router-dom'

import type { Moment } from '@/features/journey/useJourney'
import type { MemoryPhotoRow } from '@/features/memories/api'
import MemoryComposer from '@/features/memories/MemoryComposer'
import { MOOD_EMOJI } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, HTML_LANG } from '@/lib/i18n/locale'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * One Moment — one verified visit: the date at the place, the place, the
 * mood, the words and the photographs kept of it, and (opened) the memory to
 * add to it. Shared by the Moments list and the Moment page (/moments/:id).
 */
export default function MomentEntry({
  moment,
  urls,
  open,
  onToggle,
  onView,
  linked = false,
}: {
  moment: Moment
  urls: Record<string, string>
  open: boolean
  onToggle: () => void
  onView: (photo: MemoryPhotoRow) => void
  /** In the list: the place's name opens this Moment's own page. */
  linked?: boolean
}) {
  const copy = useMessages()
  const { locale } = useLocale()
  const { visit, place, memory } = moment
  const photos = memory?.memory_photos ?? []
  const cover = photos.find((p) => p.id === memory?.cover_photo_id) ?? photos[0]

  return (
    <li>
      <p className="text-[0.6rem] uppercase tracking-[0.22em] text-graphite-soft tabular-nums">
        {formatCalendarDate(visit.local_date, locale)}
        {visit.is_test && <span className="ml-2 normal-case tracking-[0.06em] text-graphite-faint">· {copy.moments.test}</span>}
      </p>
      <h2 lang="ja" className="mt-1.5 text-[1.2rem] font-light tracking-[0.08em] text-graphite">
        {linked ? (
          <Link to={`/moments/${moment.id}`} className="outline-none focus-visible:underline">
            {place.name}
          </Link>
        ) : (
          place.name
        )}
      </h2>
      <p className="text-[0.58rem] uppercase tracking-[0.22em] text-graphite-soft">{place.nameLatin}</p>

      {memory?.mood && (
        <p className="mt-2.5 text-[0.8rem] text-graphite">
          <span aria-hidden className="mr-1.5">{MOOD_EMOJI[memory.mood]}</span>
          {copy.memory.moods[memory.mood]}
        </p>
      )}

      {cover && urls[cover.storage_path] && (
        <button
          type="button"
          onClick={() => onView(cover)}
          aria-label={copy.memory.photoAlt(place.name)}
          className="mt-3 block w-full overflow-hidden rounded-xl bg-graphite/10 outline-none focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          <img
            src={urls[cover.storage_path]}
            alt=""
            width={cover.width}
            height={cover.height}
            loading="lazy"
            className="block max-h-80 w-full object-cover"
          />
        </button>
      )}
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {photos
            .filter((p) => p.id !== cover?.id)
            .map((photo) =>
              urls[photo.storage_path] ? (
                <button key={photo.id} type="button" onClick={() => onView(photo)} className="size-16 shrink-0 overflow-hidden rounded-lg">
                  <img src={urls[photo.storage_path]} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ) : null,
            )}
        </div>
      )}

      {memory?.note ? (
        <p lang={HTML_LANG[locale]} className="mt-3 whitespace-pre-wrap text-[0.86rem] font-light leading-relaxed text-graphite">
          “{memory.note}”
        </p>
      ) : (
        !open && <p className="mt-2 text-[0.72rem] text-graphite-faint">{copy.moments.noMemoryYet}</p>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="mt-2 min-h-11 text-[0.74rem] text-graphite-soft underline decoration-graphite/25 underline-offset-4"
      >
        {open ? copy.place.close : copy.moments.addMemory}
      </button>

      {open && (
        <div className="mt-2">
          <MemoryComposer key={visit.id} visit={{ visitId: visit.id, placeId: visit.place_id }} placeName={place.name} />
        </div>
      )}
    </li>
  )
}
