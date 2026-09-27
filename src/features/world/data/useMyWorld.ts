import { EMPTY_WORLD, type WorldSnapshot } from '@/features/world/model/types'

/**
 * The signed-in user's world — the only source production `/home` reads.
 *
 * Touch history is not connected yet, so this is honestly empty: nobody has a
 * recorded touch, and showing anything else would be invented. When
 * `touch_events` is wired, this becomes a query (events joined to their Touch
 * Points, grouped per Touch Point) that returns the same `WorldSnapshot`, and
 * nothing that draws the world has to change.
 */
export function useMyWorld(): WorldSnapshot {
  return EMPTY_WORLD
}
