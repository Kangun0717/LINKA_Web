import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Postcard, SketchCover, Stamp, Tape } from '@/components/notebook/Notebook'
import { toggleSupport } from '@/data/community'
import { communityMediaUrl, problemOf, type CommunityProblem, type PublicSuggestionRow } from '@/features/community/api'
import { useAuth } from '@/features/auth/useAuth'
import { useSignInToAct } from '@/features/auth/useSignInToAct'
import { cn } from '@/lib/cn'
import { STAGES, stageOf } from '@/lib/i18n/communityMessages'
import { problemText } from '@/features/community/problems'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { formatCalendarDate } from '@/lib/i18n/locale'
import { useLocale } from '@/lib/i18n/LocaleContext'

/** A suggestion's public picture: the approved copy when there is one, else a drawn cover. */
export function CommunityPicture({
  path,
  name,
  note,
  seed = 0,
  tilt = 0,
  ratio = '4 / 3',
  sizes = '(max-width: 480px) 90vw, 420px',
  priority = false,
  className,
}: {
  path: string | null
  name: string
  note?: string
  seed?: number
  tilt?: number
  ratio?: string
  sizes?: string
  priority?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!path || failed) {
    return (
      <Postcard src={null} alt="" tilt={tilt} ratio={ratio} className={className}>
        <SketchCover title={name} note={note} seed={seed} />
      </Postcard>
    )
  }
  return (
    <figure
      className={cn('relative bg-white p-[5px] pb-2 shadow-[0_1px_2px_rgba(51,48,43,0.12),0_10px_24px_-12px_rgba(51,48,43,0.35)]', className)}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      <img
        src={communityMediaUrl(path)}
        alt=""
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onError={() => setFailed(true)}
        className="block w-full bg-paper-shade object-cover"
        style={{ aspectRatio: ratio }}
      />
    </figure>
  )
}

/**
 * The six stops of a suggestion's journey — 提案 → みんなの応援 → LINKA確認 →
 * 現地と相談 → 準備中 → LINKA Place — as an inked line: passed stops filled,
 * the current one ringed, the rest still pencil. `labelled` names every stop
 * beneath (cards name only the current one).
 */
export function StageProgress({ status, labelled = false, className }: { status: string; labelled?: boolean; className?: string }) {
  const cc = useCommunityMessages()
  const current = STAGES.indexOf(stageOf(status))
  const done = stageOf(status) === 'published'
  return (
    <div className={className}>
      <div role="img" aria-label={`${cc.detail.progress}: ${cc.stageShort[STAGES[current]]} (${current + 1}/${STAGES.length})`} className="relative flex items-center justify-between">
        <span aria-hidden className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#a79f94_0_3px,transparent_3px_6px)]" />
        <span
          aria-hidden
          className={cn('absolute left-1 top-1/2 h-[1.5px] -translate-y-1/2', done ? 'bg-[#5f7a55]' : 'bg-graphite/75')}
          style={{ width: `calc(${(current / (STAGES.length - 1)) * 100}% - 0.5rem)` }}
        />
        {STAGES.map((stage, i) => (
          <span
            key={stage}
            aria-hidden
            className={cn(
              'relative z-10 block rounded-full',
              i < current && (done ? 'size-2 bg-[#5f7a55]' : 'size-2 bg-graphite/80'),
              i === current && (done ? 'size-3.5 bg-[#5f7a55] ring-2 ring-[#5f7a55]/25 ring-offset-2 ring-offset-paper-lit' : 'size-3.5 bg-paper-lit ring-[1.5px] ring-[#a4543a] ring-offset-2 ring-offset-paper-lit'),
              i > current && 'size-2 bg-paper-lit ring-1 ring-graphite/35',
            )}
          />
        ))}
      </div>
      {labelled ? (
        <ol aria-hidden className="mt-2 grid grid-cols-6 gap-0.5 text-center">
          {STAGES.map((stage, i) => (
            <li key={stage} className={cn('text-[0.5rem] leading-tight tracking-[0.02em]', i === current ? 'text-graphite' : 'text-graphite-faint')}>
              {cc.stageShort[stage]}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-[0.64rem] tracking-[0.08em] text-graphite-soft">
          <span className={done ? 'text-[#4c6444]' : 'text-graphite'}>{cc.stageShort[STAGES[current]]}</span>
          <span className="tabular-nums text-graphite-faint"> · {current + 1}/{STAGES.length}</span>
        </p>
      )}
    </div>
  )
}

/**
 * 行ってみたい, for one suggestion, in every state it can be in:
 *
 *   published   the action is replaced by "Became a LINKA Place ✓"; the
 *               count stays, frozen, as part of the place's history
 *   own         the proposer sees their suggestion's count, not a button
 *   guest       a way to sign in that returns here
 *   otherwise   a toggle — shown at once, undone if the server refuses
 *
 * Whether a support is allowed is decided by the server; this only shows
 * its answer in words (never the database's message).
 */
export function SupportAction({
  suggestion,
  supported,
  own,
  size = 'md',
}: {
  suggestion: Pick<PublicSuggestionRow, 'id' | 'status' | 'support_count'>
  supported: boolean
  own: boolean
  size?: 'sm' | 'md'
}) {
  const cc = useCommunityMessages()
  const { user } = useAuth()
  const signIn = useSignInToAct()
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<CommunityProblem | null>(null)
  const count = suggestion.support_count
  const small = size === 'sm'

  if (suggestion.status === 'published') {
    return (
      <div>
        <p className={cn('inline-flex items-center gap-2 rounded-full bg-[#5f7a55]/[0.1] text-[#4c6444] ring-1 ring-[#5f7a55]/30', small ? 'min-h-9 px-3 text-[0.72rem]' : 'min-h-11 px-4 text-[0.84rem]')}>
          {cc.act.became}
        </p>
        <p className="mt-1.5 text-[0.66rem] tabular-nums tracking-[0.04em] text-graphite-soft">
          <Heart filled small /> {cc.act.frozen(count)}
        </p>
      </div>
    )
  }

  if (own) {
    return (
      <div>
        <p className={cn('inline-flex items-center gap-2 rounded-full bg-graphite/[0.05] text-graphite-soft', small ? 'min-h-9 px-3 text-[0.72rem]' : 'min-h-11 px-4 text-[0.82rem]')}>
          <Heart small={small} /> <span className="tabular-nums">{count}</span> · {cc.act.own}
        </p>
        {!small && <p className="mt-1.5 max-w-xs text-[0.64rem] leading-snug text-graphite-faint">{cc.act.ownHint}</p>}
      </div>
    )
  }

  async function toggle() {
    if (!user) {
      signIn()
      return
    }
    setBusy(true)
    setProblem(null)
    try {
      await toggleSupport(user.id, suggestion.id, supported)
    } catch (error) {
      setProblem(problemOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={user ? supported : undefined}
        className={cn(
          'inline-flex items-center gap-2 rounded-full outline-none transition-colors duration-300 ease-calm focus-visible:ring-2 focus-visible:ring-graphite/30 disabled:opacity-60',
          small ? 'min-h-9 px-3 text-[0.72rem]' : 'min-h-11 px-4 text-[0.84rem]',
          supported ? 'bg-[#a4543a]/[0.09] text-[#8a4330] ring-1 ring-[#a4543a]/35' : 'bg-white/80 text-graphite ring-1 ring-graphite/20',
        )}
      >
        <Heart filled={supported} small={small} />
        <span className="tracking-[0.06em]">{user ? (supported ? cc.community.supported : cc.community.support) : small ? cc.community.support : cc.act.signIn}</span>
        <span className="tabular-nums text-graphite-soft">{count}</span>
      </button>
      {!user && !small && <p className="mt-1.5 text-[0.64rem] text-graphite-faint">{cc.act.signInHint}</p>}
      {problem && (
        <p role="alert" className="mt-1.5 max-w-xs text-[0.68rem] leading-snug text-[#a0442c]">
          {problemText(cc, problem)}
        </p>
      )}
    </div>
  )
}

function Heart({ filled = false, small = false }: { filled?: boolean; small?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 16 14" className={cn('inline-block shrink-0 align-[-0.1em]', small ? 'h-3 w-3.5' : 'h-3.5 w-4')}>
      <path
        d="M8 12.6C4.4 9.9 1.4 7.6 1.4 4.6A3.2 3.2 0 0 1 8 3.3a3.2 3.2 0 0 1 6.6 1.3c0 3-3 5.3-6.6 8Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { Heart }

/**
 * One public suggestion as a postcard: its picture, the place, the area, the
 * public reason, where it is on its journey, and 行ってみたい. The whole card
 * opens the suggestion; the support action works in place.
 */
export function SuggestionPostcard({
  suggestion,
  supported,
  own,
  index = 0,
  priority = false,
}: {
  suggestion: PublicSuggestionRow
  supported: boolean
  own: boolean
  index?: number
  priority?: boolean
}) {
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const published = suggestion.status === 'published'
  const tilt = [-1.1, 0.8, -0.4, 1.2][index % 4]
  const href = `/community/suggestions/${suggestion.id}`

  return (
    <article className="relative">
      <Link to={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-graphite/30">
        <div className="relative">
          <CommunityPicture path={suggestion.cover_path} name={suggestion.name} note={suggestion.public_area ?? undefined} seed={index} tilt={tilt} ratio="4 / 3" priority={priority} />
          <Tape tone={['sun', 'mist', 'meadow', 'rose'][index % 4] as 'sun'} className="-top-2 left-7" style={{ transform: `rotate(${index % 2 ? 4 : -5}deg)` }} />
          {published && suggestion.published_at && (
            <Stamp top="NOW A LINKA PLACE" bottom={suggestion.published_at.slice(0, 10).replaceAll('-', '.')} tone="moss" size={74} className="absolute -bottom-5 -right-2" />
          )}
        </div>
        <div className="mt-4 px-1">
          <p className="text-[0.58rem] uppercase tracking-[0.22em] text-graphite-soft">
            {suggestion.public_area}
            {suggestion.opened_at && <span className="tabular-nums normal-case tracking-[0.06em] text-graphite-faint"> · {formatCalendarDate(suggestion.opened_at, locale)}</span>}
          </p>
          <h3 lang="ja" className="mt-1 text-[1.22rem] font-light leading-snug tracking-[0.08em] text-graphite">{suggestion.name}</h3>
          {suggestion.public_reason && <p className="mt-2 line-clamp-2 text-[0.8rem] font-light leading-relaxed text-graphite-soft">{suggestion.public_reason}</p>}
        </div>
      </Link>
      <div className="mt-3.5 px-1">
        <StageProgress status={suggestion.status} />
      </div>
      <div className="mt-3.5 px-1">
        <SupportAction suggestion={suggestion} supported={supported} own={own} size="sm" />
      </div>
      <span className="sr-only">{cc.community.stages[stageOf(suggestion.status)]}</span>
    </article>
  )
}

/** A small postcard for a row that scrolls sideways. */
export function SuggestionTile({ suggestion, index = 0 }: { suggestion: PublicSuggestionRow; index?: number }) {
  return (
    <Link to={`/community/suggestions/${suggestion.id}`} className="block w-40 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-graphite/30">
      <CommunityPicture path={suggestion.cover_path} name={suggestion.name} note={suggestion.public_area ?? undefined} seed={index + 1} tilt={[-1.5, 1.2, -0.6, 1.6][index % 4]} ratio="4 / 5" sizes="160px" />
      <p lang="ja" className="mt-2.5 truncate text-[0.86rem] tracking-[0.04em] text-graphite">{suggestion.name}</p>
      <p className="text-[0.62rem] tracking-[0.04em] text-graphite-soft">
        <span className="text-[#a4543a]"><Heart filled small /></span> <span className="tabular-nums">{suggestion.support_count}</span> · {suggestion.public_area}
      </p>
    </Link>
  )
}

/** Share a page: the system share sheet where there is one, else the link copied. */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const cc = useCommunityMessages()
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch {
      // Cancelled by the person: nothing to do.
    }
  }
  return (
    <button type="button" onClick={() => void share()} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.78rem] text-graphite ring-1 ring-graphite/20 outline-none focus-visible:ring-2 focus-visible:ring-graphite/40">
      <svg aria-hidden viewBox="0 0 14 14" className="size-3.5">
        <path d="M7 1.5v7.5M4 4.3 7 1.4l3 2.9M2.5 7.5v4.6h9V7.5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span aria-live="polite">{copied ? cc.act.copied : cc.act.share}</span>
    </button>
  )
}
