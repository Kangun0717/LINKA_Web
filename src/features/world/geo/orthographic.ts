import { mayBeVisible, screenReach } from '@/features/world/geo/caps'
import { LAND_RINGS } from '@/features/world/geo/landRings'
import type { WorldPlace } from '@/features/world/model/types'

/**
 * Where the world sits on screen and which way it faces.
 *
 * An orthographic projection — the world seen from far away, the way a globe
 * looks — written out by hand because it is a dozen lines of trigonometry and
 * a mapping library would bring tiles, styles and weight this screen does not
 * want. The world never rotates on its own: a frame is chosen once from the
 * places and held.
 */
export type WorldFrame = {
  /** Sphere centre on screen, px. */
  cx: number
  cy: number
  /** Sphere radius, px. Deliberately larger than the screen is wide. */
  r: number
  /** The geographic point facing the viewer. */
  lng0: number
  lat0: number
}

export type ScreenPoint = { x: number; y: number; visible: boolean }

const RAD = Math.PI / 180

/** Where the world rests before anything has been touched. */
const QUIET_CENTRE = { lng: 122, lat: 18 }

export function project(frame: WorldFrame, lng: number, lat: number): ScreenPoint {
  const φ = lat * RAD
  const φ0 = frame.lat0 * RAD
  const Δλ = (lng - frame.lng0) * RAD

  const cosC = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(Δλ)
  const x = Math.cos(φ) * Math.sin(Δλ)
  const y = Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(Δλ)

  return { x: frame.cx + x * frame.r, y: frame.cy - y * frame.r, visible: cosC >= 0 }
}

/**
 * Choose the frame for a set of places.
 *
 *   none : the quiet world, large and resting low on the screen
 *   one  : closer in, with the place sitting above the card's reach
 *   many : turned to face the middle of everything touched, and pulled back
 *          just far enough that every place is on screen
 */
export function frameWorld(
  places: readonly WorldPlace[],
  width: number,
  height: number,
): WorldFrame {
  const base = Math.min(width * 0.72, height * 0.42)
  const cx = width / 2
  const cy = height * 0.56

  if (places.length === 0) {
    return { cx, cy, r: base, lng0: QUIET_CENTRE.lng, lat0: QUIET_CENTRE.lat }
  }

  if (places.length === 1) {
    const [place] = places
    const r = base * 1.35
    // Tilt the world so the place rests at 40% height, clear of the card.
    const lift = Math.asin(Math.min(0.9, (cy - height * 0.4) / r)) / RAD

    return { cx, cy, r, lng0: place.lng, lat0: place.lat - lift }
  }

  const centre = sphericalCentre(places)
  const unit: WorldFrame = { cx: 0, cy: 0, r: 1, lng0: centre.lng, lat0: centre.lat }

  // The largest radius that keeps every place inside a comfortable margin.
  let r = base * 1.35
  for (const place of places) {
    const p = project(unit, place.lng, place.lat)
    const dx = Math.abs(p.x)
    const up = -p.y

    if (dx > 0) r = Math.min(r, (width * 0.31) / dx)
    if (up > 0) r = Math.min(r, (cy - height * 0.2) / up)
    if (up < 0) r = Math.min(r, (height * 0.76 - cy) / -up)
  }

  return { cx, cy, r: Math.max(r, base * 0.62), lng0: centre.lng, lat0: centre.lat }
}

/** The point on the sphere facing the average of all places. */
function sphericalCentre(places: readonly WorldPlace[]): { lng: number; lat: number } {
  let x = 0
  let y = 0
  let z = 0

  for (const place of places) {
    const φ = place.lat * RAD
    const λ = place.lng * RAD
    x += Math.cos(φ) * Math.cos(λ)
    y += Math.cos(φ) * Math.sin(λ)
    z += Math.sin(φ)
  }

  return { lng: Math.atan2(y, x) / RAD, lat: Math.atan2(z, Math.hypot(x, y)) / RAD }
}

const fmtFine = (n: number) => n.toFixed(1)
/** Whole pixels: five times cheaper to write, and invisible while moving. */
const fmtCoarse = (n: number) => String(Math.round(n))

export type LandPaths = {
  /** Land filled the ordinary way. */
  fill: string
  /**
   * Land whose outline surrounds the point directly behind the world, so its
   * inside is everything *outside* the outline. Each is drawn with `evenodd`
   * against a frame larger than the world, as its own path, so it never
   * punches holes in the rest of the land.
   */
  fillInverse: string[]
  /** Only the visible runs of each coastline. */
  coast: string
}

/**
 * The land, drawn for one frame.
 *
 * Filling land on a globe needs care where a coastline passes behind it. Each
 * hidden point is placed *outside* the rim, along its true direction, further
 * out the further round the back it is. That keeps every outline a simple
 * shape, so the sphere's clip path cuts it exactly at the horizon — no clipping
 * geometry, and no library, required.
 *
 * `screen`, when given, skips land that cannot reach the screen, and `coarse`
 * writes whole pixels — both for frames of a move, where every frame counts
 * and nothing holds still long enough to see the difference.
 */
export function landPaths(
  frame: WorldFrame,
  screen?: { width: number; height: number },
  coarse = false,
): LandPaths {
  const { cx, cy, r } = frame
  const rings: { d: string; area: number; wholeVisible: boolean }[] = []
  const coast: string[] = []
  const fmt = coarse ? fmtCoarse : fmtFine
  const reach = screen ? screenReach(frame, screen.width, screen.height) : Math.PI / 2

  for (const ring of LAND_RINGS) {
    if (!mayBeVisible(frame, ring, reach)) continue
    const points: ScreenPoint[] = []
    let visibleCount = 0

    for (let i = 0; i < ring.length; i += 2) {
      const p = projectBeyond(frame, ring[i], ring[i + 1])
      points.push(p)
      if (p.visible) visibleCount += 1
    }

    if (visibleCount === 0) continue

    let area = 0
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i]
      const b = points[(i + 1) % points.length]
      area += a.x * b.y - b.x * a.y
    }

    rings.push({
      d: points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p.x)} ${fmt(p.y)}`).join('') + 'Z',
      area,
      wholeVisible: visibleCount === points.length,
    })

    let drawing = false
    for (const p of [...points, points[0]]) {
      if (!p.visible) {
        drawing = false
        continue
      }
      coast.push(`${drawing ? 'L' : 'M'}${fmt(p.x)} ${fmt(p.y)}`)
      drawing = true
    }
  }

  // Outlines keep their winding under projection — except those that wrap the
  // far side, which turn inside out. Fully visible rings show which way is normal.
  const normal = Math.sign(
    rings.reduce((sum, ring) => sum + (ring.wholeVisible ? Math.sign(ring.area) : 0), 0) || -1,
  )
  const frameRect = `M${fmt(cx - 2 * r)} ${fmt(cy - 2 * r)}h${fmt(4 * r)}v${fmt(4 * r)}h${fmt(-4 * r)}Z`

  return {
    fill: rings
      .filter((ring) => Math.sign(ring.area) === normal)
      .map((ring) => ring.d)
      .join(''),
    fillInverse: rings
      .filter((ring) => Math.sign(ring.area) !== normal)
      .map((ring) => frameRect + ring.d),
    coast: coast.join(''),
  }
}

/**
 * The orthographic point when it faces the viewer; otherwise a point outside
 * the rim in the same direction, pushed further out the nearer it is to the
 * point directly behind the world.
 */
export function projectBeyond(frame: WorldFrame, lng: number, lat: number): ScreenPoint {
  const p = project(frame, lng, lat)
  if (p.visible) return p

  const dx = (p.x - frame.cx) / frame.r
  const dy = (p.y - frame.cy) / frame.r
  // Behind the world, the flat distance is sin(c); push out by 1 / sin²(c).
  const sinC = Math.max(0.02, Math.hypot(dx, dy))
  const k = frame.r / (sinC * sinC)

  return { x: frame.cx + dx * k, y: frame.cy + dy * k, visible: false }
}
