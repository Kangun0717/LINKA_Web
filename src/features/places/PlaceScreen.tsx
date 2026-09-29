import { lazy, Suspense, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PaperButton from '@/components/ui/PaperButton'
import { usePlaces } from '@/data/places'
import { useAuth } from '@/features/auth/useAuth'
import { PlacePageShell, PlaceSkeleton, PlaceView } from '@/features/places/components/PlacePage'
import { useVisitContext } from '@/features/places/useVisitContext'
import { worldHref, worldPathOf } from '@/features/world/geo/regions'
import { useMessages } from '@/lib/i18n/useMessages'

/** Community context and the reader's own journal: after the page, in its own chunk. */
const PlaceCommunity = lazy(() => import('@/features/places/components/PlaceCommunity'))

/**
 * /place/:slug — the canonical public page of a LINKA place.
 *
 * The information and discovery entry: what a shared link or an ordinary
 * printed QR code opens. No account is needed and nothing is ever recorded
 * here — reading about a place is never a visit. (A physical Touch Point opens
 * /t/:publicId instead, which can record one.) Both show the same Place
 * presentation; this page adds only, for a signed-in reader, their own
 * verified visit and region progress, and a way into the map.
 */
export default function PlaceScreen() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const copy = useMessages()
  const { session } = useAuth()
  const { index, error, reload } = usePlaces()
  const found = index?.bySlug.get(slug) ?? null
  // Regions (佐渡 itself) have no page of their own yet: only destinations.
  const place = found?.kind === 'destination' ? found : null
  const visit = useVisitContext(place, index)

  // Moving to another place (a nearby one) starts at its top. (A block body:
  // newer browsers return a Promise from scrollTo, which must not become the
  // effect's cleanup.)
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slug])

  if (!index) {
    return (
      <PlacePageShell>
        {error ? (
          <div role="alert" className="px-5 pt-16">
            <p className="text-[0.84rem] text-graphite-soft">{copy.loadFailed}</p>
            <button type="button" onClick={reload} className="mt-3 min-h-11 text-[0.8rem] text-graphite underline decoration-graphite/30 underline-offset-4">
              {copy.retry}
            </button>
          </div>
        ) : (
          <PlaceSkeleton label={copy.placePage.loading} />
        )}
      </PlacePageShell>
    )
  }

  if (!place) {
    return (
      <PlacePageShell>
        <div className="px-5 pt-16">
          <h1 className="text-[1.4rem] font-light leading-snug tracking-[0.04em] text-graphite">{copy.placePage.notFoundTitle}</h1>
          <p className="mt-3 text-[0.84rem] font-light leading-relaxed text-graphite-soft">{copy.placePage.notFoundBody}</p>
          <div className="mt-8">
            <PaperButton quiet onClick={() => navigate('/home')}>{copy.landing.exploreMap}</PaperButton>
          </div>
        </div>
      </PlacePageShell>
    )
  }

  return (
    <PlacePageShell>
      <PlaceView
        place={place}
        index={index}
        visit={session ? visit : null}
        onOpenPlace={(other) => navigate(`/place/${other.slug}`)}
      />
      <Suspense fallback={null}>
        <PlaceCommunity placeId={place.id} slug={place.slug} visitedOn={session ? (visit?.visitedOn ?? null) : null} />
      </Suspense>
      <div className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
        <PaperButton quiet onClick={() => navigate(worldHref(worldPathOf(place), place.slug))}>
          {copy.landing.exploreMap}
        </PaperButton>
      </div>
    </PlacePageShell>
  )
}
