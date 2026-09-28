import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { signedPhotoUrls, type MemoryPhotoRow } from '@/features/memories/api'
import MemoryComposer from '@/features/memories/MemoryComposer'
import PhotoViewer from '@/features/memories/PhotoViewer'
import SignInGate from '@/features/journey/SignInGate'
import { useJourney, type Moment } from '@/features/journey/useJourney'
import { useAuth } from '@/features/auth/useAuth'
import AppShell from '@/layouts/AppShell'
import { MOOD_EMOJI } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, HTML_LANG } from '@/lib/i18n/locale'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * Moments — the travel journal, newest first.
 *
 * One entry per Touch: the date at the place, the place, the mood, the words
 * and the photograph the user kept. Quiet and personal, like a notebook, not a
 * feed: no counts, no one else. Tapping an entry opens its memory to add to it.
 */
export default function MomentsScreen() {
  const copy = useMessages()
  const journey = useJourney()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [openId, setOpenId] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [viewing, setViewing] = useState<{ photo: MemoryPhotoRow; place: string } | null>(null)

  const photoPaths = journey.moments.flatMap((m) => m.memory?.memory_photos.map((p) => p.storage_path) ?? []).join('|')
  useEffect(() => {
    if (!photoPaths) return
    let active = true
    signedPhotoUrls(photoPaths.split('|')).then((next) => active && setUrls(next), () => {})
    return () => {
      active = false
    }
  }, [photoPaths])

  return (
    <AppShell active="moments">
      <div className="h-full overflow-y-auto bg-paper-lit px-5 pb-32 pt-[max(2.25rem,env(safe-area-inset-top))]">
        <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{copy.moments.title}</h1>

        {!session && <SignInGate />}

        {session && journey.error !== null && !journey.ready && (
          <div role="alert" className="mt-16 text-center">
            <p className="text-[0.84rem] text-graphite-soft">{copy.loadFailed}</p>
            <button type="button" onClick={journey.reload} className="mt-3 min-h-11 text-[0.8rem] text-graphite underline decoration-graphite/30 underline-offset-4">
              {copy.retry}
            </button>
          </div>
        )}

        {session && journey.ready && journey.moments.length === 0 && (
          <div className="mt-24 text-center">
            <p className="text-[0.86rem] font-light leading-relaxed text-graphite-soft">{copy.moments.empty}</p>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="mt-5 min-h-11 text-[0.8rem] text-graphite underline decoration-graphite/30 underline-offset-4"
            >
              {copy.moments.emptyAction}
            </button>
          </div>
        )}

        {session && !journey.ready && journey.error === null && (
          <div className="mt-10 h-40 animate-pulse rounded-2xl bg-graphite/[0.04] motion-reduce:animate-none" />
        )}

        <ol className="mt-6 space-y-8">
          {journey.moments.map((moment) => (
            <MomentEntry
              key={moment.touch.id}
              moment={moment}
              urls={urls}
              open={openId === moment.touch.id}
              onToggle={() => setOpenId(openId === moment.touch.id ? null : moment.touch.id)}
              onView={(photo) => setViewing({ photo, place: moment.place.name })}
              onSaved={journey.reload}
            />
          ))}
        </ol>
      </div>

      {viewing && urls[viewing.photo.storage_path] && (
        <PhotoViewer
          src={urls[viewing.photo.storage_path]}
          alt={copy.memory.photoAlt(viewing.place)}
          width={viewing.photo.width}
          height={viewing.photo.height}
          onClose={() => setViewing(null)}
        />
      )}
    </AppShell>
  )
}

function MomentEntry({
  moment,
  urls,
  open,
  onToggle,
  onView,
  onSaved,
}: {
  moment: Moment
  urls: Record<string, string>
  open: boolean
  onToggle: () => void
  onView: (photo: MemoryPhotoRow) => void
  onSaved: () => void
}) {
  const copy = useMessages()
  const { locale } = useLocale()
  const { touch, place, memory } = moment
  const photos = memory?.memory_photos ?? []
  const cover = photos.find((p) => p.id === memory?.cover_photo_id) ?? photos[0]

  return (
    <li>
      <p className="text-[0.6rem] uppercase tracking-[0.22em] text-graphite-soft tabular-nums">
        {formatCalendarDate(touch.local_date ?? touch.touched_at, locale)}
        {touch.is_test && <span className="ml-2 normal-case tracking-[0.06em] text-graphite-faint">· {copy.moments.test}</span>}
      </p>
      <h2 lang="ja" className="mt-1.5 text-[1.2rem] font-light tracking-[0.08em] text-graphite">{place.name}</h2>
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
          <MemoryComposer visit={{ touchEventId: touch.id, placeId: place.id }} placeName={place.name} onSaved={onSaved} />
        </div>
      )}
    </li>
  )
}
