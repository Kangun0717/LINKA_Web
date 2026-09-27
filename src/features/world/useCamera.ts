import { useEffect, useState } from 'react'

import { interpolate, moveDuration, type View } from '@/features/world/geo/camera'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type Journey = { from: View; to: View }

/**
 * The camera, moving only when the user moves it.
 *
 * `target` is where the view should rest; `level` names which rung of the
 * ladder that is. A change of level is a journey and is animated. Anything
 * else — the first measurement, a resize — simply places the camera, because
 * the world never moves by itself. With reduced motion every journey is a cut.
 *
 * `moving` is true for the length of a journey, so the heavier drawing can
 * wait until the camera has arrived.
 */
export function useCamera(target: View | null, level: string): { view: View | null; moving: boolean } {
  const reducedMotion = usePrefersReducedMotion()
  const [view, setView] = useState(target)
  const [placedLevel, setPlacedLevel] = useState(level)
  const [journey, setJourney] = useState<Journey | null>(null)

  if (target && level !== placedLevel) {
    setPlacedLevel(level)
    if (view && !reducedMotion) setJourney({ from: view, to: target })
    else setView(target)
  } else if (target && !journey && !sameView(view, target)) {
    setView(target)
  }

  useEffect(() => {
    if (!journey) return

    const { from, to } = journey
    const duration = moveDuration(from, to)
    const start = performance.now()
    let frame = 0

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      if (t < 1) {
        setView(interpolate(from, to, t))
        frame = requestAnimationFrame(step)
      } else {
        setView(to)
        setJourney(null)
      }
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [journey])

  return { view, moving: journey !== null }
}

function sameView(a: View | null, b: View): boolean {
  return (
    a !== null &&
    a.depth === b.depth &&
    a.r === b.r &&
    a.cx === b.cx &&
    a.cy === b.cy &&
    a.lng0 === b.lng0 &&
    a.lat0 === b.lat0
  )
}
