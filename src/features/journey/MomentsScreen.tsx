import { Link } from 'react-router-dom'

import { GRAIN } from '@/components/notebook/Notebook'
import LoadFailed from '@/components/ui/LoadFailed'
import { useAuth } from '@/features/auth/useAuth'
import DiaryPage from '@/features/journal/components/DiaryPage'
import SignInGate from '@/features/journey/SignInGate'
import { useJourney } from '@/features/journey/useJourney'
import { usePhotoUrls } from '@/features/memories/usePhotoUrls'
import { entryDate } from '@/data/journey'
import AppShell from '@/layouts/AppShell'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * Moments — the travel journal. Newest first, a page per visit or memory,
 * gathered under the year like a notebook's dividers. Two kinds, told apart
 * by their mark and never by their care: a LINKA Touch carries the :)))
 * stamp; a journal entry is taped in. No counts, no one else.
 *
 * Only the photographs on screen are fetched, as small thumbnails; the full
 * photo is signed when a page is opened.
 */
export default function MomentsScreen() {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const journey = useJourney()
  const { session } = useAuth()

  // The two photos each page shows (the cover and the one behind it).
  const shown = journey.moments.flatMap((entry) => {
    const memory = entry.memory
    if (!memory) return []
    const photos = [...memory.memory_photos].sort((a, b) => (a.id === memory.cover_photo_id ? -1 : b.id === memory.cover_photo_id ? 1 : a.position - b.position))
    return photos.slice(0, 2)
  })
  const urls = usePhotoUrls(shown)

  const years: { year: string; entries: typeof journey.moments }[] = []
  for (const entry of journey.moments) {
    const year = entryDate(entry)?.slice(0, 4) ?? '—'
    const last = years.at(-1)
    if (last?.year === year) last.entries = [...last.entries, entry]
    else years.push({ year, entries: [entry] })
  }

  return (
    <AppShell active="moments">
      <div className="h-full overflow-y-auto overscroll-contain bg-paper-lit">
        <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: GRAIN }} />
        <div className="relative mx-auto max-w-md px-5 pb-36 pt-[max(2.25rem,env(safe-area-inset-top))]">
          <header className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{copy.moments.title}</h1>
              <p className="mt-1.5 text-[1.5rem] font-extralight tracking-[0.12em] text-graphite">{cc.diary.subtitle}</p>
            </div>
            {session && (
              <Link
                to="/moments/new"
                aria-label={cc.diary.add}
                className="flex min-h-11 items-center gap-1.5 rounded-full bg-graphite px-4 text-[0.78rem] tracking-[0.04em] text-paper-lit shadow-[0_8px_18px_-10px_rgba(51,48,43,0.7)] outline-none focus-visible:ring-2 focus-visible:ring-graphite/40"
              >
                <span aria-hidden className="text-[1rem] leading-none">＋</span>
                {cc.diary.add}
              </Link>
            )}
          </header>

          {!session && <SignInGate />}

          {session && journey.error !== null && !journey.ready && <LoadFailed onRetry={journey.reload} />}

          {session && !journey.ready && journey.error === null && (
            <div className="mt-10 h-64 animate-pulse rounded-sm bg-graphite/[0.04] motion-reduce:animate-none" />
          )}

          {session && journey.ready && journey.moments.length > 0 && (
            <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[0.6rem] tracking-[0.06em] text-graphite-soft">
              <span><span aria-hidden className="touchpoint-mark mr-1 text-graphite">:)))</span>{cc.diary.verifiedBadge}</span>
              <span><span aria-hidden className="mr-1.5 inline-block h-2 w-3 rotate-[-6deg] bg-[rgba(240,214,140,0.7)] align-middle" />{cc.diary.pastBadge}</span>
            </p>
          )}

          {session && journey.ready && journey.moments.length === 0 && (
            <div className="mt-20 text-center">
              <p className="text-[0.92rem] font-light leading-relaxed text-graphite">{cc.diary.empty}</p>
              <p className="mt-3 text-[0.78rem] font-light leading-relaxed text-graphite-soft">
                {cc.diary.emptyTouch}
                <br />
                {cc.diary.emptyAdd}
              </p>
              <div className="mt-7 flex flex-col items-center gap-2">
                <Link to="/moments/new" className="flex min-h-11 items-center rounded-full bg-graphite px-5 text-[0.8rem] text-paper-lit">
                  ＋ {cc.diary.add}
                </Link>
                <Link to="/home" className="min-h-11 text-[0.78rem] leading-[2.75rem] text-graphite underline decoration-graphite/30 underline-offset-4">
                  {copy.moments.emptyAction}
                </Link>
              </div>
            </div>
          )}

          {years.map(({ year, entries }) => (
            <section key={year} className="mt-10">
              <p className="mb-7 flex items-center gap-3 text-[0.7rem] tabular-nums tracking-[0.34em] text-graphite-soft">
                {year}
                <span aria-hidden className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#a79f94_0_3px,transparent_3px_6px)]" />
              </p>
              <ol className="space-y-14">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <DiaryPage entry={entry} urls={urls} index={journey.moments.indexOf(entry)} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
