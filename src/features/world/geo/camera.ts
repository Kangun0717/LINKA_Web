import { project, type WorldFrame } from '@/features/world/geo/orthographic'

/**
 * One camera for every scale.
 *
 * My World, a country and a local map are not three maps: they are the same
 * orthographic world seen from further or closer. Far away it is a globe;
 * close in the same projection is, to the eye, a flat map. Keeping one
 * projection is what lets the globe turn into Japan and Japan into Sado with
 * every coastline staying exactly where it was — there is never a cut to a
 * different drawing, only a camera moving.
 *
 * `depth` says how far down the ladder the view is (0 world, 1 country,
 * 2 local) and runs continuously during a move, so each layer can fade on it.
 */
export type View = WorldFrame & { depth: number }

export type Box = { x0: number; y0: number; x1: number; y1: number }

const RAD = Math.PI / 180

/** The frame that fits a set of `lng, lat` points into a box on screen. */
export function fitPoints(points: readonly number[], box: Box): WorldFrame {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let i = 0; i < points.length; i += 2) {
    w = Math.min(w, points[i])
    e = Math.max(e, points[i])
    s = Math.min(s, points[i + 1])
    n = Math.max(n, points[i + 1])
  }

  const lng0 = (w + e) / 2
  const lat0 = (s + n) / 2
  const unit: WorldFrame = { cx: 0, cy: 0, r: 1, lng0, lat0 }

  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (let i = 0; i < points.length; i += 2) {
    const p = project(unit, points[i], points[i + 1])
    x0 = Math.min(x0, p.x)
    x1 = Math.max(x1, p.x)
    y0 = Math.min(y0, p.y)
    y1 = Math.max(y1, p.y)
  }

  const r = Math.min((box.x1 - box.x0) / (x1 - x0), (box.y1 - box.y0) / (y1 - y0))

  return {
    r,
    lng0,
    lat0,
    cx: (box.x0 + box.x1) / 2 - ((x0 + x1) / 2) * r,
    cy: (box.y0 + box.y1) / 2 - ((y0 + y1) / 2) * r,
  }
}

/** The four corners and edge midpoints of `[west, south, east, north]`. */
export function boundsPoints([w, s, e, n]: readonly [number, number, number, number]): number[] {
  const mx = (w + e) / 2
  const my = (s + n) / 2
  return [w, s, mx, s, e, s, e, my, e, n, mx, n, w, n, w, my]
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** A span of the move, eased on its own. */
const span = (t: number, from: number, to: number) => ease(clamp01((t - from) / (to - from)))

/** Shortest way round, so the globe never spins the long way to reach a place. */
function lerpLng(a: number, b: number, t: number): number {
  const d = ((((b - a) % 360) + 540) % 360) - 180
  return a + d * t
}

/** How long a move takes, by how many levels it crosses. */
export function moveDuration(from: View, to: View): number {
  const levels = Math.abs(to.depth - from.depth)
  if (levels < 0.01) return 900
  return 1500 + Math.min(2, levels) * 650
}

/**
 * Where the camera is, `t` of the way through a move.
 *
 * Down from the world, the globe turns first and then the camera approaches,
 * so the turn is seen at a distance and the approach is straight in; coming
 * back reverses it. Between country and local scale the camera keeps the
 * destination on a straight glide to its resting place while it zooms, so
 * it never slides out of view mid-flight.
 */
export function interpolate(from: View, to: View, t: number): View {
  const deeper = to.depth >= from.depth
  const depth = lerp(from.depth, to.depth, deeper ? span(t, 0.28, 1) : span(t, 0, 0.72))
  const fromWorld = Math.min(from.depth, to.depth) < 0.99
  const zoom = fromWorld ? (deeper ? span(t, 0.2, 1) : span(t, 0, 0.8)) : ease(t)
  const r = Math.exp(lerp(Math.log(from.r), Math.log(to.r), zoom))

  if (fromWorld) {
    const turn = deeper ? span(t, 0, 0.58) : span(t, 0.42, 1)
    return {
      cx: lerp(from.cx, to.cx, turn),
      cy: lerp(from.cy, to.cy, turn),
      r,
      lng0: lerpLng(from.lng0, to.lng0, turn),
      lat0: lerp(from.lat0, to.lat0, turn),
      depth,
    }
  }

  // Glide: the deeper view's centre moves in a straight line on screen.
  const focus = deeper ? to : from
  const start = project(from, focus.lng0, focus.lat0)
  const end = project(to, focus.lng0, focus.lat0)
  const sx = lerp(start.x, end.x, zoom)
  const sy = lerp(start.y, end.y, zoom)
  const cx = lerp(from.cx, to.cx, zoom)
  const cy = lerp(from.cy, to.cy, zoom)

  return {
    cx,
    cy,
    r,
    lat0: focus.lat0 - (cy - sy) / (RAD * r),
    lng0: focus.lng0 - (sx - cx) / (RAD * r * Math.cos(focus.lat0 * RAD)),
    depth,
  }
}

/** 0 → 1 as `value` crosses from `a` to `b`, smoothly. */
export function smoothstep(a: number, b: number, value: number): number {
  const t = clamp01((value - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/**
 * The 2D transform that carries the map as drawn in `from` onto where the
 * same geography lies in `to`: `x' = k·x + tx`, `y' = k·y + ty` (origin 0 0).
 *
 * It pins the destination's centre — where it is in `from`, where it will be
 * in `to` — and scales by the change in the sphere's radius. On a globe that
 * is exact at that point and close around it, which is all the eye follows
 * during a quick zoom; the destination itself is then drawn exactly.
 */
export function flightTransform(from: View, to: View, width: number, height: number): { k: number; tx: number; ty: number } {
  const deeper = to.depth >= from.depth
  // Pin the deeper view's centre: the place being zoomed into (or out of).
  const focus = deeper ? to : from
  const inFrom = project(from, focus.lng0, focus.lat0)
  const inTo = project(to, focus.lng0, focus.lat0)
  const k = to.r / from.r
  if (!inFrom.visible || !inTo.visible) {
    return { k, tx: width / 2 - (k * width) / 2, ty: height / 2 - (k * height) / 2 }
  }
  return { k, tx: inTo.x - k * inFrom.x, ty: inTo.y - k * inFrom.y }
}
