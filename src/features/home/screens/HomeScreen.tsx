import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { useMyMemories } from '@/data/journey'
import { usePlaces } from '@/data/places'
import { useAuth } from '@/features/auth/useAuth'
import { formatJournalDate } from '@/features/journal/model'
import { thumbPathOf } from '@/features/memories/photos'
import { usePhotoUrls } from '@/features/memories/usePhotoUrls'
import type { MemoryPinData } from '@/features/world/components/MemoryPin'
import MyWorld from '@/features/world/components/MyWorld'
import { useMyWorld } from '@/features/world/data/useMyWorld'
import { useWorldPath } from '@/features/world/useWorldPath'
import AppShell from '@/layouts/AppShell'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useMessages } from '@/lib/i18n/useMessages'
import { CommunityScreen } from '@/routes/lazyScreens'

/** Set by the Touch screen when it hands a fresh check-in over to My World. */
export type HomeArrivalState = { arrivalPlaceId?: string } | null

/**
 * Home is My World.
 *
 * It reads only the user's own world and LINKA's published places. Preview
 * scenarios never reach this screen — they live behind the dev-only
 * /preview/my-world route.
 *
 * The world waits for its data on its own paper rather than drawing empty and
 * re-framing: the globe is framed around the places a user has touched, so
 * drawing before they arrive would visibly move it.
 *
 * The journal's memories are a second, quieter layer, shown only on a local
 * map — so they are fetched only once someone is on one, never while the
 * globe is turning — placed beside the land they belong to, never colouring it.
 * Community is fetched when someone reaches for its entry, not before: parsing
 * it on idle landed in the middle of map flights.
 */
export default function HomeScreen() {
  const { snapshot, discovery, ready } = useMyWorld()
  const { path, enter, back } = useWorldPath()
  const { state } = useLocation() as { state: HomeArrivalState }
  const navigate = useNavigate()
  const copy = useMessages()
  // Read once: Back and Forward must not replay an arrival.
  const [arrivalPlaceId] = useState(() => state?.arrivalPlaceId ?? null)
  // A place whose card opens on arrival — by slug (a Place page's "explore on
  // the map") or by id (older links, another card's nearby place).
  const [params] = useSearchParams()
  const [openPlace] = useState(() => params.get('place'))
  const openPlaceId = openPlace ? (discovery.find((p) => p.slug === openPlace)?.id ?? openPlace) : null
  const memoryPins = useMemoryPins(ready && path.length === 2)

  return (
    <AppShell>
      {ready ? (
        <MyWorld
          snapshot={snapshot}
          discovery={discovery}
          arrivalPlaceId={arrivalPlaceId}
          openPlaceId={openPlaceId}
          path={path}
          onEnter={enter}
          onBack={back}
          memoryPins={memoryPins}
          onOpenMemory={(id) => navigate(`/moments/${id}`)}
          corner={
            <Link
              to="/community"
              onPointerEnter={CommunityScreen.warm}
              onTouchStart={CommunityScreen.warm}
              onFocus={CommunityScreen.warm}
              className="flex min-h-11 items-center gap-2 rounded-full bg-paper-lit/90 py-1.5 pl-2 pr-3.5 shadow-[0_1px_2px_rgba(51,48,43,0.12),0_8px_18px_-12px_rgba(51,48,43,0.5)] ring-1 ring-graphite/10 backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-graphite/40"
            >
              <span aria-hidden className="flex size-7 items-center justify-center rounded-full ring-1 ring-[#a4543a]/50">
                <svg viewBox="0 0 14 14" className="size-3.5 text-[#a4543a]">
                  <path d="M3 11.5V2.6M3 2.8c2.4-1 4.2 1 6.6 0v4.4c-2.4 1-4.2-1-6.6 0" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block text-[0.7rem] tracking-[0.1em] text-graphite">{copy.communityEntry.title}</span>
                <span className="block text-[0.52rem] tracking-[0.06em] text-graphite-soft">{copy.communityEntry.second}</span>
              </span>
            </Link>
          }
        />
      ) : (
        <div className="h-full bg-canvas" />
      )}
    </AppShell>
  )
}

/**
 * Past journal entries at LINKA places, one pin per place (the newest entry
 * opens). An entry in the person's own words has no point on the map, so it
 * stays in Moments only. Nothing here reads or writes visits.
 */
function useMemoryPins(onLocalMap: boolean): MemoryPinData[] {
  const { user } = useAuth()
  const { locale } = useLocale()
  // Once asked for, kept: going back up to Japan and down again needs no new request.
  const [wanted, setWanted] = useState(false)
  if (onLocalMap && user && !wanted) setWanted(true)
  const memories = useMyMemories(wanted)
  const { index } = usePlaces()

  const grouped = useMemo(() => {
    const byPlace = new Map<string, NonNullable<typeof memories.data>>()
    for (const m of memories.data ?? []) {
      if (m.kind !== 'past' || !m.place_id) continue
      byPlace.set(m.place_id, [...(byPlace.get(m.place_id) ?? []), m])
    }
    return [...byPlace].flatMap(([placeId, list]) => {
      const place = index?.byId.get(placeId)
      if (!place) return []
      const newest = [...list].sort((a, b) => (b.remembered_on ?? '').localeCompare(a.remembered_on ?? ''))[0]
      const cover = newest.memory_photos.find((p) => p.id === newest.cover_photo_id) ?? newest.memory_photos[0] ?? null
      return [{ newest, place, cover, count: list.length }]
    })
  }, [memories.data, index])

  const covers = useMemo(() => grouped.flatMap((g) => (g.cover ? [g.cover] : [])), [grouped])
  const urls = usePhotoUrls(covers)

  return useMemo(
    () =>
      grouped.map(({ newest, place, cover, count }) => ({
        id: newest.id,
        placeId: place.id,
        lat: place.lat,
        lng: place.lng,
        name: place.name,
        date: newest.remembered_on ? formatJournalDate(newest.remembered_on, (newest.date_precision as 'day') ?? 'day', locale) : '',
        count,
        photo: cover ? (urls[thumbPathOf(cover.storage_path)] ?? urls[cover.storage_path] ?? null) : null,
      })),
    [grouped, urls, locale],
  )
}
