/**
 * Cutting projected geometry down to the screen.
 *
 * Close in, a coastline runs thousands of pixels past the phone's edges. SVG
 * would happily draw it, but every filter on it (the pen, the watercolour
 * edge) is sized to the shape's bounds, so an unclipped coast makes each frame
 * of a zoom rasterise an enormous, invisible canvas. Clipping to a rectangle a
 * little larger than the screen keeps that cost to what can actually be seen.
 */

export type Point = { x: number; y: number }
export type Rect = { x0: number; y0: number; x1: number; y1: number }

type Edge = {
  inside: (p: Point) => boolean
  cross: (a: Point, b: Point) => Point
}

function edgesOf({ x0, y0, x1, y1 }: Rect): Edge[] {
  const atX = (x: number) => (a: Point, b: Point) => ({
    x,
    y: a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x),
  })
  const atY = (y: number) => (a: Point, b: Point) => ({
    x: a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y),
    y,
  })

  return [
    { inside: (p) => p.x >= x0, cross: atX(x0) },
    { inside: (p) => p.x <= x1, cross: atX(x1) },
    { inside: (p) => p.y >= y0, cross: atY(y0) },
    { inside: (p) => p.y <= y1, cross: atY(y1) },
  ]
}

/**
 * Sutherland–Hodgman. A concave outline can come back with slivers running
 * along the rectangle's edge; they are filled, never stroked, and sit outside
 * the screen, so they are never seen.
 */
export function clipPolygon(points: readonly Point[], rect: Rect): Point[] {
  let output = [...points]

  for (const edge of edgesOf(rect)) {
    const input = output
    output = []
    if (input.length === 0) break

    for (let i = 0; i < input.length; i += 1) {
      const current = input[i]
      const previous = input[(i + input.length - 1) % input.length]

      if (edge.inside(current)) {
        if (!edge.inside(previous)) output.push(edge.cross(previous, current))
        output.push(current)
      } else if (edge.inside(previous)) {
        output.push(edge.cross(previous, current))
      }
    }
  }

  return output
}

/** The runs of a line that fall inside the rectangle (a segment is kept whole). */
export function clipPolyline(points: readonly Point[], rect: Rect): Point[][] {
  const runs: Point[][] = []
  let run: Point[] = []

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]

    if (segmentTouches(a, b, rect)) {
      if (run.length === 0) run.push(a)
      run.push(b)
    } else if (run.length > 0) {
      runs.push(run)
      run = []
    }
  }

  if (run.length > 1) runs.push(run)
  return runs
}

function segmentTouches(a: Point, b: Point, { x0, y0, x1, y1 }: Rect): boolean {
  return !(
    (a.x < x0 && b.x < x0) ||
    (a.x > x1 && b.x > x1) ||
    (a.y < y0 && b.y < y0) ||
    (a.y > y1 && b.y > y1)
  )
}

const fmt = (n: number) => n.toFixed(1)
/** Whole pixels, for frames of a move. */
const fmtCoarse = (n: number) => String(Math.round(n))

export function polygonPath(points: readonly Point[], coarse = false): string {
  if (points.length < 3) return ''
  const f = coarse ? fmtCoarse : fmt
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p.x)} ${f(p.y)}`).join('') + 'Z'
}

export function polylinePath(points: readonly Point[], coarse = false): string {
  const f = coarse ? fmtCoarse : fmt
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p.x)} ${f(p.y)}`).join('')
}

/**
 * A closed outline drawn as a smooth curve through its points (Catmull–Rom),
 * so a few dozen hand-placed coordinates read as a drawn coast, not a polygon.
 */
export function smoothClosedPath(points: readonly Point[]): string {
  const n = points.length
  if (n < 3) return ''

  let d = `M${fmt(points[0].x)} ${fmt(points[0].y)}`
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    d += `C${fmt(p1.x + (p2.x - p0.x) / 6)} ${fmt(p1.y + (p2.y - p0.y) / 6)} ${fmt(
      p2.x - (p3.x - p1.x) / 6,
    )} ${fmt(p2.y - (p3.y - p1.y) / 6)} ${fmt(p2.x)} ${fmt(p2.y)}`
  }

  return d + 'Z'
}

/** The same, for an open line. */
export function smoothOpenPath(points: readonly Point[]): string {
  const n = points.length
  if (n < 2) return ''

  let d = `M${fmt(points[0].x)} ${fmt(points[0].y)}`
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]
    d += `C${fmt(p1.x + (p2.x - p0.x) / 6)} ${fmt(p1.y + (p2.y - p0.y) / 6)} ${fmt(
      p2.x - (p3.x - p1.x) / 6,
    )} ${fmt(p2.y - (p3.y - p1.y) / 6)} ${fmt(p2.x)} ${fmt(p2.y)}`
  }

  return d
}
