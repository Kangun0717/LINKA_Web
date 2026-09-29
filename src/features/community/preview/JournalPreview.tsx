import { Link } from 'react-router-dom'

import { NoteHeading } from '@/components/notebook/Notebook'
import SadoSketch from '@/features/community/components/SadoSketch'
import { MOCK_JOURNAL } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import JournalEntryCard from '@/features/journal/components/JournalEntryCard'
import { useMessages } from '@/lib/i18n/useMessages'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * DEV PREVIEW — Moments as a travel journal: verified Touches and past
 * entries side by side, newest first, grouped by year, each a photograph
 * first. The little map shows the two layers apart — only :))) is a Touch.
 */
export default function JournalPreview() {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const years = [...new Set(MOCK_JOURNAL.map((e) => e.date.slice(0, 4)))]

  return (
    <PreviewFrame nav="moments">
      <header className="px-5 pt-2">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{copy.moments.title}</h1>
        </div>
        <Link
          to="/preview/4c/journal/add"
          className="mt-4 flex min-h-12 items-center justify-center rounded-full border border-dashed border-graphite/35 bg-white/50 text-[0.86rem] tracking-[0.06em] text-graphite"
        >
          {cc.journal.addMemory}
        </Link>
      </header>

      <section className="mx-5 mt-7">
        <NoteHeading title={cc.journal.yourMap} />
        <div className="mt-3 rounded-sm bg-white/55 p-3 shadow-[0_1px_2px_rgba(51,48,43,0.08)]">
          <SadoSketch
            className="mx-auto max-w-[210px]"
            label={cc.journal.yourMap}
            pins={MOCK_JOURNAL.flatMap((e) =>
              e.point ? [e.kind === 'verified' ? { id: e.id, kind: 'verified' as const, ...e.point } : { id: e.id, kind: 'past' as const, ...e.point, photo: e.photos[0]?.src }] : [],
            )}
          />
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[0.58rem] tracking-[0.06em] text-graphite-soft">
            <span><span className="touchpoint-mark text-graphite">:)))</span> {cc.journal.legendVerified}</span>
            <span><span aria-hidden className="mr-1 inline-block size-2 rotate-[-7deg] border border-[#d8d0c3] bg-white align-middle" />{cc.journal.legendPast}</span>
          </p>
        </div>
      </section>

      {years.map((year) => (
        <section key={year} className="mt-10 px-5">
          <p className="mb-5 flex items-center gap-3 text-[0.7rem] tabular-nums tracking-[0.3em] text-graphite-soft">
            {year}
            <span aria-hidden className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#a79f94_0_3px,transparent_3px_6px)]" />
          </p>
          <ol className="space-y-12">
            {MOCK_JOURNAL.filter((e) => e.date.startsWith(year)).map((entry) => (
              <li key={entry.id}>
                <JournalEntryCard entry={entry} index={MOCK_JOURNAL.indexOf(entry)} href={`/preview/4c/journal/${entry.id}`} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </PreviewFrame>
  )
}
