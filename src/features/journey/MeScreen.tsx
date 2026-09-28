import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { signOut } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { signedPhotoUrls } from '@/features/memories/api'
import SignInGate from '@/features/journey/SignInGate'
import { useJourney } from '@/features/journey/useJourney'
import { COUNTRIES, flagOf } from '@/features/onboarding/data/nationalities'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { normalizeStatus } from '@/features/suggest/api'
import AppShell from '@/layouts/AppShell'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, LOCALE_NAMES, LOCALES } from '@/lib/i18n/locale'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * Me — a person's LINKA travel identity, not a settings screen.
 *
 * What they have lived (places, regions, memories, photos — all counted from
 * their own data), where their journey has been, what they have kept, what
 * they have suggested, and only then the account itself.
 */
export default function MeScreen() {
  const copy = useMessages()
  const navigate = useNavigate()
  const journey = useJourney()
  const { user, session } = useAuth()
  const { profile } = useProfileContext()
  const { locale, setLocale } = useLocale()
  const [thumbs, setThumbs] = useState<string[]>([])

  const recentPhotos = journey.moments
    .flatMap((m) => m.memory?.memory_photos ?? [])
    .slice(0, 4)
    .map((p) => p.storage_path)
    .join('|')
  useEffect(() => {
    if (!recentPhotos) return
    let active = true
    const paths = recentPhotos.split('|')
    signedPhotoUrls(paths).then((urls) => active && setThumbs(paths.flatMap((p) => (urls[p] ? [urls[p]] : []))), () => {})
    return () => {
      active = false
    }
  }, [recentPhotos])

  const nationality = COUNTRIES.find((c) => c.code === profile?.nationality)

  return (
    <AppShell active="me">
      <div className="h-full overflow-y-auto bg-paper-lit px-5 pb-32 pt-[max(2.25rem,env(safe-area-inset-top))]">
        <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{copy.me.title}</h1>
        {!session ? (
          <>
            <SignInGate />
            <div className="mx-auto mt-8 max-w-sm">
              <p className="mb-2 text-[0.62rem] uppercase tracking-[0.2em] text-graphite-soft">{copy.me.language}</p>
              <div className="flex gap-2">
                {LOCALES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    lang={option}
                    aria-pressed={option === locale}
                    onClick={() => setLocale(option)}
                    className={cn(
                      'min-h-11 flex-1 rounded-full text-[0.78rem]',
                      option === locale ? 'bg-graphite text-paper-lit' : 'text-graphite ring-1 ring-graphite/15',
                    )}
                  >
                    {LOCALE_NAMES[option]}
                  </button>
                ))}
              </div>
            </div>
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
        <p className="mt-3 text-[1.4rem] font-light tracking-[0.04em] text-graphite">
          {profile?.display_name}
          {nationality && <span className="ml-2 text-[1.1rem]">{flagOf(nationality.code)}</span>}
        </p>

        <dl className="mt-6 grid grid-cols-4 gap-2">
          {(
            [
              [copy.me.places, journey.stats.places],
              [copy.me.regions, journey.stats.regions],
              [copy.me.memories, journey.stats.memories],
              [copy.me.photos, journey.stats.photos],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/70 px-2 py-3 text-center ring-1 ring-graphite/[0.07]">
              <dd className="text-[1.3rem] font-light tabular-nums text-graphite">{journey.ready ? value : '–'}</dd>
              <dt className="mt-0.5 text-[0.56rem] leading-tight tracking-[0.06em] text-graphite-soft">{label}</dt>
            </div>
          ))}
        </dl>

        <Section title={copy.me.journey}>
          {journey.visited.length === 0 ? (
            <p className="text-[0.76rem] text-graphite-faint">{copy.me.journeyEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {journey.visited.map(({ region, places }) => (
                <li key={region?.id ?? places[0].id}>
                  <button
                    type="button"
                    onClick={() => navigate('/home?at=jp/sado')}
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
          {thumbs.length > 0 && (
            <div className="mb-3 grid grid-cols-4 gap-1.5">
              {thumbs.map((src) => (
                <img key={src} src={src} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          )}
          <LinkRow onClick={() => navigate('/moments')}>{copy.me.seeMoments}</LinkRow>
        </Section>

        <Section title={copy.me.suggestions}>
          {journey.suggestions.length === 0 ? (
            <p className="mb-3 text-[0.76rem] text-graphite-faint">{copy.me.suggestionsEmpty}</p>
          ) : (
            <ul className="mb-3 space-y-2">
              {journey.suggestions.map((s) => (
                <li key={s.id} className="rounded-xl bg-white/70 px-3.5 py-2.5 ring-1 ring-graphite/[0.07]">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[0.84rem] text-graphite">{s.name}</p>
                    <span className="shrink-0 rounded-full bg-graphite/[0.06] px-2 py-0.5 text-[0.58rem] tracking-[0.06em] text-graphite-soft">
                      {copy.suggest.status[normalizeStatus(s.status)]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.62rem] text-graphite-faint tabular-nums">
                    {s.address} · {formatCalendarDate(s.created_at, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <LinkRow onClick={() => navigate('/me/suggest')}>{copy.me.suggest}</LinkRow>
        </Section>

        <Section title={copy.me.account}>
          <p className="mb-2 text-[0.62rem] uppercase tracking-[0.2em] text-graphite-soft">{copy.me.language}</p>
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

          <p className="mb-1 mt-5 text-[0.62rem] uppercase tracking-[0.2em] text-graphite-soft">{copy.me.profile}</p>
          <p className="text-[0.8rem] text-graphite">{user?.email ?? user?.phone}</p>

          <button
            type="button"
            onClick={() => void signOut().then(() => navigate('/', { replace: true }))}
            className="mt-6 min-h-11 w-full rounded-full text-[0.8rem] text-graphite-soft ring-1 ring-graphite/15"
          >
            {copy.me.signOut}
          </button>
        </Section>
        </>
        )}
      </div>
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="mb-3 text-[0.62rem] uppercase tracking-[0.22em] text-graphite-soft">{title}</h2>
      {children}
    </section>
  )
}

function LinkRow({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-between rounded-xl px-3.5 text-[0.8rem] text-graphite ring-1 ring-graphite/15"
    >
      {children}
      <span aria-hidden className="text-graphite-soft">›</span>
    </button>
  )
}
