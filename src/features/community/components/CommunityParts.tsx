import type { SuggestionStatus, TimelineEvent } from '@/features/community/model'
import { cn } from '@/lib/cn'
import { STAGES, stageOf, type Stage } from '@/lib/i18n/communityMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, HTML_LANG } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * 行ってみたい — "I would like to go". Interest, not a vote: one per account,
 * removable, and only the total is ever public. A guest sees the count and
 * a way to sign in, never a disabled button that says nothing.
 */
export function SupportButton({
  count,
  supported,
  signedIn,
  onToggle,
  size = 'md',
}: {
  count: number
  supported: boolean
  signedIn: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
}) {
  const cc = useCommunityMessages()
  return (
    <button
      type="button"
      aria-pressed={signedIn ? supported : undefined}
      onClick={onToggle}
      title={signedIn ? cc.community.supportExplain : cc.community.signInToSupport}
      className={cn(
        'inline-flex items-center gap-2 rounded-full outline-none transition-colors duration-300 ease-calm focus-visible:ring-2 focus-visible:ring-graphite/30',
        size === 'md' ? 'min-h-11 px-4 text-[0.82rem]' : 'min-h-9 px-3 text-[0.72rem]',
        supported ? 'bg-[#a4543a]/[0.09] text-[#8a4330] ring-1 ring-[#a4543a]/30' : 'bg-white/70 text-graphite ring-1 ring-graphite/15',
      )}
    >
      <svg aria-hidden viewBox="0 0 16 14" className={size === 'md' ? 'h-3.5 w-4' : 'h-3 w-3.5'}>
        <path
          d="M8 12.6C4.4 9.9 1.4 7.6 1.4 4.6A3.2 3.2 0 0 1 8 3.3a3.2 3.2 0 0 1 6.6 1.3c0 3-3 5.3-6.6 8Z"
          fill={supported ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="tracking-[0.06em]">{supported ? cc.community.supported : cc.community.support}</span>
      <span className="tabular-nums text-graphite-soft">{count}</span>
    </button>
  )
}

/**
 * The six stages as a pencil line with stops: passed stops inked, the
 * current one ringed, the rest still pencil. The reader's language, with the
 * other script small beneath the current stage.
 */
export function StageTrail({ status, compact = false }: { status: SuggestionStatus; compact?: boolean }) {
  const cc = useCommunityMessages()
  const current = STAGES.indexOf(stageOf(status))
  return (
    <div>
      <div className="relative flex items-center justify-between px-1">
        <div aria-hidden className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#a79f94_0_3px,transparent_3px_6px)]" />
        <div aria-hidden className="absolute left-2 top-1/2 h-px -translate-y-1/2 bg-graphite/70" style={{ width: `calc(${(current / (STAGES.length - 1)) * 100}% - 1rem)` }} />
        {STAGES.map((stage, i) => (
          <span
            key={stage}
            aria-hidden
            className={cn(
              'relative z-10 block rounded-full',
              i < current && 'size-2 bg-graphite/80',
              i === current && 'size-3.5 bg-paper-lit ring-[1.5px] ring-[#a4543a] ring-offset-2 ring-offset-paper-lit',
              i > current && 'size-2 bg-paper-lit ring-1 ring-graphite/35',
            )}
          />
        ))}
      </div>
      {!compact && (
        <p className="mt-2.5 text-[0.78rem] tracking-[0.06em] text-graphite">
          <span className="text-graphite-soft">{cc.community.stageNow} · </span>
          {cc.community.stages[STAGES[current]]}
        </p>
      )}
      <span className="sr-only">{cc.community.stages[STAGES[current]]}</span>
    </div>
  )
}

/** A stage chip for lists: the stage in the reader's language. */
export function StageChip({ status }: { status: SuggestionStatus }) {
  const cc = useCommunityMessages()
  const stage = stageOf(status)
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-[0.58rem] tracking-[0.08em]',
        stage === 'published' ? 'bg-[#5f7a55]/[0.12] text-[#4c6444]' : 'bg-graphite/[0.06] text-graphite-soft',
      )}
    >
      {cc.community.stages[stage]}
    </span>
  )
}

/**
 * The journey as a notebook timeline: the month in the margin, a pencil line,
 * one entry per public event. Only LINKA's public notes — there is no other
 * text in the public model to show.
 */
export function SuggestionTimeline({ events }: { events: readonly TimelineEvent[] }) {
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const month = (iso: string) => formatCalendarDate(iso, locale).replace(/^\d{1,2} /, '').replace(/\d{1,2}日$/, '')
  return (
    <ol className="relative">
      <span aria-hidden className="absolute bottom-3 left-[4.35rem] top-3 w-px bg-[repeating-linear-gradient(180deg,#a79f94_0_4px,transparent_4px_7px)]" />
      {events.map((event, i) => {
        const note = event.note?.[locale] ?? event.note?.en ?? event.note?.ja
        const stage: Stage | null = event.kind === 'status' && event.status && event.status !== 'submitted' ? stageOf(event.status) : null
        const title =
          event.kind === 'milestone'
            ? cc.community.touchPointInstalled
            : stage
              ? cc.community.stages[stage]
              : event.status === 'submitted'
                ? cc.community.stages.suggested
                : null
        const last = i === events.length - 1
        return (
          <li key={`${event.at}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
            <span className="w-14 shrink-0 pt-0.5 text-right text-[0.6rem] tabular-nums tracking-[0.06em] text-graphite-soft">{month(event.at)}</span>
            <span
              aria-hidden
              className={cn(
                'relative z-10 mt-1 block size-2.5 shrink-0 rounded-full',
                event.kind === 'milestone' ? 'bg-[#5f7a55]' : last ? 'bg-paper-lit ring-[1.5px] ring-[#a4543a]' : 'bg-graphite/70',
              )}
            />
            <div className="min-w-0">
              {title && <p className="text-[0.8rem] tracking-[0.04em] text-graphite">{title}{event.kind === 'milestone' && ' ✓'}</p>}
              {note && (
                <p lang={HTML_LANG[event.note?.[locale] ? locale : event.note?.en ? 'en' : 'ja']} className="mt-0.5 text-[0.72rem] font-light leading-relaxed text-graphite-soft">
                  {note}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
