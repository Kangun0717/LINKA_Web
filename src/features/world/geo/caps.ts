import type { WorldFrame } from '@/features/world/geo/orthographic'

/**
 * A cheap "could this ring be on screen?" test, made before any projecting.
 *
 * Each ring is summarised once as a cap on the sphere — the direction of its
 * middle and how far its farthest point strays from it. The screen, seen
 * through a frame, covers a cap too. If the two caps cannot touch, the ring is
 * skipped without projecting a single point. Close in (a country, an island)
 * that removes almost all of the world's land from every frame of a move.
 */

type Cap = { x: number; y: number; z: number; radius: number }

const RAD = Math.PI / 180
const caps = new WeakMap<readonly number[], Cap>()

function capOf(ring: readonly number[]): Cap {
  const cached = caps.get(ring)
  if (cached) return cached

  let [x, y, z] = [0, 0, 0]
  const points: [number, number, number][] = []
  for (let i = 0; i < ring.length; i += 2) {
    const φ = ring[i + 1] * RAD
    const λ = ring[i] * RAD
    const p: [number, number, number] = [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)]
    points.push(p)
    x += p[0]
    y += p[1]
    z += p[2]
  }

  const length = Math.hypot(x, y, z) || 1
  ;[x, y, z] = [x / length, y / length, z / length]
  let radius = 0
  for (const [px, py, pz] of points) {
    radius = Math.max(radius, Math.acos(Math.min(1, px * x + py * y + pz * z)))
  }
  // A ring round a pole (or wrapping the far side) has a meaningless middle.
  if (length < points.length * 0.2) radius = Math.PI

  const cap = { x, y, z, radius }
  caps.set(ring, cap)
  return cap
}

/** How much of the sphere a frame can show on a screen of this size, radians. */
export function screenReach(frame: WorldFrame, width: number, height: number): number {
  const far = Math.max(
    Math.hypot(frame.cx, frame.cy),
    Math.hypot(width - frame.cx, frame.cy),
    Math.hypot(frame.cx, height - frame.cy),
    Math.hypot(width - frame.cx, height - frame.cy),
  )
  // A little extra, for the margin clipping draws beyond the screen.
  return far >= frame.r ? Math.PI / 2 : Math.min(Math.PI / 2, Math.asin(far / frame.r) + 0.02)
}

export function mayBeVisible(frame: WorldFrame, ring: readonly number[], reach: number): boolean {
  const cap = capOf(ring)
  if (cap.radius >= Math.PI) return true
  const φ = frame.lat0 * RAD
  const λ = frame.lng0 * RAD
  const dot = cap.x * Math.cos(φ) * Math.cos(λ) + cap.y * Math.cos(φ) * Math.sin(λ) + cap.z * Math.sin(φ)
  return Math.acos(Math.max(-1, Math.min(1, dot))) - cap.radius < reach
}
