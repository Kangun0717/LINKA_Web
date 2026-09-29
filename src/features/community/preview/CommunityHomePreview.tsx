import { Link } from 'react-router-dom'

import { NoteHeading, Postcard, SketchCover, Stamp, Tape } from '@/components/notebook/Notebook'
import { StageChip, StageTrail } from '@/features/community/components/CommunityParts'
import SadoSketch from '@/features/community/components/SadoSketch'
import type { SuggestionView } from '@/features/community/model'
import { MOCK_SUGGESTIONS } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

const detail = (s: SuggestionView) => `/preview/4c/community/suggestions/${s.id}`

/**
 * DEV PREVIEW — Community home: a living field notebook of Sado rather than
 * a feed. A handful of each, in sections, never an endless scroll.
 */
export default function CommunityHomePreview() {
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const open = MOCK_SUGGESTIONS.filter((s) => s.status !== 'published')
  const wanted = [...open].sort((a, b) => b.supportCount - a.supportCount).slice(0, 4)
  const latest = [...open].sort((a, b) => b.openedAt.localeCompare(a.openedAt)).slice(0, 3)
  const talking = open.filter((s) => s.status === 'contacting_partner' || s.status === 'approved')
  const added = MOCK_SUGGESTIONS.filter((s) => s.status === 'published')

  return (
    <PreviewFrame nav="me">
      <header className="px-5 pt-3">
        <p className="text-[0.62rem] uppercase tracking-[0.3em] text-graphite-soft">{cc.community.title}</p>
        <h1 className="mt-2 text-[1.55rem] font-light leading-snug tracking-[0.06em] text-graphite">{cc.community.tagline}</h1>
        <p className="mt-2 text-[0.78rem] font-light leading-relaxed text-graphite-soft">{cc.community.intro}</p>
        <Link
          to="/preview/4c/community/suggest"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-graphite px-5 text-[0.8rem] tracking-[0.06em] text-paper-lit"
        >
          {cc.community.suggestAction}
        </Link>
      </header>

      <section className="relative mx-5 mt-7 rounded-sm bg-white/55 p-3 shadow-[0_1px_2px_rgba(51,48,43,0.08)]">
        <Tape tone="mist" className="-top-2 right-10" style={{ transform: 'rotate(5deg)' }} />
        <SadoSketch
          className="mx-auto max-w-[180px]"
          label={cc.community.title}
          pins={[
            ...open.flatMap((s) => (s.point ? [{ id: s.id, kind: 'suggested' as const, ...s.point, label: s.name.slice(0, 6) }] : [])),
            ...added.flatMap((s) => (s.point ? [{ id: s.id, kind: 'published' as const, ...s.point }] : [])),
          ]}
        />
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[0.58rem] tracking-[0.06em] text-graphite-soft">
          <span><span className="text-[#a4543a]">◯</span> {cc.community.stages.suggested}</span>
          <span><span className="text-[#5f7a55]">:)))</span> {cc.community.stages.published}</span>
        </p>
      </section>

      <section className="mt-9">
        <div className="px-5">
          <NoteHeading title={cc.community.wantToGo} second={cc.community.stagesSecond.support} />
        </div>
        <ul className="mt-4 flex gap-4 overflow-x-auto px-5 pb-3 pt-1">
          {wanted.map((s, i) => (
            <li key={s.id} className="w-40 shrink-0">
              <Link to={detail(s)} className="block outline-none">
                <Postcard src={s.photos[0] ?? null} alt="" tilt={[-1.5, 1.2, -0.6, 1.6][i]} ratio="4 / 5">
                  <SketchCover title={s.name} note={s.publicArea} seed={i} />
                </Postcard>
                <p lang="ja" className="mt-2.5 truncate text-[0.84rem] tracking-[0.04em] text-graphite">{s.name}</p>
                <p className="text-[0.62rem] tracking-[0.04em] text-graphite-soft">
                  <span className="text-[#a4543a]">♡</span> <span className="tabular-nums">{s.supportCount}</span> · {s.publicArea}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 px-5">
        <NoteHeading
          title={cc.community.suggestions}
          second={cc.community.stagesSecond.suggested}
          action={<span className="text-[0.66rem] text-graphite-soft underline decoration-graphite/25 underline-offset-4">{cc.community.seeAll}</span>}
        />
        <ul className="mt-3 divide-y divide-dashed divide-graphite/15 border-y border-dashed border-graphite/15">
          {latest.map((s) => (
            <li key={s.id}>
              <Link to={detail(s)} className="flex items-start justify-between gap-3 py-3.5 outline-none">
                <div className="min-w-0">
                  <p lang="ja" className="truncate text-[0.9rem] tracking-[0.04em] text-graphite">{s.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[0.7rem] font-light text-graphite-soft">{s.reason}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-[0.6rem] text-graphite-soft">
                    <StageChip status={s.status} />
                    <span>{s.publicArea}</span>
                    <span className="tabular-nums">{formatCalendarDate(s.openedAt, locale)}</span>
                  </p>
                </div>
                <span className="shrink-0 pt-0.5 text-[0.72rem] tabular-nums text-graphite-soft"><span className="text-[#a4543a]">♡</span> {s.supportCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-9 px-5">
        <NoteHeading title={cc.community.talking} second={cc.community.stagesSecond.local} />
        <ul className="mt-4 space-y-3">
          {talking.map((s) => (
            <li key={s.id}>
              <Link to={detail(s)} className="block rounded-xl bg-white/65 p-4 ring-1 ring-graphite/[0.07] outline-none">
                <div className="flex items-baseline justify-between gap-3">
                  <p lang="ja" className="text-[0.9rem] tracking-[0.04em] text-graphite">{s.name}</p>
                  <span className="text-[0.62rem] text-graphite-soft">{s.publicArea}</span>
                </div>
                <div className="mt-3.5">
                  <StageTrail status={s.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 px-5">
        <NoteHeading title={cc.community.recentlyAdded} second={cc.community.stagesSecond.published} />
        {added.map((s) => (
          <Link key={s.id} to={detail(s)} className="relative mt-5 block outline-none">
            <Postcard src={s.photos[0] ?? null} alt="" tilt={-1} ratio="16 / 9" caption={`${s.name} · ${s.publicArea}`}>
              <SketchCover title={s.name} />
            </Postcard>
            <Stamp top="NOW A LINKA PLACE" bottom={formatCalendarDate(s.publishedAt!, 'en')} tone="moss" size={78} className="absolute -right-2 -top-5" />
          </Link>
        ))}
      </section>

      <p className="mt-10 px-5 text-center text-[0.62rem] tracking-[0.06em] text-graphite-faint">{cc.community.notRanking}</p>
    </PreviewFrame>
  )
}
