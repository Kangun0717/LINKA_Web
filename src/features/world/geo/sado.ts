import type { LocalMapData } from '@/features/world/geo/atlas'

/**
 * 佐渡 Sado, drawn by hand for the local map.
 *
 * The coast is traced from reference at roughly a kilometre's accuracy — the
 * two mountain ranges, the Kuninaka plain between them and the two bays that
 * pinch it — which is all a drawn map needs to be recognisably Sado. Nothing
 * here says where anyone has been: it is the whole island, and only a touch
 * decides which part of it is ever shown.
 *
 * Features are placed in real coordinates so they stay attached to the coast
 * through every zoom, but they are drawn as marks at a fixed size — a field
 * is a small sketched field, not a survey of one.
 */

/** Clockwise from Hajiki-zaki, the northern tip: `lng, lat, lng, lat, …`. */
const COAST_TRACE = [
  138.505, 38.332, 138.528, 38.312, 138.536, 38.285, 138.531, 38.254, 138.519, 38.222, 138.503,
  38.19, 138.489, 38.16, 138.478, 38.132, 138.468, 38.11, 138.46, 38.097, 138.446, 38.086,
  // 両津湾 Ryōtsu Bay, a wide bowl opening to the north-east
  138.452, 38.077, 138.465, 38.067, 138.483, 38.061, 138.505, 38.061, 138.529, 38.065, 138.553,
  38.07, 138.572, 38.074,
  // 小佐渡 Kosado, east coast down to 小木 Ogi
  138.566, 38.052, 138.549, 38.024, 138.53, 37.996, 138.512, 37.965, 138.497, 37.935, 138.484,
  37.905, 138.467, 37.886, 138.44, 37.868, 138.405, 37.852, 138.368, 37.838, 138.33, 37.824,
  138.297, 37.812, 138.27, 37.806, 138.246, 37.812, 138.222, 37.822, 138.205, 37.836,
  // Kosado's west coast, into 真野湾 Mano Bay
  138.214, 37.855, 138.235, 37.878, 138.258, 37.905, 138.28, 37.933, 138.303, 37.955, 138.322,
  37.984, 138.333, 38.004, 138.335, 38.02, 138.323, 38.032, 138.301, 38.037, 138.276, 38.038,
  138.252, 38.038,
  // 大佐渡 Osado, the west coast back up to the north
  138.238, 38.046, 138.237, 38.062, 138.243, 38.085, 138.258, 38.115, 138.279, 38.146, 138.305,
  38.178, 138.336, 38.21, 138.37, 38.242, 138.402, 38.27, 138.432, 38.295, 138.462, 38.318,
  138.485, 38.33,
] as const

/** 加茂湖 Lake Kamo, behind Ryōtsu. */
const KAMO_LAKE = [
  138.436, 38.09, 138.445, 38.095, 138.452, 38.103, 138.451, 38.112, 138.444, 38.116, 138.437,
  38.109, 138.433, 38.099,
]

/** The spines of the two ranges. Contours are drawn around them. */
const RIDGES = [
  [138.275, 38.075, 138.315, 38.125, 138.355, 38.17, 138.4, 38.215, 138.445, 38.262, 138.49, 38.305],
  [138.235, 37.845, 138.29, 37.88, 138.35, 37.915, 138.41, 37.95, 138.47, 37.99, 138.53, 38.035],
]

/** How far each range spreads either side of its spine, km. */
const RIDGE_REACH = [5.2, 4.2]

const ROADS = [
  // Ryōtsu → across the plain → Sawata → down Mano Bay toward Ogi
  [
    138.446, 38.084, 138.425, 38.07, 138.4, 38.058, 138.37, 38.045, 138.345, 38.033, 138.323,
    38.022, 138.308, 37.992, 138.29, 37.957, 138.274, 37.926, 138.276, 37.872, 138.29, 37.822,
  ],
  // Sawata → Aikawa
  [138.323, 38.022, 138.298, 38.043, 138.272, 38.049, 138.25, 38.045],
]

/** 国府川 the Kokufu, crossing the plain to Mano Bay. */
const RIVERS = [
  [138.482, 38.036, 138.456, 38.045, 138.422, 38.046, 138.39, 38.039, 138.36, 38.03, 138.331, 38.02],
]

/** The plain, where the fields are. */
const PLAIN = [
  138.325, 38.034, 138.36, 38.029, 138.4, 38.04, 138.44, 38.054, 138.466, 38.066, 138.45, 38.079,
  138.428, 38.082, 138.4, 38.074, 138.365, 38.062, 138.335, 38.053, 138.303, 38.047, 138.298,
  38.04,
]

/** トキの森公園 — the forest the toki live in. */
const PARK = { lng: 138.444, lat: 38.063 }

// ─── generation ──────────────────────────────────────────────────────────────

const ORIGIN = { lng: 138.4, lat: 38.06 }
const KM_LNG = 111.32 * Math.cos((ORIGIN.lat * Math.PI) / 180)
const KM_LAT = 110.57

type Km = { x: number; y: number }

const toKm = (lng: number, lat: number): Km => ({
  x: (lng - ORIGIN.lng) * KM_LNG,
  y: (lat - ORIGIN.lat) * KM_LAT,
})
const fromKm = ({ x, y }: Km) => ({ lng: ORIGIN.lng + x / KM_LNG, lat: ORIGIN.lat + y / KM_LAT })

function pairs(ring: readonly number[]): Km[] {
  const out: Km[] = []
  for (let i = 0; i < ring.length; i += 2) out.push(toKm(ring[i], ring[i + 1]))
  return out
}

/**
 * The traced coast is a clean outline; a real one is not. Walk it in short
 * steps and let it wander a few hundred metres either side, with a noise that
 * has long swells and small coves, so the drawn coast has capes and inlets.
 */
function roughen(trace: readonly number[]): number[] {
  const points = pairs(trace)
  const out: number[] = []
  let walked = 0

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    const steps = Math.max(1, Math.round(length / 0.55))
    const nx = -(b.y - a.y) / (length || 1)
    const ny = (b.x - a.x) / (length || 1)

    for (let k = 0; k < steps; k += 1) {
      const t = k / steps
      const s = walked + length * t
      const wander =
        0.42 * Math.sin(s / 2.9 + 0.7) + 0.22 * Math.sin(s / 1.15 + 2.1) + 0.1 * Math.sin(s / 0.47 + 4.4)
      const { lng, lat } = fromKm({ x: a.x + (b.x - a.x) * t + nx * wander, y: a.y + (b.y - a.y) * t + ny * wander })
      out.push(Number(lng.toFixed(4)), Number(lat.toFixed(4)))
    }
    walked += length
  }

  return out
}

const COAST = roughen(COAST_TRACE)

function inside(p: Km, ring: readonly Km[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit
  }
  return hit
}

function distanceToLine(p: Km, line: readonly Km[], closed = false): number {
  let best = Infinity
  const n = closed ? line.length : line.length - 1
  for (let i = 0; i < n; i += 1) {
    const a = line[i]
    const b = line[(i + 1) % line.length]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)))
  }
  return best
}

/** Deterministic, so the island looks the same every time it is drawn. */
function random(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const coastKm = pairs(COAST)
const plainKm = pairs(PLAIN)
const lakeKm = pairs(KAMO_LAKE)
const ridgesKm = RIDGES.map(pairs)
const parkKm = toKm(PARK.lng, PARK.lat)

function onLand(p: Km, inset: number): boolean {
  return inside(p, coastKm) && distanceToLine(p, coastKm, true) > inset && !inside(p, lakeKm)
}

/** Woods on the two ranges, thinning toward the plain, and the park's own forest. */
type Tree = LocalMapData['trees'][number]
type Field = LocalMapData['fields'][number]

function plantTrees(): Tree[] {
  const rand = random(1981)
  const trees: Tree[] = []
  const plant = (p: Km) => {
    const { lng, lat } = fromKm(p)
    trees.push({ lng, lat, size: 0.8 + rand() * 0.45, filled: rand() < 0.45 })
  }

  for (let y = -30; y <= 31; y += 1.25) {
    for (let x = -18; x <= 16; x += 1.3) {
      const p = { x: x + (rand() - 0.5) * 0.9, y: y + (rand() - 0.5) * 0.9 }
      if (!onLand(p, 0.7) || inside(p, plainKm)) continue

      const reach = Math.max(
        ...ridgesKm.map((ridge, i) => 1 - distanceToLine(p, ridge) / RIDGE_REACH[i]),
      )
      if (rand() < 0.62 * reach + 0.04) plant(p)
    }
  }

  for (let y = -1.5; y <= 1.5; y += 0.62) {
    for (let x = -1.6; x <= 1.6; x += 0.7) {
      const p = { x: parkKm.x + x + (rand() - 0.5) * 0.3, y: parkKm.y + y + (rand() - 0.5) * 0.3 }
      if (Math.hypot(x, y) < 1.6 && onLand(p, 0.3) && rand() < 0.9) plant(p)
    }
  }

  return trees
}

/** A loose grid of paddies, laid along the plain rather than along north. */
function layFields(): Field[] {
  const rand = random(417)
  const fields: Field[] = []
  const from = toKm(138.33, 38.032)
  const to = toKm(138.455, 38.074)
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const u = { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
  const v = { x: -u.y, y: u.x }

  for (let a = 0; a <= length; a += 1.75) {
    for (let b = -3.2; b <= 3.2; b += 1.25) {
      const along = a + (rand() - 0.5) * 0.4
      const across = b + (rand() - 0.5) * 0.3
      const centre = { x: from.x + u.x * along + v.x * across, y: from.y + u.y * along + v.y * across }

      if (!inside(centre, plainKm) || !onLand(centre, 0.8)) continue
      if (Math.hypot(centre.x - parkKm.x, centre.y - parkKm.y) < 1.7) continue
      if (rand() > 0.72) continue

      // A field of about 1.2 × 0.75 km, leaning a little off square.
      const lean = (rand() - 0.5) * 0.25
      const corner = (du: number, dv: number) => {
        const { lng, lat } = fromKm({
          x: centre.x + u.x * (du + dv * lean) + v.x * dv,
          y: centre.y + u.y * (du + dv * lean) + v.y * dv,
        })
        return [lng, lat]
      }
      const tint = rand()
      fields.push({
        corners: [...corner(-0.62, -0.38), ...corner(0.62, -0.38), ...corner(0.62, 0.38), ...corner(-0.62, 0.38)],
        fill: tint < 0.32 ? 'meadow' : tint < 0.48 ? 'sun' : null,
        rows: Math.floor(rand() * 4),
      })
    }
  }

  return fields
}

/**
 * Contours: loops drawn around each range's spine, a little irregular so they
 * never read as a buffer. They exist in real coordinates, like the coast.
 */
function drawContours(): number[][] {
  const loops: number[][] = []

  ridgesKm.forEach((ridge, r) => {
    const spine = densify(ridge, 0.8)
    const reach = RIDGE_REACH[r]

    ;[0.34, 0.68].forEach((level, k) => {
      const ring: Km[] = []
      const offset = (i: number, side: number) =>
        reach * level * (1 + 0.22 * Math.sin(i * 0.9 + k * 2.1 + side * 1.3 + r))

      // Down one side of the spine and back up the other, with rounded ends.
      for (const side of [1, -1]) {
        const run = side === 1 ? spine : [...spine].reverse()
        run.forEach((p, i) => {
          const q = run[Math.min(run.length - 1, i + 1)]
          const o = run[Math.max(0, i - 1)]
          const dx = q.x - o.x
          const dy = q.y - o.y
          const len = Math.hypot(dx, dy) || 1
          const d = offset(side === 1 ? i : spine.length - 1 - i, side)
          ring.push({ x: p.x - (dy / len) * d, y: p.y + (dx / len) * d })
        })
      }

      const kept = ring.filter((p) => inside(p, coastKm))
      if (kept.length > 6) loops.push(kept.flatMap((p) => { const { lng, lat } = fromKm(p); return [lng, lat] }))
    })
  })

  return loops
}

function densify(line: readonly Km[], step: number): Km[] {
  const out: Km[] = []
  for (let i = 0; i < line.length - 1; i += 1) {
    const a = line[i]
    const b = line[i + 1]
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / step))
    for (let k = 0; k < n; k += 1) {
      out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n })
    }
  }
  out.push(line[line.length - 1])
  return out
}

/**
 * The island. Its coast is needed as soon as Japan is drawn, but the woods,
 * fields and contours only once Sado itself is opened — and generating them
 * is the costliest thing My World does at start-up — so each is made on
 * first use and kept.
 */
let trees: Tree[] | null = null
let fields: Field[] | null = null
let contours: number[][] | null = null

export const SADO_MAP: LocalMapData = {
  coast: COAST,
  lakes: [KAMO_LAKE],
  get contours() {
    return (contours ??= drawContours())
  },
  roads: ROADS,
  rivers: RIVERS,
  get trees() {
    return (trees ??= plantTrees())
  },
  get fields() {
    return (fields ??= layFields())
  },
  motifs: [{ kind: 'toki', lng: 138.412, lat: 38.086 }],
  pocketKm: 10.5,
}
