import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Stamp, Tape } from '@/components/notebook/Notebook'
import LoadFailed from '@/components/ui/LoadFailed'
import { useCommunityList, useMySupports, useMySuggestionIds } from '@/data/community'
import type { PublicSuggestionRow } from '@/features/community/api'
import { CommunityPicture, SuggestionPostcard, SuggestionTile } from '@/features/community/components/CommunityCard'
import CommunityFrame, { SectionHead, SeeAll } from '@/features/community/components/CommunityFrame'
import SadoSketch, { type SketchPin } from '@/features/community/components/SadoSketch'
import { STAGES, stageOf } from '@/lib/i18n/communityMessages'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

const onSado = (s: PublicSuggestionRow) =>
  s.public_latitude !== null && s.public_longitude !== null && s.public_latitude > 37.7 && s.public_latitude < 38.4 && s.public_longitude > 138.1 && s.public_longitude < 138.7

/**
 * /community — a field notebook of places travellers found, organised around
 * the places and their journey into LINKA rather than around people:
 *
 *   みんなが見つけた場所   newly opened suggestions, as postcards
 *   行ってみたい           where travellers would like to go (interest, not a vote)
 *   LINKAになるまで        the six stages, and how many places are at each
 *   LINKAになった場所      suggestions that became LINKA places
 *
 * Everything comes from the public read model; nothing personal is shown
 * but the viewer's own 行ってみたい.
 */
export default function CommunityScreen() {
  const cc = useCommunityMessages()
  const copy = useMessages()
  const list = useCommunityList()
  const supports = useMySupports()
  const mine = useMySuggestionIds()
  const all = useMemo(() => list.data ?? [], [list.data])

  const open = all.filter((s) => s.status !== 'published')
  const found = open.slice(0, 3)
  const wanted = [...open].sort((a, b) => b.support_count - a.support_count).slice(0, 8)
  const became = all.filter((s) => s.status === 'published').slice(0, 3)
  // Suggested (submitted) is private: never counted in public.
  const perStage = STAGES.filter((stage) => stage !== 'suggested').map((stage) => ({ stage, count: all.filter((s) => stageOf(s.status) === stage).length }))
  const pins: SketchPin[] = all.filter(onSado).map((s) =>
    s.status === 'published'
      ? { id: s.id, kind: 'published', lng: s.public_longitude!, lat: s.public_latitude! }
      : { id: s.id, kind: 'suggested', lng: s.public_longitude!, lat: s.public_latitude! },
  )
  // Three different places for the postcards on the cover: photographs first.
  const dealt = [...all.filter((s) => s.cover_path), ...all.filter((s) => !s.cover_path)].slice(0, 3)

  return (
    <CommunityFrame back="/home" backLabel={copy.nav.map} wide>
      <header className="relative px-5 pt-2 sm:px-8">
        <p className="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-graphite-soft">
          <span aria-hidden className="touchpoint-mark normal-case tracking-normal text-graphite">:)))</span>
          {cc.hub.eyebrow}
        </p>
        <h1 className="mt-3 text-[2rem] font-extralight leading-[1.25] tracking-[0.12em] text-graphite sm:text-[2.4rem]">{cc.hub.title}</h1>
        <p className="mt-3 max-w-md text-[0.84rem] font-light leading-relaxed text-graphite-soft">{cc.hub.lead}</p>

        {/* Three postcards, dealt onto the page. */}
        <div aria-hidden className="relative mx-auto mt-7 h-52 max-w-sm">
          {[0, 1, 2].map((i) => {
            const s = dealt[i]
            return (
              <div
                key={i}
                className="absolute w-[46%]"
                style={{ left: `${[2, 27, 52][i]}%`, top: `${[14, 0, 18][i]}%`, transform: `rotate(${[-7, 2, 8][i]}deg)`, zIndex: [1, 3, 2][i] }}
              >
                <CommunityPicture path={s?.cover_path ?? null} name={s?.name ?? ['佐渡', '相川', '宿根木'][i]} seed={i + 3} ratio="4 / 5" sizes="180px" priority={i === 1} />
              </div>
            )
          })}
          <Stamp top="COMMUNITY" bottom="LINKA" size={70} className="absolute -right-1 bottom-0 z-10" angle={-14} />
        </div>

        <Link
          to="/community/suggest"
          className="mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full bg-graphite text-[0.86rem] tracking-[0.06em] text-paper-lit outline-none focus-visible:ring-2 focus-visible:ring-graphite/40 sm:inline-flex sm:px-8"
        >
          <span aria-hidden>＋</span> {cc.hub.suggestCta}
        </Link>
      </header>

      {list.error !== null && list.data === undefined && (
        <div className="px-5 pt-8">
          <LoadFailed onRetry={list.reload} />
        </div>
      )}
      {list.data === undefined && list.error === null && (
        <div className="mx-5 mt-10 h-72 animate-pulse rounded-sm bg-graphite/[0.04] motion-reduce:animate-none" />
      )}

      {list.data !== undefined && all.length === 0 && (
        <p className="mx-5 mt-12 rounded-sm bg-white/60 px-5 py-6 text-center text-[0.8rem] font-light leading-relaxed text-graphite-soft">{cc.hub.empty}</p>
      )}

      {found.length > 0 && (
        <section className="mt-14 px-5 sm:px-8">
          <SectionHead title={cc.hub.foundTitle} lead={cc.hub.foundLead} action={<SeeAll to="/community/suggestions" label={cc.hub.seeAll} />} />
          <ol className="mt-7 grid gap-14 sm:grid-cols-2 sm:gap-10">
            {found.map((s, i) => (
              <li key={s.id}>
                <SuggestionPostcard suggestion={s} supported={supports.ids.has(s.id)} own={mine.has(s.id)} index={i} priority={i === 0} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {wanted.length > 0 && (
        <section className="mt-16">
          <div className="px-5 sm:px-8">
            <SectionHead title={cc.hub.wantTitle} lead={cc.hub.wantLead} />
          </div>
          <ul className="mt-5 flex gap-4 overflow-x-auto px-5 pb-3 pt-2 sm:px-8">
            {wanted.map((s, i) => (
              <li key={s.id}>
                <SuggestionTile suggestion={s} index={i} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {all.length > 0 && (
        <section className="mt-14 px-5 sm:px-8">
          <SectionHead title={cc.hub.journeyTitle} lead={cc.hub.journeyLead} />
          <ol className="relative mt-6 rounded-sm bg-white/60 px-4 py-5 shadow-[0_1px_2px_rgba(51,48,43,0.08)]">
            <Tape tone="mist" className="-top-2 right-10" style={{ transform: 'rotate(5deg)' }} />
            <span aria-hidden className="absolute bottom-8 left-[1.6rem] top-8 w-px bg-[repeating-linear-gradient(180deg,#a79f94_0_4px,transparent_4px_7px)]" />
            {perStage.map(({ stage, count }, i) => (
              <li key={stage}>
                <Link
                  to={`/community/suggestions?stage=${stage}`}
                  className="relative flex min-h-12 items-center gap-4 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-graphite/30"
                >
                  <span
                    aria-hidden
                    className={
                      stage === 'published'
                        ? 'relative z-10 flex size-5 items-center justify-center rounded-full bg-[#5f7a55] text-[0.5rem] text-white'
                        : 'relative z-10 flex size-5 items-center justify-center rounded-full bg-paper-lit text-[0.56rem] tabular-nums text-graphite ring-1 ring-graphite/30'
                    }
                  >
                    {stage === 'published' ? '✓' : i + 2}
                  </span>
                  <span className="flex-1 text-[0.86rem] tracking-[0.06em] text-graphite">{cc.stageShort[stage]}</span>
                  <span className="text-[0.66rem] tabular-nums text-graphite-soft">{cc.hub.count(count)}</span>
                  <span aria-hidden className="text-graphite-faint">›</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {pins.length > 0 && (
        <section className="mx-5 mt-14 sm:mx-8">
          <SectionHead title={cc.hub.mapTitle} />
          <div className="relative mt-5 rounded-sm bg-white/55 p-3 shadow-[0_1px_2px_rgba(51,48,43,0.08)]">
            <Tape tone="sun" className="-top-2 left-8" style={{ transform: 'rotate(-4deg)' }} />
            <SadoSketch className="mx-auto max-w-[240px]" label={cc.hub.mapTitle} pins={pins} />
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[0.58rem] tracking-[0.06em] text-graphite-soft">
              <span><span className="text-[#a4543a]">◯</span> {cc.stageShort.suggested}</span>
              <span><span className="text-[#5f7a55]">:)))</span> {cc.stageShort.published}</span>
            </p>
          </div>
        </section>
      )}

      {became.length > 0 && (
        <section className="mt-16 px-5 sm:px-8">
          <SectionHead title={cc.hub.becameTitle} lead={cc.hub.becameLead} action={<SeeAll to="/community/suggestions?stage=published" label={cc.hub.seeAll} />} />
          <ol className="mt-7 grid gap-14 sm:grid-cols-2 sm:gap-10">
            {became.map((s, i) => (
              <li key={s.id}>
                <SuggestionPostcard suggestion={s} supported={supports.ids.has(s.id)} own={mine.has(s.id)} index={i + 1} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="relative mx-5 mt-16 rounded-sm bg-[#f6efe2] px-5 py-7 shadow-[0_1px_2px_rgba(51,48,43,0.1),0_14px_28px_-20px_rgba(51,48,43,0.5)] sm:mx-8">
        <Tape tone="rose" className="-top-2 left-1/2 -translate-x-1/2" />
        <h2 className="text-[1.15rem] font-light tracking-[0.08em] text-graphite">{cc.hub.suggestTitle}</h2>
        <p className="mt-2 text-[0.78rem] font-light leading-relaxed text-graphite-soft">{cc.hub.suggestLead}</p>
        <Link to="/community/suggest" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-graphite px-5 text-[0.8rem] tracking-[0.06em] text-paper-lit">
          <span aria-hidden>＋</span> {cc.hub.suggestCta}
        </Link>
      </section>

      <p className="mt-12 px-5 text-center text-[0.62rem] tracking-[0.06em] text-graphite-faint">{cc.community.notRanking}</p>
    </CommunityFrame>
  )
}
