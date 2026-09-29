import { useLayoutEffect, type RefObject } from 'react'

import { flightTransform } from '@/features/world/geo/camera'
import { isolateIds } from '@/features/world/isolateIds'
import type { useCamera } from '@/features/world/useCamera'

type Flight = ReturnType<typeof useCamera>['flight']

/**
 * A flight between levels, in three steps and no per-frame rendering:
 *   snap: copy the map exactly as it looks now into a static ghost layer;
 *   fly:  the destination is rendered once; the ghost zooms toward it and
 *         fades, the destination zooms in from where it was and appears —
 *         transform and opacity only, which the browser composites on the GPU;
 *   rest: the ghost is dropped and the live map is left exactly as drawn.
 *
 * Geography-agnostic: it moves whatever `stage` draws, for any country, area
 * or campus the camera flies between.
 */
export function useFlightLayer({
  flight,
  startFlying,
  width,
  height,
  stageRef,
  layerRef,
  ghostRef,
}: {
  flight: Flight
  startFlying: () => void
  width: number
  height: number
  stageRef: RefObject<HTMLDivElement | null>
  layerRef: RefObject<HTMLDivElement | null>
  ghostRef: RefObject<HTMLDivElement | null>
}) {
  useLayoutEffect(() => {
    const layer = layerRef.current
    const ghost = ghostRef.current
    if (!flight || !layer || !ghost) return

    if (flight.phase === 'snap') {
      // Only the drawn map flies. Marks, names and photos are UI, not geography:
      // scaled with the map they would balloon, so they wait for the arrival.
      const stage = stageRef.current
      if (!stage) {
        startFlying()
        return
      }
      const copy = stage.cloneNode(true) as HTMLElement
      isolateIds(copy, `-g${flight.id}`)
      // WebKit re-evaluates SVG filters whenever a layer's scale changes, so
      // the copy flies without them (the pencil wobble and watercolour edge
      // are not visible at speed); the destination is drawn with them at rest.
      for (const element of copy.querySelectorAll('[filter]')) element.removeAttribute('filter')
      // The copy is a picture: nothing in it can be focused, read out or tapped.
      copy.removeAttribute('id')
      copy.setAttribute('inert', '')
      ghost.replaceChildren(copy)
      startFlying()
      return
    }

    const { k, tx, ty } = flightTransform(flight.from, flight.to, width, height)
    const d = flight.duration
    const curve = 'cubic-bezier(0.45, 0, 0.2, 1)'
    const copy = ghost.firstElementChild as HTMLElement | null

    layer.style.transition = 'none'
    layer.style.transformOrigin = '0 0'
    layer.style.transform = `translate3d(${(-tx / k).toFixed(2)}px, ${(-ty / k).toFixed(2)}px, 0) scale(${(1 / k).toFixed(5)})`
    layer.style.opacity = '0'
    layer.style.willChange = 'transform, opacity'
    layer.dataset.flying = ''
    if (copy) {
      copy.style.transformOrigin = '0 0'
      copy.style.willChange = 'transform, opacity'
    }
    void layer.offsetWidth // commit the start state before transitioning

    layer.style.transition = `transform ${d}ms ${curve}, opacity ${Math.round(d * 0.5)}ms ease ${Math.round(d * 0.3)}ms`
    layer.style.transform = 'translate3d(0, 0, 0) scale(1)'
    layer.style.opacity = '1'
    if (copy) {
      copy.style.transition = `transform ${d}ms ${curve}, opacity ${Math.round(d * 0.5)}ms ease ${Math.round(d * 0.35)}ms`
      copy.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${k.toFixed(5)})`
      copy.style.opacity = '0'
    }

    return () => {
      ghost.replaceChildren()
      layer.style.transition = ''
      layer.style.transform = ''
      layer.style.transformOrigin = ''
      layer.style.opacity = ''
      layer.style.willChange = ''
      delete layer.dataset.flying
    }
  }, [flight, startFlying, width, height, stageRef, layerRef, ghostRef])
}
