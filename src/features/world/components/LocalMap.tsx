import { useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import type { LocalMapData } from '@/features/world/geo/atlas'
import { polygonPath, smoothClosedPath, smoothOpenPath } from '@/features/world/geo/clip'
import { kmToPx, projectCoords } from '@/features/world/geo/draw'
import { project, type WorldFrame } from '@/features/world/geo/orthographic'

/** A touched place on the local map: where its pocket of colour opens from. */
export type Pocket = { id: string; lng: number; lat: number; variant: number }

type LocalMapProps = {
  width: number
  height: number
  frame: WorldFrame
  map: LocalMapData
  pockets: readonly Pocket[]
  /** 0 → 1: the warm paper coming in underneath. */
  paper: number
  /** 0 → 1: the island's own line coming up on the paper. */
  ink: number
  /** The camera has arrived; the island may resolve and its pockets open. */
  resolved: boolean
}

/** Graphite, and the Door's leaf green. */
const INK = '#3a352f'
const LEAF = '#5d6e59'
const LEAF_WASH = '#c6d5c2'
/** 朱鷺色 — the pale pink of a toki's wing. */
const TOKI = '#efc2b1'
/** A warm grey for the untouched sea's edge: the shape of the water, without its colour. */
const SHORE = '#d8d3ca'

const EDGE_SEEDS = [3, 17, 43] as const

/**
 * The local map: an island drawn by hand on warm paper.
 *
 * The whole island is already there — its hills, woods, fields, roads and
 * water, drawn in pencil, readable and quiet. Nothing about it is hidden.
 * What a touch changes is colour: around each place the user has physically
 * touched, a pocket of the island takes its colour — leaf green, blue water,
 * warm fields — with the same watercolour edge as the globe's washes. Where
 * touches sit close together the pockets overlap and join, so over the years
 * the pencil island becomes, piece by piece, the user's own.
 */
export default function LocalMap({
  width,
  height,
  frame,
  map,
  pockets,
  paper,
  ink,
  resolved,
}: LocalMapProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${uid}-${name}`
  const url = (name: string) => `url(#${id(name)})`

  const reach = kmToPx(frame, map.pocketKm)
  const coast = useMemo(() => smoothClosedPath(projectCoords(frame, map.coast)), [frame, map])
  const placed = pockets.map((pocket) => ({ ...pocket, ...project(frame, pocket.lng, pocket.lat) }))

  // The island's detail is drawn once the camera has arrived — never during
  // the move in — and is kept where it was while the camera leaves again.
  const [detailFrame, setDetailFrame] = useState<WorldFrame | null>(resolved ? frame : null)
  if (resolved && detailFrame !== frame) setDetailFrame(frame)
  const detail = useMemo(() => (detailFrame ? drawDetail(detailFrame, map) : null), [detailFrame, map])

  return (
    <div aria-hidden className="absolute inset-0" style={{ opacity: paper }}>
      {/* Paper: warm, contemporary, with the lightest tooth. */}
      <div className="absolute inset-0 bg-[#f8f4ec]" />
      <div className="absolute inset-0 opacity-[0.55] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        focusable="false"
      >
        <defs>
          <filter id={id('pen')} x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={id('pen-fine')} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="29" />
            <feDisplacementMap in="SourceGraphic" scale="1.3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={id('bleed')} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          {EDGE_SEEDS.map((seed, i) => (
            <filter key={seed} id={id(`edge-${i}`)} x="-35%" y="-35%" width="170%" height="170%">
              <feTurbulence type="fractalNoise" baseFrequency="0.024" numOctaves="3" seed={seed} />
              <feDisplacementMap in="SourceGraphic" scale="26" xChannelSelector="R" yChannelSelector="G" />
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          ))}

          <radialGradient id={id('pool')}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.62" stopColor="#fff" stopOpacity="0.92" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('hole')}>
            <stop offset="0" stopColor="#000" />
            <stop offset="0.62" stopColor="#000" stopOpacity="0.92" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('wash')}>
            <stop offset="0" stopColor={LEAF_WASH} stopOpacity="0.78" />
            <stop offset="0.7" stopColor={LEAF_WASH} stopOpacity="0.46" />
            <stop offset="1" stopColor={LEAF_WASH} stopOpacity="0" />
          </radialGradient>

          <clipPath id={id('land')}>
            <path d={coast} />
          </clipPath>

          {/* Where colour has come in… */}
          <mask id={id('pocket')} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            <rect width={width} height={height} fill="#000" />
            {placed.map((pocket) => (
              <g key={pocket.id} style={opening(pocket, resolved)}>
                <circle cx={pocket.x} cy={pocket.y} r={reach} fill={url('pool')} filter={url(`edge-${pocket.variant}`)} />
              </g>
            ))}
          </mask>
          {/* …and, exactly opposite, where the island is still in pencil. */}
          <mask id={id('pencil')} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            <rect width={width} height={height} fill="#fff" />
            {placed.map((pocket) => (
              <g key={pocket.id} style={opening(pocket, resolved)}>
                <circle cx={pocket.x} cy={pocket.y} r={reach} fill={url('hole')} filter={url(`edge-${pocket.variant}`)} />
              </g>
            ))}
          </mask>
        </defs>

        <g style={{ opacity: ink }}>
          {/* The sea's edge: warm grey where untouched. */}
          <path d={coast} fill="none" stroke={SHORE} strokeWidth="9" opacity="0.5" filter={url('bleed')} />
          <path d={coast} fill="#fbf8f2" />

          {/* The whole island, in pencil. */}
          {detail && (
            <g mask={url('pencil')}>
              <Stage resolved={resolved} delay={0} duration={900}>
                <Features detail={detail} url={url} colour={false} />
              </Stage>
            </g>
          )}

          {/* Watercolour where a touch has been, spreading from the place itself. */}
          <g clipPath={url('land')}>
            {placed.map((pocket) => (
              <g key={pocket.id} style={opening(pocket, resolved)}>
                <circle
                  cx={pocket.x}
                  cy={pocket.y}
                  r={reach * 0.98}
                  fill={url('wash')}
                  filter={url(`edge-${pocket.variant}`)}
                />
                <circle cx={pocket.x} cy={pocket.y} r={reach * 0.3} fill="var(--color-sun)" opacity="0.55" filter={url('bleed')} />
              </g>
            ))}
          </g>

          {/* The same island in colour, only where it has been lived. */}
          {detail && placed.length > 0 && (
            <g mask={url('pocket')}>
              <Stage resolved={resolved} delay={250}>
                <path d={coast} fill="none" stroke="var(--color-mist-deep)" strokeWidth="14" opacity="0.55" filter={url('bleed')} />
              </Stage>
              <Stage resolved={resolved} delay={450}>
                <Features detail={detail} url={url} colour />
              </Stage>
            </g>
          )}

          {/* The coast, last and on top: the one line that is always there. */}
          <path
            d={coast}
            fill="none"
            stroke={INK}
            strokeOpacity="0.5"
            strokeWidth="1.05"
            strokeLinejoin="round"
            filter={url('pen')}
          />
        </g>
      </svg>
    </div>
  )
}

type Detail = NonNullable<ReturnType<typeof drawDetail>>

/**
 * Everything drawn on the island, in one of two hands: pencil for what exists,
 * colour for what has been lived. Same lines, same places — only the ink differs.
 */
function Features({
  detail,
  url,
  colour,
}: {
  detail: Detail
  url: (name: string) => string
  colour: boolean
}) {
  return (
    <>
      <g
        clipPath={url('land')}
        fill="none"
        stroke={INK}
        strokeOpacity={colour ? 0.17 : 0.13}
        strokeWidth="0.8"
        strokeDasharray="22 5 7 5"
        strokeLinecap="round"
        filter={url('pen')}
      >
        {detail.contours.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {detail.lakes.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={colour ? 'var(--color-mist)' : '#f2efe8'}
          fillOpacity={colour ? 0.8 : 1}
          stroke={INK}
          strokeOpacity={colour ? 0.28 : 0.3}
          strokeWidth="0.8"
          filter={url('pen-fine')}
        />
      ))}
      <g
        fill="none"
        stroke={colour ? '#8fb3c6' : INK}
        strokeOpacity={colour ? 0.9 : 0.24}
        strokeWidth="1.1"
        strokeLinecap="round"
        filter={url('pen-fine')}
      >
        {detail.rivers.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {detail.fields.map((field, i) => (
        <g key={i}>
          {colour && (
            <path
              d={field.d}
              fill={field.fill === 'sun' ? 'var(--color-sun)' : 'var(--color-meadow)'}
              opacity={field.fill ? 0.9 : 0.5}
            />
          )}
          <path
            d={field.d}
            fill="none"
            stroke={INK}
            strokeOpacity={colour ? 0.34 : 0.26}
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          {field.rows.map((row, k) => (
            <path key={k} d={row} stroke={colour ? LEAF : INK} strokeOpacity={colour ? 0.36 : 0.18} strokeWidth="0.6" />
          ))}
        </g>
      ))}

      <g filter={url('pen-fine')}>
        {detail.trees.map((tree, i) => (
          <g key={i}>
            {colour && (
              <ellipse
                cx={tree.x}
                cy={tree.y - tree.s * 0.35}
                rx={tree.s * 1.05}
                ry={tree.s * 0.78}
                fill={LEAF_WASH}
                opacity={tree.filled ? 0.85 : 0.55}
              />
            )}
            <path
              d={`M${tree.x - tree.s} ${tree.y}a${tree.s} ${tree.s * 0.95} 0 0 1 ${tree.s * 2} 0`}
              fill="none"
              stroke={colour ? LEAF : INK}
              strokeOpacity={colour ? 0.62 : 0.3}
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      <g
        fill="none"
        stroke={INK}
        strokeOpacity={colour ? 0.42 : 0.3}
        strokeWidth="0.9"
        strokeLinecap="round"
        filter={url('pen-fine')}
      >
        {detail.roads.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {detail.motifs.map((motif, i) => (
        <Toki key={i} x={motif.x} y={motif.y} colour={colour} />
      ))}
    </>
  )
}

/** Projects the whole island's detail for one resting frame. */
function drawDetail(frame: WorldFrame, map: LocalMapData) {
  const px = kmToPx(frame, 1)

  return {
    contours: map.contours.map((loop) => smoothClosedPath(projectCoords(frame, loop))),
    lakes: map.lakes.map((lake) => smoothClosedPath(projectCoords(frame, lake))),
    rivers: map.rivers.map((line) => smoothOpenPath(projectCoords(frame, line))),
    roads: map.roads.map((line) => smoothOpenPath(projectCoords(frame, line))),
    trees: map.trees.map((tree) => ({
      ...project(frame, tree.lng, tree.lat),
      s: tree.size * 0.5 * px,
      filled: tree.filled,
    })),
    fields: map.fields.map((field) => {
      const [a, b, c, d] = projectCoords(frame, field.corners)
      const rows = Array.from({ length: field.rows }, (_, k) => {
        const t = (k + 1) / (field.rows + 1)
        const from = { x: a.x + (d.x - a.x) * t, y: a.y + (d.y - a.y) * t }
        const to = { x: b.x + (c.x - b.x) * t, y: b.y + (c.y - b.y) * t }
        return `M${from.x.toFixed(1)} ${from.y.toFixed(1)}L${to.x.toFixed(1)} ${to.y.toFixed(1)}`
      })
      return { d: polygonPath([a, b, c, d]), fill: field.fill, rows }
    }),
    motifs: map.motifs.map((motif) => project(frame, motif.lng, motif.lat)),
  }
}

/** A pocket opens from its own centre; closed, it is a speck. */
function opening(pocket: { x: number; y: number }, open: boolean): CSSProperties {
  return {
    transformOrigin: `${pocket.x}px ${pocket.y}px`,
    transform: open ? 'scale(1)' : 'scale(0.18)',
    opacity: open ? 1 : 0,
    transition: `transform 2600ms var(--ease-calm) 350ms, opacity 1400ms var(--ease-calm) 350ms`,
  }
}

function Stage({
  resolved,
  delay,
  duration = 1100,
  children,
}: {
  resolved: boolean
  delay: number
  duration?: number
  children: ReactNode
}) {
  return (
    <g
      style={{
        opacity: resolved ? 1 : 0,
        transition: resolved ? `opacity ${duration}ms var(--ease-calm) ${delay}ms` : 'opacity 300ms',
      }}
    >
      {children}
    </g>
  )
}

/**
 * A toki in flight, the size of a word — the park's one illustrated sign.
 * Graphite line; once the place is touched, the pale pink under its wings
 * that gave the colour its name.
 */
function Toki({ x, y, colour }: { x: number; y: number; colour: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* the wings, raised, washed underneath with toki pink */}
      <path d="M-1.5 -0.6C-3.4 -4.6 -7 -7.6 -12 -8.4C-9.4 -5.6 -6.8 -2.4 -5.4 0.2Z" fill={colour ? TOKI : 'none'} />
      <path d="M0.4 -0.8C0.2 -4.6 2 -8 5.2 -10C4.6 -6.6 3.8 -3.2 2.6 -0.4Z" fill={colour ? TOKI : 'none'} opacity="0.75" />
      <g
        fill="none"
        stroke={INK}
        strokeOpacity={colour ? 0.66 : 0.4}
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M-1.5 -0.6C-3.4 -4.6 -7 -7.6 -12 -8.4C-9.4 -5.6 -6.8 -2.4 -5.4 0.2" />
        <path d="M0.4 -0.8C0.2 -4.6 2 -8 5.2 -10" />
        {/* body, neck, and the long bill curving down */}
        <path d="M-7.4 0.4C-4 1.4 0.6 1.2 4.2 0.2C5.4 -0.1 6.4 -0.2 7.2 0.3" />
        <path d="M7.2 0.3C8.6 1 9.6 2.3 10.2 4" />
        {/* legs, trailing */}
        <path d="M-7.2 0.5L-10.8 1.6" />
      </g>
    </g>
  )
}

/** Paper tooth: fine noise, rendered once as an image rather than every frame. */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 0.09 0"/></filter><rect width="220" height="220" filter="url(#n)"/></svg>',
)}")`
