import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/**
 * The first moments after a touch, as the world receives it.
 *
 *   rest    : the world as it was, for a breath
 *   mark    : the Touch Point appears and sends out one ripple
 *   bloom   : the wash spreads and the geography comes up through it
 *   named   : the card arrives — the place has a name now
 *   settled : the card folds away to a quiet label; the world is the hero again
 */
export type ArrivalPhase = 'rest' | 'mark' | 'bloom' | 'named' | 'settled'

const TIMELINE: ReadonlyArray<[ArrivalPhase, number]> = [
  ['mark', 600],
  ['bloom', 1100],
  ['named', 3300],
  ['settled', 7600],
]

/**
 * Without an arriving place there is nothing to play. With reduced motion the
 * place is named at once and the card stays until the user dismisses it —
 * nothing on screen changes by itself.
 */
export function useArrival(arrivalPlaceId: string | null): ArrivalPhase {
  const reducedMotion = usePrefersReducedMotion()
  const plays = arrivalPlaceId !== null && !reducedMotion
  const [phase, setPhase] = useState<ArrivalPhase>(plays ? 'rest' : 'named')

  useEffect(() => {
    if (!plays) return

    const timers = TIMELINE.map(([next, at]) => window.setTimeout(() => setPhase(next), at))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [plays])

  return plays ? phase : 'named'
}
