import { useMemo } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import {
  addSupport,
  fetchCommunitySuggestion,
  fetchCommunitySuggestions,
  fetchMySuggestion,
  fetchMySupports,
  fetchSuggestionTimeline,
  removeSupport,
  type MySupportRow,
  type PublicSuggestionDetail,
  type PublicSuggestionRow,
} from '@/features/community/api'
import { invalidate, privateKey, update, useResource } from '@/data/store'
import { useMySuggestions } from '@/data/journey'

/**
 * Community data, cached like the rest (src/data/store.ts).
 *
 *   public:community:…     the public read model — the same for everyone
 *   private:<user>:supports    this person's own 行ってみたい
 *   private:<user>:suggestions this person's own suggestions (journey.ts)
 *
 * A support changes three things at once — the viewer's own list, the count
 * on the list and the count on the detail — so the change is written into
 * each (never guessed later) and the server's answer is fetched after.
 */

const PUBLIC_TTL = 60_000
const keys = {
  list: 'public:community:list',
  detail: (id: string) => `public:community:suggestion:${id}`,
  timeline: (id: string, userId: string | null) => (userId ? privateKey(userId, `timeline:${id}`) : `public:community:timeline:${id}`),
  supports: (userId: string) => privateKey(userId, 'supports'),
  mine: (userId: string, id: string) => privateKey(userId, `suggestion:${id}`),
}

/** Every public suggestion (up to 100, newest first) — Community is small enough to read whole. */
export function useCommunityList() {
  return useResource(keys.list, () => fetchCommunitySuggestions(null, 100), PUBLIC_TTL)
}

export function useCommunitySuggestion(id: string) {
  return useResource(id ? keys.detail(id) : null, () => fetchCommunitySuggestion(id), PUBLIC_TTL)
}

/** The timeline: a proposer also sees their own unopened suggestion's, so it is keyed by viewer. */
export function useSuggestionTimeline(id: string) {
  const { user, loading } = useAuth()
  return useResource(id && !loading ? keys.timeline(id, user?.id ?? null) : null, () => fetchSuggestionTimeline(id), PUBLIC_TTL)
}

/** The person's own suggestion by id — their private view of one not yet public. */
export function useMySuggestion(id: string) {
  const { user } = useAuth()
  return useResource(user && id ? keys.mine(user.id, id) : null, () => fetchMySuggestion(id))
}

export function useMySupports() {
  const { user } = useAuth()
  const supports = useResource(user ? keys.supports(user.id) : null, fetchMySupports)
  const ids = useMemo(() => new Set((supports.data ?? []).map((s) => s.suggestion_id)), [supports.data])
  return { ...supports, ids }
}

/** The person's own suggestion ids — to know which suggestions are theirs (no self-support). */
export function useMySuggestionIds(): ReadonlySet<string> {
  const mine = useMySuggestions()
  return useMemo(() => new Set((mine.data ?? []).map((s) => s.id)), [mine.data])
}

function adjustCount(id: string, delta: number) {
  const change = <T extends { id: string; support_count: number }>(row: T): T =>
    row.id === id ? { ...row, support_count: Math.max(0, row.support_count + delta) } : row
  update<PublicSuggestionRow[]>(keys.list, (list = []) => list.map(change))
  update<PublicSuggestionDetail | null>(keys.detail(id), (detail) => (detail ? change(detail) : null))
}

/**
 * Say (or take back) 行ってみたい. The change shows at once and is undone if
 * the server refuses; the server — not this code — decides whether it is
 * allowed (own suggestion, closed, rate limit).
 */
export async function toggleSupport(userId: string, id: string, supported: boolean): Promise<void> {
  const mineKey = keys.supports(userId)
  const apply = (on: boolean) => {
    update<MySupportRow[]>(mineKey, (list = []) =>
      on ? [{ suggestion_id: id, created_at: new Date().toISOString() }, ...list.filter((s) => s.suggestion_id !== id)] : list.filter((s) => s.suggestion_id !== id),
    )
    adjustCount(id, on ? 1 : -1)
  }
  apply(!supported)
  try {
    if (supported) await removeSupport(id, userId)
    else await addSupport(id)
  } catch (error) {
    apply(supported)
    throw error
  } finally {
    invalidate(mineKey)
    invalidate(keys.detail(id))
    invalidate(keys.list)
  }
}

/** A suggestion was submitted or withdrawn: refetch what shows it (and, signed in, the person's own view of it). */
export function communityChanged(userId?: string) {
  invalidate('public:community:')
  if (userId) {
    invalidate(privateKey(userId, 'suggestion:'))
    invalidate(privateKey(userId, 'timeline:'))
  }
}
