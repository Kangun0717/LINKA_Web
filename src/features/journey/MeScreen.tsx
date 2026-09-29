import { useMemo, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { GRAIN, Postcard, SketchCover, Stamp } from '@/components/notebook/Notebook'
import { useCommunityList, useMySupports } from '@/data/community'
import { signOut } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { CommunityPicture, StageProgress } from '@/features/community/components/CommunityCard'
import SignInGate from '@/features/journey/SignInGate'
import { useJourney } from '@/features/journey/useJourney'
import { PrivatePhoto } from '@/features/memories/PrivatePhoto'
import { usePhotoUrls } from '@/features/memories/usePhotoUrls'
import { COUNTRIES, flagOf } from '@/features/onboarding/data/nationalities'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { worldHref, worldPathOf } from '@/features/world/geo/regions'
import AppShell from '@/layouts/AppShell'
import { cn } from '@/lib/cn'
import { stageOf } from '@/lib/i18n/communityMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, LOCALE_NAMES, LOCALES } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * Me — a person's relationship with LINKA, not a settings screen:
 *
 *   I travelled here              places verified by a LINKA Touch
 *   I remembered this             journal entries of their own
 *   I suggested this              places they suggested (private ones too)
 *   I helped it become LINKA      suggestions they made or supported that became LINKA
 *
 * Every number is counted from their own data. Verified places come only
 * from visits; a journal entry is never counted as one. Settings come last,
 * quietly.
 */
export default function MeScreen() {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const navigate = useNavigate()
  const journey = useJourney()
  const { user, session } = useAuth()
  const { profile } = useProfileContext()
  const { locale, setLocale } = useLocale()
  const supports = useMySupports()
  const community = useCommunityList()

  const recent = useMemo(
    () => journey.moments.flatMap((m) => (m.memory ? [...m.memory.memory_photos].sort((a, b) => a.position - b.position) : [])).slice(0, 4),
    [journey.moments],
  )
  const thumbs = usePhotoUrls(recent)

  const publicById = useMemo(() => new Map((community.data ?? []).map((s) => [s.id, s])), [community.data])
  const mySuggestions = journey.suggestions
  const supported = (supports.data ?? []).flatMap((s) => {
    const row = publicById.get(s.suggestion_id)
    return row ? [row] : []
  })
  const became = [
    ...mySuggestions.filter((s) => s.status === 'published').map((s) => ({ id: s.id, name: s.name, area: s.public_area, at: s.published_at, cover: publicById.get(s.id)?.cover_path ?? null, count: s.support_count })),
    ...supported
      .filter((s) => s.status === 'published' && !mySuggestions.some((m) => m.id === s.id))
      .map((s) => ({ id: s.id, name: s.name, area: s.public_area, at: s.published_at, cover: s.cover_path, count: s.support_count })),
  ]

  const nationality = COUNTRIES.find((c) => c.code === profile?.nationality)
  const languages = (
    <div className="flex gap-2">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
          className={cn(
            'min-h-11 flex-1 rounded-full text-[0.78rem] outline-none focus-visible:ring-2 focus-visible:ring-graphite/40',
            option === locale ? 'bg-graphite text-paper-lit' : 'text-graphite ring-1 ring-graphite/15',
          )}
        >
          {LOCALE_NAMES[option]}
        </button>
      ))}
    </div>
  )

  return (
    <AppShell active="me">
      <div className="h-full overflow-y-auto overscroll-contain bg-paper-lit">
        <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: GRAIN }} />
        <div className="relative mx-auto max-w-md px-5 pb-36 pt-[max(2.25rem,env(safe-area-inset-top))]">
          <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{copy.me.title}</h1>
          {!session ? (
            <>
              <SignInGate />
              <div className="mx-auto mt-8 max-w-sm">
                <p className="mb-2 text-[0.62rem] uppercase tracking-[0.2em] text-graphite-soft">{copy.me.language}</p>
                {languages}
              </div>
              <Link to="/community" className="mx-auto mt-8 flex min-h-11 max-w-sm items-center justify-between rounded-xl px-3.5 text-[0.8rem] text-graphite ring-1 ring-graphite/15">
                {cc.mine.communityCta}
                <span aria-hidden className="text-graphite-soft">›</span>
              </Link>
            </>
          ) : (
            <>
              {journey.error !== null && !journey.ready && (
                <div role="alert" className="mt-6 flex items-center justify-between rounded-xl bg-white/70 px-3.5 py-3 ring-1 ring-graphite/10">
                  <p className="text-[0.78rem] text-graphite-soft">{copy.loadFailed}</p>
                  <button type="button" onClick={journey.reload} className="min-h-9 text-[0.76rem] text-graphite underline decoration-graphite/30 underline-offset-4">
                    {copy.retry}
                  </button>
                </div>
              )}
              <p className="mt-3 text-[1.55rem] font-extralight tracking-[0.06em] text-graphite">
                {profile?.display_name}
                {nationality && <span className="ml-2 text-[1.1rem]">{flagOf(nationality.code)}</span>}
              </p>

              {/* The passport page: verified set apart with its :))) mark. */}
              <dl className="mt-6 grid grid-cols-4 gap-2">
                {(
                  [
                    [copy.me.places, journey.stats.places, true],
                    [copy.me.regions, journey.stats.regions, false],
                    [copy.me.memories, journey.stats.memories, false],
                    [copy.me.photos, journey.stats.photos, false],
                  ] as const
                ).map(([label, value, verified]) => (
                  <div key={label} className={cn('rounded-xl px-2 py-3 text-center', verified ? 'bg-[#fbf3de] ring-1 ring-[#e8d49a]' : 'bg-white/70 ring-1 ring-graphite/[0.07]')}>
                    <dd className="text-[1.3rem] font-light tabular-nums text-graphite">{journey.ready ? value : '–'}</dd>
                    <dt className="mt-0.5 text-[0.56rem] leading-tight tracking-[0.06em] text-graphite-soft">
                      {verified && <span aria-hidden className="touchpoint-mark mr-0.5">:)))</span>}
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>

              <section className="mt-9" aria-label={cc.mine.title}>
                <ul className="divide-y divide-dashed divide-graphite/15 border-y border-dashed border-graphite/15">
                  <Relation to="/home" mark=":)))" title={cc.mine.travelled} line={cc.mine.travelledLine(journey.stats.places)} />
                  <Relation to="/moments" mark="▭" title={cc.mine.remembered} line={cc.mine.rememberedLine(journey.stats.pastMemories)} />
                  <Relation to="#my-suggestions" mark="✎" title={cc.mine.suggested} line={cc.mine.suggestedLine(mySuggestions.length)} />
                  <Relation to="#became" mark="✓" title={cc.mine.helped} line={cc.mine.helpedLine(became.length)} />
                </ul>
              </section>

              <Section title={copy.me.journey}>
                {journey.visited.length === 0 ? (
                  <p className="text-[0.76rem] text-graphite-faint">{copy.me.journeyEmpty}</p>
                ) : (
                  <ul className="space-y-3">
                    {journey.visited.map(({ region, places }) => (
                      <li key={region?.id ?? places[0].id}>
                        <button
                          type="button"
                          onClick={() => navigate(worldHref(worldPathOf(region ?? places[0])))}
                          className="w-full rounded-xl bg-white/70 px-3.5 py-3 text-left ring-1 ring-graphite/[0.07]"
                        >
                          {region && (
                            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-graphite-soft">
                              {region.name} · {region.nameLatin}
                            </p>
                          )}
                          <p lang="ja" className="mt-1 text-[0.86rem] tracking-[0.04em] text-graphite">
                            {places.map((p) => p.name).join('、')}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title={copy.me.myMemories}>
                {recent.length > 0 && (
                  <div className="mb-3 grid grid-cols-4 gap-1.5">
                    {recent.map((photo) => (
                      <PrivatePhoto key={photo.id} photo={photo} urls={thumbs} className="aspect-square w-full rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                <LinkRow to="/moments">{copy.me.seeMoments}</LinkRow>
              </Section>

              <div className="mt-12 flex items-center gap-3">
                <span aria-hidden className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#a79f94_0_3px,transparent_3px_6px)]" />
                <h2 className="text-[1.05rem] font-light tracking-[0.12em] text-graphite">{cc.mine.title}</h2>
                <span aria-hidden className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#a79f94_0_3px,transparent_3px_6px)]" />
              </div>
              <p className="mt-2 text-center text-[0.7rem] font-light text-graphite-soft">{cc.mine.lead}</p>

              <Section id="my-suggestions" title={cc.mine.mySuggestions}>
                {mySuggestions.length === 0 ? (
                  <p className="mb-3 text-[0.76rem] text-graphite-faint">{cc.mine.noSuggestions}</p>
                ) : (
                  <ul className="mb-3 space-y-2.5">
                    {mySuggestions.map((s) => {
                      const hidden = s.status === 'submitted' || s.status === 'declined' || s.status === 'duplicate' || s.status === 'withdrawn'
                      return (
                        <li key={s.id}>
                          <Link to={`/community/suggestions/${s.id}`} className="block rounded-xl bg-white/75 px-4 py-3.5 ring-1 ring-graphite/[0.07]">
                            <div className="flex items-start justify-between gap-3">
                              <p lang="ja" className="text-[0.92rem] tracking-[0.04em] text-graphite">{s.name}</p>
                              {hidden ? (
                                <span className="shrink-0 rounded-full bg-graphite/[0.06] px-2 py-0.5 text-[0.56rem] tracking-[0.06em] text-graphite-soft">
                                  {s.status === 'submitted' ? cc.mine.privateChip : copy.suggest.status[s.status as 'declined']}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[0.66rem] tabular-nums text-graphite-soft">♡ {s.support_count}</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[0.62rem] tabular-nums text-graphite-faint">
                              {s.public_area ?? s.address} · {formatCalendarDate(s.created_at, locale)}
                            </p>
                            {(s.status === 'submitted' || !hidden) && <StageProgress status={s.status} className="mt-3" />}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <Link to="/community/suggest" className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-graphite text-[0.8rem] tracking-[0.04em] text-paper-lit">
                  ＋ {cc.mine.suggestCta}
                </Link>
              </Section>

              <Section title={cc.mine.supported}>
                {supported.filter((s) => s.status !== 'published').length === 0 ? (
                  <p className="mb-3 text-[0.76rem] text-graphite-faint">{cc.mine.noSupports}</p>
                ) : (
                  <ul className="-mx-5 mb-3 flex gap-4 overflow-x-auto px-5 pb-2 pt-1">
                    {supported
                      .filter((s) => s.status !== 'published')
                      .map((s, i) => (
                        <li key={s.id} className="w-36 shrink-0">
                          <Link to={`/community/suggestions/${s.id}`} className="block">
                            <CommunityPicture path={s.cover_path} name={s.name} seed={i + 2} tilt={[-1.2, 1, -0.5][i % 3]} ratio="4 / 5" sizes="144px" />
                            <p lang="ja" className="mt-2 truncate text-[0.82rem] tracking-[0.04em] text-graphite">{s.name}</p>
                            <p className="text-[0.6rem] text-graphite-soft">{cc.stageShort[stageOf(s.status)]}</p>
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
                <LinkRow to="/community">{cc.mine.communityCta}</LinkRow>
              </Section>

              <Section id="became" title={cc.mine.became}>
                {became.length === 0 ? (
                  <p className="text-[0.76rem] text-graphite-faint">{cc.mine.noBecame}</p>
                ) : (
                  <ul className="space-y-10 pt-2">
                    {became.map((s) => (
                      <li key={s.id} className="relative">
                        <Link to={`/community/suggestions/${s.id}`} className="block">
                          {s.cover ? (
                            <CommunityPicture path={s.cover} name={s.name} tilt={-1} ratio="16 / 9" />
                          ) : (
                            <Postcard src={null} alt="" tilt={-1} ratio="16 / 9" caption={`${s.name} · ${s.area ?? ''}`}>
                              <SketchCover title={s.name} />
                            </Postcard>
                          )}
                          <Stamp top="THANK YOU" bottom={s.at ? s.at.slice(0, 10).replaceAll('-', '.') : 'LINKA'} tone="moss" size={72} className="absolute -right-1 -top-4" />
                          <p lang="ja" className="mt-3 text-[0.92rem] tracking-[0.06em] text-graphite">{s.name}</p>
                          <p className="text-[0.64rem] text-graphite-soft">{cc.act.frozen(s.count)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <section className="mt-14 border-t border-graphite/10 pt-6">
                <h2 className="mb-4 text-[0.6rem] uppercase tracking-[0.22em] text-graphite-faint">{cc.mine.settings}</h2>
                <p className="mb-2 text-[0.6rem] uppercase tracking-[0.2em] text-graphite-soft">{copy.me.language}</p>
                {languages}
                <p className="mb-1 mt-5 text-[0.6rem] uppercase tracking-[0.2em] text-graphite-soft">{copy.me.profile}</p>
                <p className="text-[0.78rem] text-graphite-soft">{user?.email ?? user?.phone}</p>
                <button
                  type="button"
                  onClick={() => void signOut().then(() => navigate('/', { replace: true }))}
                  className="mt-6 min-h-11 w-full rounded-full text-[0.78rem] text-graphite-soft ring-1 ring-graphite/15"
                >
                  {copy.me.signOut}
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Relation({ to, mark, title, line }: { to: string; mark: string; title: string; line: string }) {
  const content = (
    <>
      <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[0.7rem] text-graphite ring-1 ring-graphite/10', mark === ':)))' && 'touchpoint-mark text-[0.62rem]')}>
        {mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.86rem] italic tracking-[0.02em] text-graphite">“{title}.”</span>
        <span className="block text-[0.64rem] tabular-nums text-graphite-soft">{line}</span>
      </span>
      <span aria-hidden className="text-graphite-faint">›</span>
    </>
  )
  const className = 'flex min-h-14 items-center gap-3 py-2 outline-none focus-visible:ring-1 focus-visible:ring-graphite/30'
  return <li>{to.startsWith('#') ? <a href={to} className={className}>{content}</a> : <Link to={to} className={className}>{content}</Link>}</li>
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-10 scroll-mt-6">
      <h2 className="mb-3.5 text-[0.62rem] uppercase tracking-[0.22em] text-graphite-soft">{title}</h2>
      {children}
    </section>
  )
}

function LinkRow({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link to={to} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3.5 text-[0.8rem] text-graphite ring-1 ring-graphite/15">
      {children}
      <span aria-hidden className="text-graphite-soft">›</span>
    </Link>
  )
}
