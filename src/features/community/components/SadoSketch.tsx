import { at, HEIGHT, WIDTH } from '@/features/community/components/sketchProjection'
import { SADO_MAP } from '@/features/world/geo/sado'
import { cn } from '@/lib/cn'

export type SketchPin =
  | { id: string; kind: 'verified'; lng: number; lat: number }
  | { id: string; kind: 'past'; lng: number; lat: number; photo?: string }
  | { id: string; kind: 'suggested'; lng: number; lat: number; label?: string }
  | { id: string; kind: 'published'; lng: number; lat: number }

/** The coast as one path, built on first use. */
let coastPath: string | null = null
function coast(): string {
  if (coastPath) return coastPath
  const c = SADO_MAP.coast
  let d = ''
  for (let i = 0; i < c.length; i += 2) {
    const p = at(c[i], c[i + 1])
    d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }
  return (coastPath = `${d}Z`)
}

/**
 * Sado in pencil — a field-notebook sketch rather than My World's map (which
 * stays the only place a Touch reveals colour). Each kind of pin has its own
 * mark so they can never be mistaken for one another:
 *
 *   verified   watercolour wash + :)))     (a physical LINKA Touch)
 *   past       a tiny taped photo          (the person's journal)
 *   suggested  a hand-drawn ring           (a Community suggestion)
 *   published  a small stamp               (a suggestion that became LINKA)
 */
export default function SadoSketch({ pins, className, label }: { pins: readonly SketchPin[]; className?: string; label: string }) {
  const [width, height] = [WIDTH, HEIGHT]

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} className={cn('block h-auto w-full', className)}>
      <defs>
        <radialGradient id="sk-wash">
          <stop offset="0" stopColor="#f7e7b4" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#d3e7cd" stopOpacity="0.7" />
          <stop offset="1" stopColor="#d3e7cd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sk-sea">
          <stop offset="0" stopColor="#d6e5ee" stopOpacity="0.55" />
          <stop offset="1" stopColor="#d6e5ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={width / 2} cy={height / 2} rx={width * 0.62} ry={height * 0.6} fill="url(#sk-sea)" />
      <path d={coast()} fill="#fbf8f1" stroke="#6f6860" strokeWidth="0.9" strokeLinejoin="round" opacity="0.9" />
      <path d={coast()} fill="none" stroke="#6f6860" strokeWidth="0.35" strokeLinejoin="round" opacity="0.5" transform="translate(1.2 0.8)" />

      {pins.filter((p) => p.kind === 'verified').map((p) => {
        const { x, y } = at(p.lng, p.lat)
        return <circle key={`w-${p.id}`} cx={x} cy={y} r="26" fill="url(#sk-wash)" />
      })}

      {pins.map((pin) => {
        const { x, y } = at(pin.lng, pin.lat)
        if (pin.kind === 'verified') {
          return (
            <g key={pin.id} transform={`translate(${x} ${y})`}>
              <circle r="3" fill="#33302b" />
              <path d="M5 -3.4a5 5 0 0 1 0 6.8M8.4 -5.6a8.4 8.4 0 0 1 0 11.2" fill="none" stroke="#33302b" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
            </g>
          )
        }
        if (pin.kind === 'past') {
          return (
            <g key={pin.id} transform={`translate(${x} ${y}) rotate(-7)`}>
              <rect x="-9" y="-8" width="18" height="16" fill="#fff" stroke="#d8d0c3" strokeWidth="0.5" />
              {pin.photo ? (
                <image href={pin.photo} x="-7.5" y="-6.5" width="15" height="11" preserveAspectRatio="xMidYMid slice" />
              ) : (
                <rect x="-7.5" y="-6.5" width="15" height="11" fill="#ebe3d6" />
              )}
              <rect x="-5" y="-10" width="10" height="3.4" fill="rgba(240,214,140,0.7)" />
            </g>
          )
        }
        if (pin.kind === 'suggested') {
          return (
            <g key={pin.id} transform={`translate(${x} ${y})`}>
              <path d="M-5.6 0.4a5.6 5.4 0 1 0 1.8 -4.2" fill="none" stroke="#a4543a" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />
              {pin.label && <text x="8" y="3" fontSize="7" fill="#6f6860" fontFamily="ui-sans-serif, system-ui">{pin.label}</text>}
            </g>
          )
        }
        return (
          <g key={pin.id} transform={`translate(${x} ${y}) rotate(-10)`} color="#5f7a55">
            <circle r="6.5" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="9 1.5 12 1" />
            <text y="2.4" textAnchor="middle" fontSize="5.6" fill="currentColor" fontFamily="ui-monospace, monospace">:)))</text>
          </g>
        )
      })}
    </svg>
  )
}
