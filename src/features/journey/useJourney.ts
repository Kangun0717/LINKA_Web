import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import { fetchMyMemories, type MemoryRecord } from '@/features/memories/api'
import { fetchMyTouches, fetchPlaces, type PlaceRecord, type TouchRow } from '@/features/places/api'
import { localizePlace, type LocalizedPlace } from '@/features/places/localize'
import { fetchMySuggestions, type SuggestionRow } from '@/features/suggest/api'
import { useLocale } from '@/lib/i18n/LocaleContext'

/** One visit — a Touch — and whatever the user kept of it. */
export type Moment = {
  touch: TouchRow
  place: LocalizedPlace
  memory: MemoryRecord | null
}

export type Journey = {
  ready: boolean
  error: unknown
  /** Newest first. */
  moments: Moment[]
  /** Places touched, with the region each belongs to. */
  visited: { region: LocalizedPlace | null; places: LocalizedPlace[] }[]
  stats: { places: number; regions: number; memories: number; photos: number }
  suggestions: SuggestionRow[]
  /** Refetch after a change (a memory saved elsewhere, a suggestion sent). */
  reload: () => void
}

type Loaded = {
  userId: string
  places: PlaceRecord[]
  touches: TouchRow[]
  memories: MemoryRecord[]
  suggestions: SuggestionRow[]
}

/**
 * The signed-in user's own journey: their touches, memories, photos and
 * suggestions, joined to the published places. Every number Moments and Me
 * show is counted from these rows — nothing is estimated or filled in.
 */
export function useJourney(): Journey {
  const { user } = useAuth()
  const { locale } = useLocale()
  const userId = user?.id ?? null
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    Promise.all([fetchPlaces(), fetchMyTouches(), fetchMyMemories(), fetchMySuggestions().catch(() => [])])
      .then(([places, touches, memories, suggestions]) => {
        if (active) setLoaded({ userId, places, touches, memories, suggestions })
      })
      .catch((cause: unknown) => active && setError(cause))
    return () => {
      active = false
    }
  }, [userId, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const fresh = loaded && loaded.userId === userId ? loaded : null

  return useMemo<Journey>(() => {
    if (!fresh) {
      return { ready: false, error, moments: [], visited: [], stats: { places: 0, regions: 0, memories: 0, photos: 0 }, suggestions: [], reload }
    }

    const places = new Map(fresh.places.map((p) => [p.id, localizePlace(p, locale)]))
    const memoryByTouch = new Map(fresh.memories.map((m) => [m.touch_event_id, m]))

    const moments = [...fresh.touches]
      .reverse()
      .flatMap((touch) => {
        const place = touch.place_id ? places.get(touch.place_id) : undefined
        return place ? [{ touch, place, memory: memoryByTouch.get(touch.id) ?? null }] : []
      })

    const byRegion = new Map<string, { region: LocalizedPlace | null; places: LocalizedPlace[] }>()
    for (const { place } of moments) {
      const key = place.parentId ?? place.id
      const group = byRegion.get(key) ?? { region: place.parentId ? places.get(place.parentId) ?? null : null, places: [] }
      if (!group.places.some((p) => p.id === place.id)) group.places.push(place)
      byRegion.set(key, group)
    }

    const kept = fresh.memories.filter((m) => m.note || m.mood || m.memory_photos.length > 0)
    return {
      ready: true,
      error: null,
      moments,
      visited: [...byRegion.values()],
      stats: {
        places: new Set(moments.map((m) => m.place.id)).size,
        regions: byRegion.size,
        memories: kept.length,
        photos: fresh.memories.reduce((sum, m) => sum + m.memory_photos.length, 0),
      },
      suggestions: fresh.suggestions,
      reload,
    }
  }, [fresh, locale, error, reload])
}
