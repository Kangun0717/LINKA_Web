import { Link } from 'react-router-dom'

import { Postcard, SketchCover, Stamp, Tape } from '@/components/notebook/Notebook'
import { formatJournalDate, type JournalEntryView } from '@/features/journal/model'
import { cn } from '@/lib/cn'
import { MOOD_EMOJI } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useMessages } from '@/lib/i18n/useMessages'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * One page of the journal. Verified and past entries share the same care —
 * a photograph printed like a keepsake, the place, the date, the mood, the
 * words — and differ only in their mark: a verified Touch carries a small
 * :))) ink stamp; a past entry is taped in and says it is from the journal.
 * Nothing about a past entry ever suggests it was a LINKA Touch.
 */
export default function JournalEntryCard({ entry, href, index = 0 }: { entry: JournalEntryView; href?: string; index?: number }) {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const tilt = [-1.2, 0.9, -0.5, 1.4][index % 4]
  const cover = entry.photos[0]
  const date = formatJournalDate(entry.date, entry.datePrecision, locale)
  const verified = entry.kind === 'verified'

  const body = (
    <article className="relative">
      <div className="relative">
        {cover ? (
          <Postcard src={cover.src} alt="" tilt={tilt} ratio={entry.photos.length > 1 ? '4 / 3' : '3 / 2'} />
        ) : (
          <Postcard src={null} alt="" tilt={tilt} ratio="3 / 1.4">
            <SketchCover title={entry.placeName} seed={index + 2} />
          </Postcard>
        )}
        {verified ? (
          <Stamp top="LINKA TOUCH" bottom={entry.date.replaceAll('-', '.')} size={64} className="absolute -right-2 -top-4" angle={-12} />
        ) : (
          <Tape tone={index % 2 ? 'mist' : 'sun'} className="-top-2 left-6" style={{ transform: 'rotate(-4deg)' }} />
        )}
        {entry.photos.length > 1 && (
          <span className="absolute bottom-4 right-3 rounded-full bg-black/45 px-2 py-0.5 text-[0.58rem] tracking-[0.06em] text-white">
            {cc.journal.photos(entry.photos.length)}
          </span>
        )}
      </div>

      <div className="mt-3.5 px-1">
        <p className={cn('flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.2em]', verified ? 'text-graphite' : 'text-graphite-soft')}>
          {verified ? (
            <>
              <span aria-hidden className="touchpoint-mark normal-case tracking-normal">:)))</span>
              {cc.journal.verifiedOn(date)}
            </>
          ) : (
            <>
              <span aria-hidden className="inline-block h-px w-4 bg-graphite-faint" />
              <span className="normal-case tracking-[0.08em]">{cc.journal.fromJournal}</span>
              <span className="tabular-nums">· {date}</span>
            </>
          )}
        </p>
        <h3 lang="ja" className="mt-1.5 text-[1.18rem] font-light tracking-[0.08em] text-graphite">
          {entry.placeName}
          {entry.mood && <span aria-label={copy.memory.moods[entry.mood]} className="ml-2 text-[0.95rem]">{MOOD_EMOJI[entry.mood]}</span>}
        </h3>
        {entry.placeSecond && <p className="text-[0.56rem] uppercase tracking-[0.22em] text-graphite-soft">{entry.placeSecond}</p>}
        {entry.text && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[0.84rem] font-light leading-relaxed text-graphite">{entry.text}</p>}
      </div>
    </article>
  )

  return href ? (
    <Link to={href} className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-graphite/30">
      {body}
    </Link>
  ) : (
    body
  )
}
