import { Link } from 'react-router-dom'

import { NoteHeading, Postcard, SketchCover, Stamp } from '@/components/notebook/Notebook'
import { StageChip } from '@/features/community/components/CommunityParts'
import { MOCK_JOURNAL, MOCK_ME, MOCK_SUGGESTIONS } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import { useMessages } from '@/lib/i18n/useMessages'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * DEV PREVIEW — Me, beginning to show a person's relationship with LINKA:
 * where they have been (verified apart from journal), what they suggested,
 * what they would like to see, and what became LINKA because of them —
 * kept for good. No followers, no rankings.
 */
export default function MePreview() {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const c = cc.contributions
  const mine = MOCK_SUGGESTIONS.filter((s) => s.proposerName === MOCK_ME.nickname || s.id === 'kitazawa' || s.id === 'skyline')
  const became = mine.filter((s) => s.status === 'published')
  const places = new Set(MOCK_JOURNAL.map((e) => e.placeName)).size
  const verified = new Set(MOCK_JOURNAL.filter((e) => e.kind === 'verified').map((e) => e.placeName)).size

  const stats: [string, number, boolean][] = [
    [c.verifiedPlaces, verified, true],
    [c.placesVisited, places, false],
    [c.journalMemories, MOCK_JOURNAL.length, false],
    [c.suggested, mine.length, false],
    [c.supported, MOCK_ME.supportedCount, false],
    [c.becameLinka, became.length, false],
  ]

  return (
    <PreviewFrame nav="me">
      <header className="px-5 pt-2">
        <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{copy.me.title}</h1>
        <p className="mt-3 text-[1.4rem] font-light tracking-[0.04em] text-graphite">{MOCK_ME.nickname}</p>
      </header>

      <section className="mx-5 mt-6">
        <NoteHeading title={c.title} />
        {/* A passport page: the verified count set apart with the :))) mark. */}
        <dl className="mt-4 grid grid-cols-3 gap-2">
          {stats.map(([label, value, touch]) => (
            <div key={label} className={touch ? 'rounded-xl bg-[#fbf3de] px-2 py-3 text-center ring-1 ring-[#e8d49a]' : 'rounded-xl bg-white/70 px-2 py-3 text-center ring-1 ring-graphite/[0.07]'}>
              <dd className="text-[1.35rem] font-light tabular-nums text-graphite">{value}</dd>
              <dt className="mt-0.5 text-[0.56rem] leading-tight tracking-[0.04em] text-graphite-soft">
                {touch && <span className="touchpoint-mark block text-graphite">:)))</span>}
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {became.map((s) => (
        <section key={s.id} className="relative mx-5 mt-9">
          <p className="mb-3 text-[0.8rem] tracking-[0.04em] text-graphite">{c.becameLinkaForever}</p>
          <Postcard src={s.photos[0] ?? null} alt="" tilt={-1} ratio="16 / 9" caption={`${s.name} · ${s.publicArea}`}>
            <SketchCover title={s.name} />
          </Postcard>
          <Stamp top="THANK YOU" bottom="2026.09.26" tone="moss" size={74} className="absolute -right-1 top-5" />
        </section>
      ))}

      <section className="mx-5 mt-10">
        <NoteHeading title={c.mySuggestions} />
        <ul className="mt-3 space-y-2.5">
          {mine.map((s) => (
            <li key={s.id}>
              <Link to={`/preview/4c/community/suggestions/${s.id}`} className="block rounded-xl bg-white/70 px-4 py-3.5 ring-1 ring-graphite/[0.07]">
                <p lang="ja" className="text-[0.9rem] tracking-[0.04em] text-graphite">{s.publicArea.replace(/・.*/, '')}・{s.name}</p>
                <p className="mt-1 text-[0.68rem] tabular-nums text-graphite-soft">{c.wantToGo(s.supportCount)}</p>
                <p className="mt-2"><StageChip status={s.status} /></p>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/preview/4c/community" className="mt-4 flex min-h-11 items-center justify-between rounded-xl px-3.5 text-[0.8rem] text-graphite ring-1 ring-graphite/15">
          {cc.community.title}
          <span aria-hidden className="text-graphite-soft">›</span>
        </Link>
      </section>
    </PreviewFrame>
  )
}
