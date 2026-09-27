import {
  clipPolygon,
  clipPolyline,
  polygonPath,
  polylinePath,
  type Point,
  type Rect,
} from '@/features/world/geo/clip'
import { mayBeVisible } from '@/features/world/geo/caps'
import { project, projectBeyond, type WorldFrame } from '@/features/world/geo/orthographic'

/** The screen, plus a margin so clipped edges and filter wobble stay out of sight. */
export function screenRect(width: number, height: number, margin = 48): Rect {
  return { x0: -margin, y0: -margin, x1: width + margin, y1: height + margin }
}

/** `lng, lat, …` on screen. */
export function projectCoords(frame: WorldFrame, coords: readonly number[]): Point[] {
  const out: Point[] = []
  for (let i = 0; i < coords.length; i += 2) out.push(project(frame, coords[i], coords[i + 1]))
  return out
}

/**
 * Land for a close view: filled outlines and their coast, cut to the screen.
 * Rings that cannot reach the screen are skipped before projecting (`reach`,
 * from `screenReach`); rings entirely off one side of it before clipping.
 */
export function clippedLand(
  frame: WorldFrame,
  rings: readonly (readonly number[])[],
  rect: Rect,
  reach: number,
  coarse = false,
): { fill: string; coast: string } {
  const fill: string[] = []
  const coast: string[] = []

  for (const ring of rings) {
    if (!mayBeVisible(frame, ring, reach)) continue
    const points: Point[] = []
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]

    for (let i = 0; i < ring.length; i += 2) {
      const p = projectBeyond(frame, ring[i], ring[i + 1])
      points.push(p)
      x0 = Math.min(x0, p.x)
      x1 = Math.max(x1, p.x)
      y0 = Math.min(y0, p.y)
      y1 = Math.max(y1, p.y)
    }

    if (x1 < rect.x0 || x0 > rect.x1 || y1 < rect.y0 || y0 > rect.y1) continue

    fill.push(polygonPath(clipPolygon(points, rect), coarse))
    for (const run of clipPolyline([...points, points[0]], rect)) coast.push(polylinePath(run, coarse))
  }

  return { fill: fill.join(''), coast: coast.join('') }
}

/** Kilometres on the ground, as pixels at this frame. */
export function kmToPx(frame: WorldFrame, km: number): number {
  return (km / 6371) * frame.r
}

/** A stable choice of watercolour edge per id, so no two washes look stamped. */
export function variantOf(id: string): number {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash) % 3
}
