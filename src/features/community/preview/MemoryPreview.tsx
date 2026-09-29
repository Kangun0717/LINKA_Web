import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Stamp, Tape } from '@/components/notebook/Notebook'
import { MOCK_JOURNAL } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import PhotoTray, { type TrayPhoto } from '@/features/journal/components/PhotoTray'
import { formatJournalDate } from '@/features/journal/model'
import PhotoViewer from '@/features/memories/PhotoViewer'
import { cn } from '@/lib/cn'
import { MOOD_EMOJI } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useMessages } from '@/lib/i18n/useMessages'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * DEV PREVIEW — one journal entry: its photographs as a swipeable strip
 * (tap for full screen), the place, the date, the mood and the words, and
 * the photos editable (add, reorder, cover, remove).
 */
export default function MemoryPreview() {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const { id = 'toki-2026' } = useParams()
  const entry = MOCK_JOURNAL.find((e) => e.id === id) ?? MOCK_JOURNAL[0]
  const [photos, setPhotos] = useState<TrayPhoto[]>(entry.photos.map((p, i) => ({ key: `${i}`, src: p.src })))
  const [viewing, setViewing] = useState<number | null>(null)
  const [shown, setShown] = useState(0)
  const [editing, setEditing] = useState(false)
  const verified = entry.kind === 'verified'
  const date = formatJournalDate(entry.date, entry.datePrecision, locale)

  return (
    <PreviewFrame back="/preview/4c/journal" nav="moments">
      {photos.length > 0 && (
        <div className="relative mt-2">
          <ol
            className="flex snap-x snap-mandatory overflow-x-auto"
            onScroll={(e) => setShown(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          >
            {photos.map((photo, i) => (
              <li key={photo.key} className="w-full shrink-0 snap-center px-5">
                <button type="button" onClick={() => setViewing(i)} className="block w-full bg-white p-[5px] pb-2 shadow-[0_10px_24px_-12px_rgba(51,48,43,0.35)]" aria-label={copy.memory.photoAlt(entry.placeName)}>
                  <img src={photo.src} alt="" className="block aspect-[4/3] w-full object-cover" />
                </button>
              </li>
            ))}
          </ol>
          {photos.length > 1 && (
            <p aria-hidden className="mt-3 flex justify-center gap-1.5">
              {photos.map((p, i) => (
                <span key={p.key} className={cn('size-1.5 rounded-full', i === shown ? 'bg-graphite' : 'bg-graphite/20')} />
              ))}
            </p>
          )}
          {verified ? (
            <Stamp top="LINKA TOUCH" bottom={entry.date.replaceAll('-', '.')} size={70} className="absolute -top-3 right-3" />
          ) : (
            <Tape tone="sun" className="-top-1 left-10" style={{ transform: 'rotate(-5deg)' }} />
          )}
        </div>
      )}

      <article className="mt-6 px-5">
        <p className="text-[0.6rem] uppercase tracking-[0.2em] text-graphite-soft">
          {verified ? (
            <><span className="touchpoint-mark normal-case tracking-normal text-graphite">:)))</span> {cc.journal.verifiedOn(date)}</>
          ) : (
            <span className="normal-case tracking-[0.08em]">{cc.journal.fromJournal} · {date}</span>
          )}
        </p>
        <h1 lang="ja" className="mt-2 text-[1.6rem] font-light tracking-[0.08em] text-graphite">{entry.placeName}</h1>
        {entry.placeSecond && <p className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{entry.placeSecond}</p>}
        {entry.mood && (
          <p className="mt-4 text-[0.82rem] text-graphite"><span aria-hidden className="mr-1.5">{MOOD_EMOJI[entry.mood]}</span>{copy.memory.moods[entry.mood]}</p>
        )}
        {entry.text && (
          <p className="mt-4 whitespace-pre-wrap bg-[repeating-linear-gradient(transparent_0_1.75rem,rgba(111,104,96,0.13)_1.75rem_calc(1.75rem+1px))] text-[0.92rem] font-light leading-[1.75rem] text-graphite">
            {entry.text}
          </p>
        )}

        <div className="mt-8 flex gap-3">
          <button type="button" onClick={() => setEditing((v) => !v)} className="min-h-11 flex-1 rounded-full text-[0.78rem] text-graphite ring-1 ring-graphite/20">
            {cc.journal.addPhotos}
          </button>
          <Link to={`/preview/4c/share?kind=postcard&entry=${entry.id}`} className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-graphite text-[0.78rem] text-paper-lit">
            {cc.share.title}
          </Link>
        </div>
        {editing && (
          <div className="mt-5">
            <PhotoTray photos={photos} onChange={setPhotos} onAdd={(files) => setPhotos((list) => [...list, ...files.map((f) => ({ key: `${f.name}-${Math.random()}`, src: URL.createObjectURL(f) }))])} />
          </div>
        )}
      </article>

      {viewing !== null && photos[viewing] && (
        <PhotoViewer src={photos[viewing].src} alt={copy.memory.photoAlt(entry.placeName)} width={1200} height={900} onClose={() => setViewing(null)} />
      )}
    </PreviewFrame>
  )
}
