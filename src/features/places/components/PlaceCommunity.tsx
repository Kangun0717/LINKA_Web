import { Link } from 'react-router-dom'

import { Stamp } from '@/components/notebook/Notebook'
import { useCommunityList } from '@/data/community'
import { useMyMemories } from '@/data/journey'
import { useAuth } from '@/features/auth/useAuth'
import { CommunityPicture } from '@/features/community/components/CommunityCard'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * Below a place's own page: where it came from, if the community suggested
 * it (its frozen 行ってみたい count stays as part of its history), and — for
 * a signed-in reader — what their own journal holds of it: the verified
 * visit, and any journal entries (which never count as a visit).
 *
 * Loaded after the page itself, so it never delays a shared link.
 */
export default function PlaceCommunity({ placeId, slug, visitedOn }: { placeId: string; slug: string; visitedOn: string | null }) {
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const { user } = useAuth()
  const list = useCommunityList()
  const memories = useMyMemories(Boolean(user))
  const origin = (list.data ?? []).find((s) => s.status === 'published' && s.place_id === placeId) ?? null
  const past = (memories.data ?? []).filter((m) => m.kind === 'past' && m.place_id === placeId)

  if (!origin && !user) return null

  return (
    <div className="px-5 pt-2">
      {origin && (
        <section className="relative mt-8 rounded-sm bg-white/60 p-4 shadow-[0_1px_2px_rgba(51,48,43,0.08)]">
          <h2 className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.placeCommunity.title}</h2>
          <div className="mt-3 flex gap-4">
            <div className="w-24 shrink-0">
              <CommunityPicture path={origin.cover_path} name={origin.name} tilt={-2} ratio="1" sizes="96px" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.82rem] leading-snug text-graphite">{cc.placeCommunity.fromCommunity}</p>
              <p className="mt-1.5 text-[0.66rem] tabular-nums text-graphite-soft">♡ {cc.placeCommunity.history(origin.support_count)}</p>
              <Link to={`/community/suggestions/${origin.id}`} className="mt-2 inline-flex min-h-10 items-center text-[0.72rem] text-graphite underline decoration-graphite/25 underline-offset-4">
                {cc.placeCommunity.openStory} ›
              </Link>
            </div>
          </div>
          <Stamp top="FROM THE COMMUNITY" bottom="LINKA" tone="moss" size={58} className="absolute -right-2 -top-4" />
        </section>
      )}

      {user && (
        <section className="mt-8">
          <h2 className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.placeCommunity.yours}</h2>
          <ul className="mt-3 space-y-1.5 text-[0.8rem] text-graphite">
            {visitedOn && (
              <li>
                <span aria-hidden className="touchpoint-mark mr-1.5">:)))</span>
                {cc.placeCommunity.verifiedHere(formatCalendarDate(visitedOn, locale))}
              </li>
            )}
            {past.length > 0 && (
              <li>
                <span aria-hidden className="mr-1.5 inline-block h-2 w-3 rotate-[-6deg] bg-[rgba(240,214,140,0.75)] align-middle" />
                {cc.placeCommunity.pastHere(past.length)}
              </li>
            )}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {(visitedOn || past.length > 0) && (
              <Link to="/moments" className="inline-flex min-h-10 items-center rounded-full px-4 text-[0.74rem] text-graphite ring-1 ring-graphite/20">
                {cc.placeCommunity.openMoments}
              </Link>
            )}
            <Link to={`/moments/new?place=${encodeURIComponent(slug)}`} className="inline-flex min-h-10 items-center rounded-full px-4 text-[0.74rem] text-graphite ring-1 ring-graphite/20">
              ＋ {cc.placeCommunity.addPast}
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
