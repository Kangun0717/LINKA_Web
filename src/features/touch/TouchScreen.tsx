import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { hasPassword } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import type { HomeArrivalState } from '@/features/home/screens/HomeScreen'
import MemoryComposer from '@/features/memories/MemoryComposer'
import { isProfileComplete } from '@/features/onboarding/api'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import {
  fetchMyTouches,
  fetchPlaces,
  recordTouch,
  resolveTouchPoint,
  type PlaceRecord,
  type RecordedTouch,
  type ResolvedTouchPoint,
  type TouchRow,
} from '@/features/places/api'
import PlaceSheet, { type SheetProgress } from '@/features/places/components/PlaceSheet'
import { localizePlace, type LocalizedPlace } from '@/features/places/localize'
import { usePlaceExtras } from '@/features/places/usePlaceExtras'
import { pendingTouch } from '@/features/touch/pendingTouch'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Locale } from '@/lib/i18n/locale'
import { useMessages } from '@/lib/i18n/useMessages'
import { nextStepFor } from '@/routes/nextStep'

type Resolution =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'found'; point: ResolvedTouchPoint; places: PlaceRecord[] }
  | { status: 'error' }

/** A settled resolution, tagged with the Touch Point and viewer it was made for. */
type Resolved = { key: string; result: Resolution }

type CheckIn =
  | { status: 'idle' }
  | { status: 'recording' }
  | { status: 'done'; touch: RecordedTouch }
  | { status: 'failed' }

/**
 * /t/:publicTouchPointId — where a physical NFC tag opens LINKA.
 *
 * Place first. The page opens straight onto the place that was touched — its
 * photograph, its name, a short introduction — with no animation standing in
 * front of it. Then two honest paths:
 *
 *   Start my journey: create an account or log in; this Touch Point is
 *     remembered across the detour, and the visit is checked in on return.
 *   Just explore: read everything about the place and its official safety
 *     information. Nothing is recorded — no Touch, no memory, no colour on a
 *     map, no visitor counted.
 *
 * Signed in, the Touch is recorded straight away through record_touch, which
 * decides who, where and when on the server. The tag only carries a URL;
 * nothing here claims to verify the hardware.
 */
export default function TouchScreen() {
  const { publicId = '' } = useParams()
  const navigate = useNavigate()
  const { session, user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfileContext()
  const { locale } = useLocale()
  const copy = useMessages()

  const [resolved, setResolved] = useState<Resolved | null>(null)
  const [checkIn, setCheckIn] = useState<CheckIn>({ status: 'idle' })
  const [exploring, setExploring] = useState(false)
  const [touches, setTouches] = useState<TouchRow[] | null>(null)

  const userId = user?.id ?? null
  const resolutionKey = `${publicId}|${userId ?? ''}`
  const resolution: Resolution =
    resolved && resolved.key === resolutionKey ? resolved.result : { status: 'loading' }
  const isAccountReady = Boolean(user && hasPassword(user) && isProfileComplete(profile))

  // Resolve once the session is known: what a point shows can depend on who
  // is looking (an admin-only test point resolves only for an admin).
  useEffect(() => {
    if (authLoading) return
    let active = true
    const key = `${publicId}|${userId ?? ''}`
    Promise.all([resolveTouchPoint(publicId), fetchPlaces()])
      .then(([point, places]) => {
        if (!active) return
        const found = point && places.some((p) => p.id === point.place_id)
        setResolved({ key, result: point && found ? { status: 'found', point, places } : { status: 'unavailable' } })
      })
      .catch(() => {
        if (active) setResolved({ key, result: { status: 'error' } })
      })
    return () => {
      active = false
    }
  }, [publicId, userId, authLoading])

  // The user's own touches, for "visited" and the region's progress.
  useEffect(() => {
    if (!isAccountReady) return
    let active = true
    fetchMyTouches().then((rows) => active && setTouches(rows), () => {})
    return () => {
      active = false
    }
  }, [isAccountReady, checkIn.status])

  // Record the Touch exactly once per Touch Point and account.
  const recordedFor = useRef<string | null>(null)
  const record = useCallback(() => {
    setCheckIn({ status: 'recording' })
    recordTouch(publicId).then(
      (touch) => {
        pendingTouch.clear()
        setCheckIn({ status: 'done', touch })
      },
      () => setCheckIn({ status: 'failed' }),
    )
  }, [publicId])

  const isFound = resolution.status === 'found'
  useEffect(() => {
    if (!isFound || !isAccountReady || !userId) return
    const key = `${userId}:${publicId}`
    if (recordedFor.current === key) return
    recordedFor.current = key
    record()
  }, [isFound, isAccountReady, userId, publicId, record])

  const view = useMemo(() => {
    const result = resolved && resolved.key === resolutionKey ? resolved.result : null
    if (result?.status !== 'found') return null
    const all = result.places.map((p) => localizePlace(p, locale))
    const place = all.find((p) => p.id === result.point.place_id)!
    return { place, region: all.find((p) => p.id === place.parentId) ?? null, all }
  }, [resolved, resolutionKey, locale])

  const extras = usePlaceExtras(view?.place.id ?? null, view?.region?.id ?? null)

  // Signed in but the account is not finished (password, nickname): finish it,
  // then come straight back here.
  if (session && user && !profileLoading && !isAccountReady) {
    // Written during render on purpose: nextStepFor reads it on the next line.
    // It is an idempotent sessionStorage write.
    pendingTouch.write(publicId)
    return <Navigate to={nextStepFor(user, profile)} replace />
  }

  const go = (to: '/auth/signup' | '/auth/signin') => {
    pendingTouch.write(publicId)
    navigate(to)
  }

  const busy = authLoading || resolution.status === 'loading' || (session && profileLoading)

  if (busy || !view) {
    const unavailable = !busy && (resolution.status === 'unavailable' || resolution.status === 'error')
    return (
      <Shell>
        <Detected />
        {unavailable ? (
          <div className="px-5 pt-10">
            <h1 className="text-[1.4rem] font-light leading-snug tracking-[0.04em] text-graphite">
              {session ? copy.touch.unavailableTitle : copy.touch.signInTitle}
            </h1>
            <p className="mt-3 text-[0.84rem] font-light leading-relaxed text-graphite-soft">
              {resolution.status === 'error' ? copy.touch.failed : session ? copy.touch.unavailableBody : copy.touch.signInBody}
            </p>
            <div className="mt-8 space-y-3">
              {session ? (
                <PaperButton onClick={() => navigate('/home', { replace: true })}>{copy.touch.seeWorld}</PaperButton>
              ) : (
                <>
                  <PaperButton onClick={() => go('/auth/signup')}>{copy.landing.startAction}</PaperButton>
                  <PaperButton quiet onClick={() => navigate('/home?at=jp/sado')}>
                    {copy.landing.exploreMap}
                  </PaperButton>
                  <LogInLink onClick={() => go('/auth/signin')} />
                </>
              )}
            </div>
          </div>
        ) : (
          <Skeleton label={copy.touch.opening} />
        )}
      </Shell>
    )
  }

  const touch = checkIn.status === 'done' ? checkIn.touch : null
  const visitedOn =
    touch?.local_date ??
    touches?.find((t) => t.place_id === view.place.id)?.local_date ??
    null
  const progress = progressFor(view, touches, touch, locale)
  const signedIn = Boolean(session)

  return (
    <Shell>
      <PlaceSheet
        place={view.place}
        visitedOn={visitedOn}
        extras={extras}
        progress={signedIn ? progress : null}
        heroPriority
        compact={!signedIn && !exploring}
        scope={{
          placeId: view.place.id,
          regionId: view.region?.id ?? null,
          regionName: view.region ? (locale === 'ja' || locale === 'zh-Hans' ? view.region.name : view.region.nameLatin) : null,
        }}
        others={view.all.filter((p) => p.discoverable && p.id !== view.place.id && p.parentId === view.place.parentId)}
        onOpenOther={(id) => navigate(`/home?at=jp/sado&place=${encodeURIComponent(id)}`)}
      >
        <Detected inline />

        {signedIn ? (
          <CheckInStatus checkIn={checkIn} onRetry={record} />
        ) : exploring ? (
          <p className="mt-4 rounded-xl bg-graphite/[0.05] px-3.5 py-2.5 text-[0.7rem] leading-snug text-graphite-soft">
            {copy.landing.infoOnly}
          </p>
        ) : null}
      </PlaceSheet>

      <div className="space-y-4 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
        {!signedIn && (
          <>
            <Choice
              title={copy.landing.startTitle}
              body={copy.landing.startBody}
              action={copy.landing.startAction}
              primary
              benefits={copy.landing.benefits}
              onClick={() => go('/auth/signup')}
            />
            {!exploring && (
              <Choice
                title={copy.landing.exploreTitle}
                body={copy.landing.exploreBody}
                action={copy.landing.exploreAction}
                onClick={() => {
                  setExploring(true)
                  window.scrollTo({ top: 0 })
                }}
              />
            )}
            <LogInLink onClick={() => go('/auth/signin')} />
          </>
        )}

        {touch && (
          <>
            <MemoryComposer visit={{ touchEventId: touch.touch_event_id, placeId: touch.place_id }} placeName={view.place.name} />
            <PaperButton
              onClick={() =>
                navigate('/home', { replace: true, state: { arrivalPlaceId: touch.place_id } satisfies HomeArrivalState })
              }
            >
              {copy.touch.seeWorld}
            </PaperButton>
          </>
        )}
      </div>
    </Shell>
  )
}

/** "Exploring Sado 1 / 5" — the denominator is the region's published, discoverable places. */
function progressFor(
  view: { place: LocalizedPlace; region: LocalizedPlace | null; all: LocalizedPlace[] },
  touches: TouchRow[] | null,
  touch: RecordedTouch | null,
  locale: Locale,
): SheetProgress {
  if (!view.region) return null
  const region = view.region
  const inRegion = view.all.filter((p) => p.parentId === region.id && p.discoverable)
  const visited = new Set((touches ?? []).map((t) => t.place_id))
  if (touch) visited.add(touch.place_id)
  return {
    region: locale === 'ja' ? region.name : region.nameLatin,
    visited: inRegion.filter((p) => visited.has(p.id)).length,
    total: inRegion.length,
  }
}

function CheckInStatus({ checkIn, onRetry }: { checkIn: CheckIn; onRetry: () => void }) {
  const copy = useMessages()

  return (
    <div role="status" aria-live="polite" className="mt-4 min-h-12 rounded-xl bg-white/60 px-3.5 py-3 ring-1 ring-graphite/[0.07]">
      {(checkIn.status === 'idle' || checkIn.status === 'recording') && (
        <p className="animate-pulse text-[0.84rem] tracking-[0.03em] text-graphite-soft motion-reduce:animate-none">
          {copy.touch.checkingIn}
        </p>
      )}
      {checkIn.status === 'failed' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.8rem]">{copy.touch.failed}</p>
          <button type="button" onClick={onRetry} className="min-h-9 shrink-0 text-[0.74rem] underline decoration-graphite/30 underline-offset-4">
            {copy.touch.retry}
          </button>
        </div>
      )}
      {checkIn.status === 'done' && (
        <div className="animate-[linka-fade-in_600ms_var(--ease-calm)_both] motion-reduce:animate-none">
          <p className="text-[0.95rem] tracking-[0.04em]">
            {checkIn.touch.duplicate ? copy.touch.alreadyCheckedIn : copy.touch.checkedIn}
          </p>
          {checkIn.touch.is_test && <p className="mt-1 text-[0.64rem] leading-snug text-graphite-faint">{copy.touch.testPoint}</p>}
        </div>
      )}
    </div>
  )
}

/** ":))) LINKA Touch Point detected" — the physical touch, acknowledged. */
function Detected({ inline = false }: { inline?: boolean }) {
  const copy = useMessages()
  return (
    <p className={cn('flex items-center gap-2 text-[0.64rem] tracking-[0.14em] text-graphite-soft', inline ? 'mt-3' : 'px-5 pt-5')}>
      <span aria-hidden className="touchpoint-mark text-[0.8rem] text-graphite">:)))</span>
      {copy.landing.detected}
    </p>
  )
}

function Choice({
  title,
  body,
  action,
  onClick,
  primary = false,
  benefits,
}: {
  title: string
  body: string
  action: string
  onClick: () => void
  primary?: boolean
  benefits?: readonly string[]
}) {
  return (
    <section className={cn('rounded-2xl p-4', primary ? 'bg-white/80 ring-1 ring-graphite/10' : 'bg-graphite/[0.04]')}>
      <h2 className="text-[1rem] tracking-[0.05em] text-graphite">{title}</h2>
      <p className="mt-1.5 text-[0.76rem] font-light leading-relaxed text-graphite-soft">{body}</p>
      {benefits && (
        <ul className="mt-2.5 space-y-1">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex gap-2 text-[0.74rem] leading-snug text-graphite">
              <span aria-hidden className="text-graphite/40">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3.5">
        <PaperButton onClick={onClick} quiet={!primary}>
          {action}
        </PaperButton>
      </div>
    </section>
  )
}

function LogInLink({ onClick }: { onClick: () => void }) {
  const copy = useMessages()
  return (
    <p className="text-center text-[0.74rem] text-graphite-soft">
      {copy.landing.haveAccount}{' '}
      <button type="button" onClick={onClick} className="min-h-11 px-1 text-graphite underline decoration-graphite/30 underline-offset-4">
        {copy.landing.logIn}
      </button>
    </p>
  )
}

function Skeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="animate-pulse motion-reduce:animate-none">
      <div className="mt-4 aspect-[16/10] w-full bg-graphite/[0.06]" />
      <div className="px-5 pt-5">
        <div className="h-6 w-40 rounded bg-graphite/[0.08]" />
        <div className="mt-2 h-3 w-28 rounded bg-graphite/[0.06]" />
        <div className="mt-6 h-3 w-full rounded bg-graphite/[0.05]" />
        <div className="mt-2 h-3 w-5/6 rounded bg-graphite/[0.05]" />
      </div>
    </div>
  )
}

/** The Door's paper, with the language in the corner. */
function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-dvh w-full bg-paper-lit pt-[env(safe-area-inset-top)]">
      <div className="relative mx-auto w-full max-w-md">
        <LanguageSwitcher className="absolute right-2 top-2 z-10 rounded-full bg-paper-lit/80 backdrop-blur-sm" />
        {children}
      </div>
    </main>
  )
}

function PaperButton({ children, onClick, quiet = false }: { children: ReactNode; onClick: () => void; quiet?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-13 w-full items-center justify-center rounded-full text-[0.9rem] tracking-[0.04em] outline-none transition-colors duration-300 ease-calm focus-visible:ring-2 focus-visible:ring-graphite/40',
        quiet ? 'text-graphite ring-1 ring-graphite/20 hover:bg-graphite/[0.04]' : 'bg-graphite text-paper-lit hover:bg-graphite/90',
      )}
    >
      {children}
    </button>
  )
}
