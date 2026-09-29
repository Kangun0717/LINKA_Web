import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * The field-notebook vocabulary of Community and the Journal: paper, ink
 * stamps, postcards, washi tape and drawn covers. Quiet, warm, and still
 * LINKA's paper and graphite — a travel notebook, not a feed. Nothing here
 * uses SVG filters (costly in WebKit): texture is one pre-rendered image.
 */

/** Paper tooth, rendered once as an image (the same grain the local map uses). */
export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 0.07 0"/></filter><rect width="220" height="220" filter="url(#n)"/></svg>',
)}")`

/** A page of warm paper with a faint tooth. */
export function Paper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative min-h-full bg-paper-lit', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: GRAIN }} />
      <div className="relative">{children}</div>
    </div>
  )
}

/** A section title: the reader's language first, the other script small beneath. */
export function NoteHeading({ title, second, action }: { title: string; second?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[1.02rem] font-light tracking-[0.08em] text-graphite">{title}</h2>
        {second && <p className="mt-0.5 text-[0.54rem] uppercase tracking-[0.22em] text-graphite-soft">{second}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * A round ink stamp — :))) at its heart, words around the rim. Worn a little
 * (broken rings), pressed at a slight angle, never perfectly placed.
 */
export function Stamp({
  top,
  bottom,
  size = 76,
  tone = 'graphite',
  angle = -9,
  className,
}: {
  top: string
  bottom?: string
  size?: number
  tone?: 'graphite' | 'rust' | 'moss'
  angle?: number
  className?: string
}) {
  const colour = { graphite: '#3b3731', rust: '#a4543a', moss: '#5f7a55' }[tone]
  const id = `arc-${top.length}-${size}-${tone}`
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0 select-none', className)}
      style={{ transform: `rotate(${angle}deg)`, color: colour, opacity: 0.82 }}
    >
      <defs>
        <path id={`${id}-t`} d="M 17 50 A 33 33 0 0 1 83 50" />
        <path id={`${id}-b`} d="M 20 54 A 30 30 0 0 0 80 54" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="60 3 90 2 70 4 50 2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="40 2 55 3 80 2" />
      <text fontSize="8.4" letterSpacing="1.6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">
        <textPath href={`#${id}-t`} startOffset="50%" textAnchor="middle">{top}</textPath>
      </text>
      <text x="50" y="55" textAnchor="middle" fontSize="15" fill="currentColor" fontFamily="ui-monospace, monospace" letterSpacing="-1">:)))</text>
      {bottom && (
        <text fontSize="7.4" letterSpacing="1.2" fill="currentColor" fontFamily="ui-sans-serif, system-ui">
          <textPath href={`#${id}-b`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">{bottom}</textPath>
        </text>
      )}
    </svg>
  )
}

/** A photograph printed as a postcard / instant print: a white margin, a soft shadow, a slight tilt. */
export function Postcard({
  src,
  alt,
  tilt = 0,
  ratio = '4 / 3',
  caption,
  className,
  children,
}: {
  src: string | null
  alt: string
  tilt?: number
  ratio?: string
  caption?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <figure
      className={cn('relative bg-white p-[5px] pb-2 shadow-[0_1px_2px_rgba(51,48,43,0.12),0_10px_24px_-12px_rgba(51,48,43,0.35)]', className)}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="block w-full object-cover" style={{ aspectRatio: ratio }} />
      ) : (
        <div className="w-full" style={{ aspectRatio: ratio }}>{children}</div>
      )}
      {caption && <figcaption className="px-1 pt-1.5 text-[0.62rem] leading-snug tracking-[0.04em] text-graphite-soft">{caption}</figcaption>}
    </figure>
  )
}

/** A strip of washi tape holding something to the page. */
export function Tape({ tone = 'sun', className, style }: { tone?: 'sun' | 'meadow' | 'mist' | 'rose'; className?: string; style?: CSSProperties }) {
  const colour = { sun: 'rgba(240,214,140,0.62)', meadow: 'rgba(182,212,172,0.66)', mist: 'rgba(176,206,222,0.66)', rose: 'rgba(232,186,176,0.62)' }[tone]
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute block h-4 w-16', className)}
      style={{
        background: `repeating-linear-gradient(90deg, ${colour} 0 6px, ${colour.replace(/0\.6\d\)/, '0.5)')} 6px 8px)`,
        clipPath: 'polygon(2% 12%, 7% 0, 13% 10%, 90% 4%, 96% 0, 100% 16%, 98% 88%, 93% 100%, 86% 90%, 10% 96%, 4% 100%, 0 84%)',
        ...style,
      }}
    />
  )
}

/**
 * A cover for something that has no photograph yet: a watercolour wash, a
 * few pencil lines and its name — drawn, never borrowed from somewhere else.
 */
export function SketchCover({ title, note, seed = 1, className }: { title: string; note?: string; seed?: number; className?: string }) {
  const hue = ['#d3e7cd', '#f7e7b4', '#d6e5ee', '#ead9cf'][seed % 4]
  const r = 38 + (seed % 3) * 6
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#f6f1e8]', className)}>
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: GRAIN }} />
      <div
        aria-hidden
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 opacity-80"
        style={{ width: `${r * 2}%`, aspectRatio: '1.4', background: `radial-gradient(closest-side, ${hue} 0%, ${hue}cc 55%, transparent 100%)`, borderRadius: '46% 54% 58% 42% / 52% 44% 56% 48%' }}
      />
      <svg aria-hidden viewBox="0 0 200 150" className="absolute inset-0 h-full w-full text-graphite/35" preserveAspectRatio="none">
        <path d={`M 18 ${104 + (seed % 5)} C 60 ${92 - seed}, 110 ${118 + seed}, 182 ${98 + (seed % 7)}`} fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d={`M 30 ${112 + (seed % 4)} C 80 ${104}, 120 ${124 - (seed % 6)}, 170 ${110}`} fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-x-3 bottom-2.5">
        <p lang="ja" className="truncate text-[0.82rem] tracking-[0.06em] text-graphite/80">{title}</p>
        {note && <p className="text-[0.52rem] tracking-[0.12em] text-graphite-faint">{note}</p>}
      </div>
    </div>
  )
}
