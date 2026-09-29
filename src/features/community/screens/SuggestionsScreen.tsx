import { Link, useSearchParams } from 'react-router-dom'

import LoadFailed from '@/components/ui/LoadFailed'
import { useCommunityList, useMySupports, useMySuggestionIds } from '@/data/community'
import { SuggestionPostcard } from '@/features/community/components/CommunityCard'
import CommunityFrame from '@/features/community/components/CommunityFrame'
import { cn } from '@/lib/cn'
import { STAGES, stageOf, type Stage } from '@/lib/i18n/communityMessages'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * /community/suggestions — every public suggestion, newest first, filtered by
 * where it is on its journey (?stage=review). The filter lives in the URL, so
 * a refresh or Back keeps it. There is no sort by support: interest is shown,
 * never ranked.
 */
export default function SuggestionsScreen() {
  const cc = useCommunityMessages()
  const [params] = useSearchParams()
  const raw = params.get('stage')
  const stage = (STAGES as readonly string[]).includes(raw ?? '') ? (raw as Stage) : null
  const list = useCommunityList()
  const supports = useMySupports()
  const mine = useMySuggestionIds()
  const shown = (list.data ?? []).filter((s) => !stage || stageOf(s.status) === stage)

  return (
    <CommunityFrame back="/community" backLabel={cc.hub.back} wide>
      <header className="px-5 pt-2 sm:px-8">
        <h1 className="text-[1.6rem] font-extralight tracking-[0.1em] text-graphite">{cc.hub.allTitle}</h1>
        {/* Suggested (submitted) is private, so the public list starts at community support. */}
        <nav aria-label={cc.detail.progress} className="-mx-5 mt-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8">
          <ul className="flex gap-2 pb-1">
            {[null, ...STAGES.filter((s) => s !== 'suggested')].map((option) => {
              const active = option === stage
              return (
                <li key={option ?? 'all'}>
                  <Link
                    to={option ? `/community/suggestions?stage=${option}` : '/community/suggestions'}
                    replace
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-10 items-center whitespace-nowrap rounded-full px-3.5 text-[0.74rem] tracking-[0.04em] outline-none focus-visible:ring-2 focus-visible:ring-graphite/30',
                      active ? 'bg-graphite text-paper-lit' : 'bg-white/70 text-graphite ring-1 ring-graphite/15',
                    )}
                  >
                    {option ? cc.stageShort[option] : cc.hub.filterAll}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      {list.error !== null && list.data === undefined && (
        <div className="px-5 pt-8">
          <LoadFailed onRetry={list.reload} />
        </div>
      )}
      {list.data === undefined && list.error === null && <div className="mx-5 mt-10 h-72 animate-pulse rounded-sm bg-graphite/[0.04] motion-reduce:animate-none" />}
      {list.data !== undefined && shown.length === 0 && (
        <p className="mx-5 mt-12 text-center text-[0.8rem] font-light text-graphite-soft">{list.data.length === 0 ? cc.hub.empty : cc.hub.emptyFilter}</p>
      )}

      <ol className="mt-9 grid gap-14 px-5 sm:grid-cols-2 sm:gap-10 sm:px-8">
        {shown.map((s, i) => (
          <li key={s.id}>
            <SuggestionPostcard suggestion={s} supported={supports.ids.has(s.id)} own={mine.has(s.id)} index={i} priority={i === 0} />
          </li>
        ))}
      </ol>
    </CommunityFrame>
  )
}
