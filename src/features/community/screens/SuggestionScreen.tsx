import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Stamp, Tape } from '@/components/notebook/Notebook'
import LoadFailed from '@/components/ui/LoadFailed'
import { communityChanged, useCommunitySuggestion, useMySuggestion, useMySupports, useMySuggestionIds, useSuggestionTimeline } from '@/data/community'
import { suggestionsChanged } from '@/data/journey'
import { usePlaces } from '@/data/places'
import { useAuth } from '@/features/auth/useAuth'
import { communityMediaUrl, withdrawSuggestion, type MySuggestionRow, type PublicSuggestionDetail, type TimelineRow } from '@/features/community/api'
import { CommunityPicture, ShareButton, StageProgress, SupportAction } from '@/features/community/components/CommunityCard'
import CommunityFrame from '@/features/community/components/CommunityFrame'
import PhotoViewer from '@/features/memories/PhotoViewer'
import { cn } from '@/lib/cn'
import { STAGES, stageOf, type Stage } from '@/lib/i18n/communityMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, HTML_LANG, type Locale } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * /community/suggestions/:id — one place's journey into LINKA.
 *
 * The public page reads only community_suggestion() and its timeline, so it
 * cannot show what the read model does not return: never the proposer's
 * account, address or own coordinates, never the original reason (only the
 * moderated public one), never an unreviewed photo, never who supports it.
 *
 * Its proposer may open their own suggestion before it is public: that view
 * is read from their own row (RLS), says plainly that only they can see it,
 * and keeps their original words apart from the public version.
 */
export default function SuggestionScreen() {
  const { id = '' } = useParams()
  const cc = useCommunityMessages()
  const detail = useCommunitySuggestion(id)
  const { session } = useAuth()
  const mine = useMySuggestion(id)
  const publicRow = detail.data ?? null
  const ownRow = mine.data ?? null

  const loading = detail.data === undefined && detail.error === null
  const privateOnly = detail.data === null && ownRow !== null

  return (
    <CommunityFrame back="/community" backLabel={cc.hub.back}>
      {detail.error !== null && detail.data === undefined && (
        <div className="px-5 pt-8">
          <LoadFailed onRetry={detail.reload} />
        </div>
      )}
      {(loading || (detail.data === null && session && mine.data === undefined && mine.error === null)) && (
        <div role="status" className="animate-pulse px-5 pt-4 motion-reduce:animate-none">
          <div className="aspect-[4/3] w-full bg-graphite/[0.05]" />
          <div className="mt-6 h-6 w-48 rounded bg-graphite/[0.07]" />
        </div>
      )}
      {publicRow && <PublicSuggestion suggestion={publicRow} own={ownRow} />}
      {privateOnly && <PrivateSuggestion suggestion={ownRow} />}
      {detail.data === null && !ownRow && (!session || mine.data !== undefined) && (
        <div className="px-5 pt-14">
          <h1 className="text-[1.3rem] font-light tracking-[0.06em] text-graphite">{cc.detail.notFound}</h1>
          <p className="mt-3 text-[0.82rem] font-light leading-relaxed text-graphite-soft">{cc.detail.notFoundBody}</p>
          <Link to="/community" className="mt-8 inline-flex min-h-11 items-center rounded-full px-5 text-[0.8rem] text-graphite ring-1 ring-graphite/20">
            {cc.hub.back}
          </Link>
        </div>
      )}
    </CommunityFrame>
  )
}

function PublicSuggestion({ suggestion: s, own }: { suggestion: PublicSuggestionDetail; own: MySuggestionRow | null }) {
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const supports = useMySupports()
  const mineIds = useMySuggestionIds()
  const timeline = useSuggestionTimeline(s.id)
  const { index } = usePlaces()
  const [viewing, setViewing] = useState<string | null>(null)
  const published = s.status === 'published'
  const place = s.place_id ? index?.byId.get(s.place_id) : undefined
  const [hero, ...more] = s.photos

  return (
    <article>
      <div className="relative mx-5 mt-2">
        {hero ? (
          <button type="button" onClick={() => setViewing(hero)} aria-label={cc.detail.photos} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-graphite/30">
            <CommunityPicture path={hero} name={s.name} tilt={-0.8} ratio="4 / 3" priority sizes="(max-width: 480px) 92vw, 440px" />
          </button>
        ) : (
          <CommunityPicture path={null} name={s.name} note={cc.community.noPhotoYet} tilt={-0.8} ratio="4 / 3" seed={2} />
        )}
        <Tape tone="sun" className="-top-2 left-8" style={{ transform: 'rotate(-5deg)' }} />
        {published && s.published_at && (
          <Stamp top="NOW A LINKA PLACE" bottom={s.published_at.slice(0, 10).replaceAll('-', '.')} tone="moss" size={88} className="absolute -bottom-7 -right-1" />
        )}
      </div>

      <header className="mt-8 px-5">
        <p className="text-[0.6rem] uppercase tracking-[0.24em] text-graphite-soft">{s.public_area}</p>
        <h1 lang="ja" className="mt-1.5 text-[1.75rem] font-extralight leading-snug tracking-[0.1em] text-graphite">{s.name}</h1>
        <p className="mt-2 text-[0.68rem] tracking-[0.04em] text-graphite-soft">
          {s.proposer_name ? cc.community.proposedBy(s.proposer_name) : cc.community.proposedAnonymously}
          {s.opened_at && <span className="tabular-nums text-graphite-faint"> · {formatCalendarDate(s.opened_at, locale)}</span>}
        </p>
      </header>

      <section className="mt-6 flex flex-wrap items-start gap-3 px-5">
        <SupportAction suggestion={s} supported={supports.ids.has(s.id)} own={mineIds.has(s.id)} />
        <ShareButton title={s.name} text={cc.act.shareText(s.name)} />
      </section>

      {s.public_reason && (
        <section className="mx-5 mt-9">
          <h2 className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.detail.reason}</h2>
          <p className="mt-2 whitespace-pre-wrap bg-[repeating-linear-gradient(transparent_0_1.75rem,rgba(111,104,96,0.14)_1.75rem_calc(1.75rem+1px))] text-[0.92rem] font-light leading-[1.75rem] text-graphite">
            {s.public_reason}
          </p>
        </section>
      )}

      {own && own.reason !== s.public_reason && <OwnWords original={own.reason} />}

      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="px-5 text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.detail.photos}</h2>
          <ul className="mt-4 flex gap-3 overflow-x-auto px-5 pb-2">
            {more.map((path, i) => (
              <li key={path} className="w-44 shrink-0">
                <button type="button" onClick={() => setViewing(path)} aria-label={`${cc.detail.photos} ${i + 2}`} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-graphite/30">
                  <CommunityPicture path={path} name={s.name} tilt={[1.2, -1, 0.6][i % 3]} ratio="1" sizes="176px" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-5 mt-10 rounded-sm bg-white/60 px-4 py-5 shadow-[0_1px_2px_rgba(51,48,43,0.08)]">
        <h2 className="mb-4 text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.detail.progress}</h2>
        <StageProgress status={s.status} labelled />
      </section>

      <section className="mx-5 mt-10">
        <h2 className="mb-5 text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.detail.journey}</h2>
        <JourneyLadder status={s.status} events={timeline.data ?? []} supportCount={s.support_count} />
      </section>

      {published && place && (
        <div className="mx-5 mt-10">
          <p className="text-[0.9rem] tracking-[0.04em] text-graphite">{cc.community.becameLinka}</p>
          <Link to={`/place/${place.slug}`} className="mt-3 flex min-h-12 items-center justify-between rounded-full bg-graphite px-5 text-[0.84rem] text-paper-lit">
            {cc.community.openPlace}
            <span aria-hidden>›</span>
          </Link>
        </div>
      )}

      {viewing && <PhotoViewer src={communityMediaUrl(viewing)} alt={s.name} width={1200} height={900} onClose={() => setViewing(null)} />}
    </article>
  )
}

/** The proposer's own words, kept as they wrote them, next to the public version. */
function OwnWords({ original }: { original: string }) {
  const cc = useCommunityMessages()
  return (
    <details className="mx-5 mt-5 rounded-xl bg-[#fbf3de]/80 px-4 py-3 ring-1 ring-[#e8d49a]">
      <summary className="min-h-9 cursor-pointer text-[0.72rem] tracking-[0.04em] text-graphite">{cc.detail.yourOriginal}</summary>
      <p className="mt-2 whitespace-pre-wrap text-[0.8rem] font-light leading-relaxed text-graphite">{original}</p>
      <p className="mt-2 text-[0.64rem] leading-snug text-graphite-soft">{cc.detail.publicVersionHint}</p>
    </details>
  )
}

/**
 * The six stages top to bottom — 提案 ↓ みんなの応援 ↓ LINKA確認 ↓ 現地と相談 ↓
 * 準備中 ↓ LINKA Place — each with the day it was reached and LINKA's public
 * notes from that stage. Only the timeline's public notes are shown: there is
 * no other text in the public model.
 */
function JourneyLadder({ status, events, supportCount }: { status: string; events: readonly TimelineRow[]; supportCount: number }) {
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const current = STAGES.indexOf(stageOf(status))
  const reached = new Map<Stage, string>()
  const notes = new Map<Stage, { at: string; text: string; lang: Locale; milestone: boolean }[]>()
  let at: Stage = 'suggested'
  for (const event of [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))) {
    if (event.kind === 'status' && event.status) {
      at = stageOf(event.status)
      if (!reached.has(at)) reached.set(at, event.occurred_at)
    }
    const text = noteIn(event.public_note, locale)
    if (text || event.kind === 'milestone') {
      notes.set(at, [...(notes.get(at) ?? []), { at: event.occurred_at, text: text?.text ?? cc.community.touchPointInstalled, lang: text?.lang ?? locale, milestone: event.kind === 'milestone' }])
    }
  }

  return (
    <ol className="relative">
      <span aria-hidden className="absolute bottom-4 left-[0.6rem] top-3 w-px bg-[repeating-linear-gradient(180deg,#a79f94_0_4px,transparent_4px_7px)]" />
      {STAGES.map((stage, i) => {
        const done = i < current || (i === current && stage === 'published')
        const now = i === current && stage !== 'published'
        const date = reached.get(stage)
        return (
          <li key={stage} className="relative flex gap-4 pb-6 last:pb-0" aria-current={now ? 'step' : undefined}>
            <span
              aria-hidden
              className={cn(
                'relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[0.52rem]',
                stage === 'published' && done && 'bg-[#5f7a55] text-white',
                stage !== 'published' && done && 'bg-graphite/80 text-paper-lit',
                now && 'bg-paper-lit ring-[1.5px] ring-[#a4543a] ring-offset-2 ring-offset-paper-lit',
                !done && !now && 'bg-paper-lit ring-1 ring-graphite/30',
              )}
            >
              {done ? '✓' : ''}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-[0.86rem] tracking-[0.06em]', done || now ? 'text-graphite' : 'text-graphite-faint')}>
                {cc.stageShort[stage]}
                {date && <span className="ml-2 text-[0.62rem] tabular-nums text-graphite-soft">{formatCalendarDate(date, locale)}</span>}
              </p>
              {stage === 'support' && (done || now) && supportCount > 0 && <p className="mt-0.5 text-[0.7rem] text-graphite-soft">{cc.act.frozen(supportCount)}</p>}
              {(notes.get(stage) ?? []).map((note) => (
                <p key={note.at + note.text} lang={HTML_LANG[note.lang]} className="mt-1.5 rounded-lg bg-white/70 px-3 py-2 text-[0.74rem] font-light leading-relaxed text-graphite ring-1 ring-graphite/[0.06]">
                  <span className="mr-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-graphite-soft">{note.milestone ? '✓' : cc.detail.fromLinka}</span>
                  {note.text}
                </p>
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function noteIn(note: unknown, locale: Locale): { text: string; lang: Locale } | null {
  if (!note || typeof note !== 'object') return null
  const n = note as Partial<Record<Locale, string>>
  for (const lang of [locale, 'en', 'ja', 'zh-Hans'] as const) {
    if (typeof n[lang] === 'string' && n[lang]!.trim()) return { text: n[lang]!, lang }
  }
  return null
}

/** The proposer's own view of a suggestion that is not public (yet, or any more). */
function PrivateSuggestion({ suggestion: s }: { suggestion: MySuggestionRow }) {
  const cc = useCommunityMessages()
  const copy = useMessages()
  const { locale } = useLocale()
  const { user } = useAuth()
  const timeline = useSuggestionTimeline(s.id)
  const [state, setState] = useState<'idle' | 'confirm' | 'busy' | 'failed'>('idle')
  const closed = s.status === 'declined' || s.status === 'duplicate' || s.status === 'withdrawn'

  async function withdraw() {
    setState('busy')
    try {
      await withdrawSuggestion(s.id)
      if (user) suggestionsChanged(user.id)
      communityChanged(user?.id)
      setState('idle')
    } catch {
      setState('failed')
    }
  }

  return (
    <article className="px-5">
      <div className="mt-2 rounded-xl bg-graphite/[0.05] px-4 py-3.5">
        <p className="flex items-center gap-2 text-[0.8rem] tracking-[0.04em] text-graphite">
          <svg aria-hidden viewBox="0 0 12 14" className="h-3.5 w-3">
            <rect x="1" y="6" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          {closed ? cc.detail.closedStates[s.status as 'declined'] : cc.detail.privateTitle}
        </p>
        {!closed && <p className="mt-1.5 text-[0.72rem] font-light leading-relaxed text-graphite-soft">{cc.detail.privateBody}</p>}
      </div>

      <h1 lang="ja" className="mt-7 text-[1.6rem] font-extralight leading-snug tracking-[0.1em] text-graphite">{s.name}</h1>
      <p className="mt-1 text-[0.68rem] text-graphite-soft">
        {s.address} · <span className="tabular-nums">{formatCalendarDate(s.created_at, locale)}</span>
      </p>

      <section className="mt-7">
        <h2 className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.detail.yourOriginal}</h2>
        <p className="mt-2 whitespace-pre-wrap text-[0.9rem] font-light leading-relaxed text-graphite">{s.reason}</p>
      </section>
      {s.public_reason && s.public_reason !== s.reason && (
        <section className="mt-6">
          <h2 className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.detail.publicVersion}</h2>
          <p className="mt-2 whitespace-pre-wrap text-[0.86rem] font-light leading-relaxed text-graphite-soft">{s.public_reason}</p>
          <p className="mt-2 text-[0.64rem] text-graphite-faint">{cc.detail.publicVersionHint}</p>
        </section>
      )}

      {!closed && (
        <section className="mt-9 rounded-sm bg-white/60 px-4 py-5">
          <StageProgress status={s.status} labelled />
        </section>
      )}
      {(timeline.data ?? []).length > 0 && (
        <section className="mt-9">
          <h2 className="mb-5 text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.detail.journey}</h2>
          <JourneyLadder status={s.status} events={timeline.data ?? []} supportCount={s.support_count} />
        </section>
      )}

      {(s.status === 'submitted' || s.status === 'open') && (
        <div className="mt-10">
          {state === 'confirm' || state === 'busy' ? (
            <div className="rounded-xl bg-white/70 p-4 ring-1 ring-graphite/10">
              <p className="text-[0.8rem] text-graphite">{cc.detail.withdrawConfirm}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={state === 'busy'} onClick={() => void withdraw()} className="min-h-11 rounded-full bg-[#a0442c] px-4 text-[0.78rem] text-white disabled:opacity-50">
                  {cc.detail.withdraw}
                </button>
                <button type="button" onClick={() => setState('idle')} className="min-h-11 rounded-full px-4 text-[0.78rem] text-graphite ring-1 ring-graphite/20">
                  {copy.place.close}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setState('confirm')} className="min-h-11 text-[0.74rem] text-graphite-soft underline decoration-graphite/25 underline-offset-4">
              {cc.detail.withdraw}
            </button>
          )}
          {state === 'failed' && <p role="alert" className="mt-2 text-[0.7rem] text-[#a0442c]">{cc.act.failed}</p>}
        </div>
      )}
    </article>
  )
}
