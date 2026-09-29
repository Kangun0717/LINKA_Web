import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MOCK_JOURNAL, MOCK_SUGGESTIONS } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import ShareCard, { type ShareCardData, type ShareFormat } from '@/features/share/ShareCard'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

const KINDS = ['year', 'counts', 'postcard', 'milestone'] as const

/**
 * DEV PREVIEW — the four keepsakes in Story (9:16) and Square (1:1). Saving
 * the image comes with the implementation (drawn to a canvas at 1080 px and
 * offered through the share sheet or as a download — no platform APIs).
 */
export default function SharePreview() {
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const [params] = useSearchParams()
  const [kind, setKind] = useState<(typeof KINDS)[number]>((params.get('kind') as (typeof KINDS)[number]) ?? 'year')
  const [format, setFormat] = useState<ShareFormat>('story')
  const entry = MOCK_JOURNAL.find((e) => e.id === params.get('entry')) ?? MOCK_JOURNAL[0]
  const published = MOCK_SUGGESTIONS.find((s) => s.status === 'published')!
  // One cover per memory: the keepsake shows the journey, not one place three times.
  const photos = MOCK_JOURNAL.flatMap((e) => (e.photos[0] ? [e.photos[0].src] : []))

  const data: ShareCardData =
    kind === 'year'
      ? {
          kind, region: '佐渡', year: 2026, photos,
          places: ['トキの森公園', '佐渡金山', '大野亀', '宿根木'],
          pins: MOCK_JOURNAL.flatMap((e) => (e.point ? [e.kind === 'verified' ? { id: e.id, kind: 'verified' as const, ...e.point } : { id: e.id, kind: 'past' as const, ...e.point, photo: e.photos[0]?.src }] : [])),
        }
      : kind === 'counts'
        ? { kind, region: '佐渡', year: 2026, touched: 4, memories: 7, photos }
        : kind === 'postcard'
          ? { kind, place: entry.placeName, placeSecond: entry.placeSecond ?? '', date: formatCalendarDate(entry.date, locale), text: entry.text ?? '', photo: entry.photos[0]?.src ?? null }
          : { kind, place: published.name, area: published.publicArea, date: '2026.09.26', supportCount: published.supportCount, photo: published.photos[0] ?? null }

  return (
    <PreviewFrame back="/preview/4c">
      <div className="px-5 pt-2">
        <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{cc.share.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cn('min-h-9 rounded-full px-3.5 text-[0.72rem]', kind === k ? 'bg-graphite text-paper-lit' : 'text-graphite ring-1 ring-graphite/15')}>
              {cc.share.kinds[k]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {(['story', 'square'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={cn('min-h-9 flex-1 rounded-full text-[0.7rem]', format === f ? 'bg-graphite/80 text-paper-lit' : 'text-graphite-soft ring-1 ring-graphite/12')}>
              {f === 'story' ? cc.share.story : cc.share.square}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <ShareCard data={data} format={format} />
      </div>
      <div className="px-5">
        <button type="button" disabled className="mt-6 min-h-12 w-full rounded-full bg-graphite text-[0.84rem] text-paper-lit disabled:opacity-35">
          {cc.share.save}
        </button>
      </div>
    </PreviewFrame>
  )
}
