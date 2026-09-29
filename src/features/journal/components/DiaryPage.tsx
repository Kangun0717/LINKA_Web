import { Link } from 'react-router-dom'

import { SketchCover, Stamp, Tape } from '@/components/notebook/Notebook'
import type { JourneyEntry } from '@/data/journey'
import { faceOf } from '@/features/journal/entry'
import { PrivatePhoto } from '@/features/memories/PrivatePhoto'
import { cn } from '@/lib/cn'
import { MOOD_TINT } from '@/features/journal/mood'
import { MOOD_EMOJI } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { HTML_LANG } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * One page of the travel notebook. Both kinds get the same care — a printed
 * photograph, the place set in type, the date, the mood, the words — and are
 * told apart only by their mark, so a journal entry never feels lesser:
 *
 *   verified  a round :))) LINKA TOUCH ink stamp with the day
 *   past      taped in, with a hand-written date and "From my journal"
 */
export default function DiaryPage({ entry, urls, index = 0 }: { entry: JourneyEntry; urls: Record<string, string>; index?: number }) {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const face = faceOf(entry, locale)
  const memory = entry.memory
  const cover = face.photos[0]
  const second = face.photos[1]
  const tilt = [-1.3, 1, -0.6, 1.5][index % 4]

  return (
    <Link to={`/moments/${entry.id}`} className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-graphite/30">
      <article className="relative">
        <div className="relative">
          {second && (
            <div aria-hidden className="absolute inset-x-6 -top-1 bottom-4 bg-white p-[5px] shadow-[0_1px_2px_rgba(51,48,43,0.1)]" style={{ transform: `rotate(${-tilt * 2.2}deg)` }}>
              <PrivatePhoto photo={second} urls={urls} className="block h-full w-full object-cover opacity-90" />
            </div>
          )}
          <figure
            className="relative bg-white p-[5px] pb-2 shadow-[0_1px_2px_rgba(51,48,43,0.12),0_12px_26px_-14px_rgba(51,48,43,0.4)]"
            style={{ transform: `rotate(${tilt}deg)` }}
          >
            {cover ? (
              <PrivatePhoto photo={cover} urls={urls} className="block aspect-[3/2] w-full bg-paper-shade object-cover" alt={copy.memory.photoAlt(face.name)} />
            ) : (
              <div className="aspect-[3/1.35] w-full">
                <SketchCover title={face.name} seed={index + 2} />
              </div>
            )}
          </figure>
          {face.verified ? (
            <Stamp top="LINKA TOUCH" bottom={face.stamp ?? ''} size={66} className="absolute -right-2 -top-5" angle={-12} />
          ) : (
            <Tape tone={index % 2 ? 'mist' : 'sun'} className="-top-2 left-7" style={{ transform: 'rotate(-4deg)' }} />
          )}
          {face.photos.length > 1 && (
            <span className="absolute bottom-4 right-3 rounded-full bg-black/45 px-2 py-0.5 text-[0.58rem] tracking-[0.06em] text-white">{cc.journal.photos(face.photos.length)}</span>
          )}
        </div>

        <div className="mt-4 px-1">
          <p className={cn('flex flex-wrap items-center gap-x-2 text-[0.58rem] uppercase tracking-[0.2em]', face.verified ? 'text-graphite' : 'text-graphite-soft')}>
            {face.verified ? (
              <>
                <span aria-hidden className="touchpoint-mark normal-case tracking-normal">:)))</span>
                <span>{cc.diary.verifiedBadge}</span>
                <span className="tabular-nums tracking-[0.12em] text-graphite-soft">· {face.date}</span>
              </>
            ) : (
              <>
                <span aria-hidden className="inline-block h-px w-4 bg-graphite-faint" />
                <span className="normal-case tracking-[0.08em]">{cc.diary.pastBadge}</span>
                <span className="font-light normal-case italic tracking-[0.04em] text-graphite">· {face.date ?? cc.diary.noDate}</span>
              </>
            )}
            {entry.kind === 'visit' && entry.visit.is_test && <span className="normal-case tracking-[0.06em] text-graphite-faint">· {copy.moments.test}</span>}
          </p>
          <h3 lang="ja" className="mt-1.5 text-[1.3rem] font-light leading-snug tracking-[0.1em] text-graphite">{face.name}</h3>
          {face.second && <p className="text-[0.56rem] uppercase tracking-[0.24em] text-graphite-soft">{face.second}</p>}
          {memory?.mood && (
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] text-graphite" style={{ backgroundColor: `${MOOD_TINT[memory.mood]}b3` }}>
              <span aria-hidden>{MOOD_EMOJI[memory.mood]}</span>
              {copy.memory.moods[memory.mood]}
            </p>
          )}
          {memory?.note ? (
            <p lang={HTML_LANG[locale]} className="mt-2.5 line-clamp-3 whitespace-pre-wrap text-[0.86rem] font-light leading-relaxed text-graphite">
              {memory.note}
            </p>
          ) : (
            face.verified && !memory?.mood && <p className="mt-2 text-[0.72rem] italic text-graphite-faint">{cc.diary.writeMemory} ›</p>
          )}
        </div>
      </article>
    </Link>
  )
}
