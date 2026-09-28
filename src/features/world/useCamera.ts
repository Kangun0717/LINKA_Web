import { useCallback, useEffect, useState } from 'react'

import { moveDuration, type View } from '@/features/world/geo/camera'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/**
 * A move between levels.
 *
 *   snap — the old view is still on screen, for exactly one commit, so the
 *          map can be copied as it looks (MyWorld does this in a layout effect)
 *   fly  — the destination is rendered once, and the browser animates only
 *          transform and opacity between the copy and it
 */
export type Flight = { id: number; from: View; to: View; duration: number; phase: 'snap' | 'fly' }

/**
 * The camera, moving only when the user moves it.
 *
 * It used to interpolate a new View every animation frame, which re-projected
 * every coastline and re-rasterised every watercolour filter sixty times a
 * second — more than Safari on an iPhone can do (measured: 5–6 frames across
 * a 2.6 s World → Japan move in WebKit). Now a move renders the map twice in
 * total — as it was, and as it will be — and the zoom between them is a GPU
 * transform. The resting map is exactly what it was.
 *
 * A change of level is a flight; anything else — the first measurement, a
 * resize — simply places the camera. With reduced motion every flight is a cut.
 */
export function useCamera(
  target: View | null,
  level: string,
): { view: View | null; moving: boolean; flight: Flight | null; startFlying: () => void } {
  const reducedMotion = usePrefersReducedMotion()
  const [view, setView] = useState(target)
  const [placedLevel, setPlacedLevel] = useState(level)
  const [flight, setFlight] = useState<Flight | null>(null)

  if (target && level !== placedLevel) {
    setPlacedLevel(level)
    if (view && !reducedMotion) {
      setFlight({ id: (flight?.id ?? 0) + 1, from: view, to: target, duration: flightDuration(view, target), phase: 'snap' })
    } else {
      setView(target)
    }
  } else if (target && !flight && !sameView(view, target)) {
    setView(target)
  }

  // Called once the old map has been copied: now draw the destination.
  const startFlying = useCallback(() => {
    setFlight((current) => {
      if (!current || current.phase !== 'snap') return current
      setView(current.to)
      return { ...current, phase: 'fly' }
    })
  }, [])

  useEffect(() => {
    if (!flight || flight.phase !== 'fly') return
    const timer = window.setTimeout(() => setFlight(null), flight.duration + 80)
    return () => window.clearTimeout(timer)
  }, [flight])

  return { view, moving: flight !== null, flight, startFlying }
}

/** Shorter than the old frame-by-frame move: a GPU zoom reads as quick, not slow. */
function flightDuration(from: View, to: View): number {
  return Math.round(Math.min(1300, moveDuration(from, to) * 0.52))
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
