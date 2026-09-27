import { cn } from '@/lib/cn'

type TouchMarkProps = {
  /** Carries the soft halo — one place at a time. */
  recent: boolean
  /** The :))) identity comes forward. */
  selected: boolean
  /** Plays the single arrival ripple, once, on mount of this state. */
  arriving: boolean
}

/**
 * A touched place, drawn as the physical Touch Point seen from far away.
 *
 * At rest it is the sticker reduced to its essence: a small white disc with
 * one graphite dot — the `:` of `:)))` collapsed to a point. It is never a
 * pin: nothing points down at the map, because the place is not being
 * marked, it is being remembered. Selecting it lets the three arcs return,
 * which is the only moment the full mark appears on the world.
 */
export default function TouchMark({ recent, selected, arriving }: TouchMarkProps) {
  return (
    <span aria-hidden className="relative block size-3">
      {recent && (
        <span className="absolute -inset-3.5 animate-halo rounded-full bg-[radial-gradient(circle,rgba(255,244,214,0.95)_0%,rgba(255,244,214,0.45)_42%,rgba(255,244,214,0)_72%)]" />
      )}

      {arriving && (
        <span className="absolute inset-0 animate-ripple rounded-full border border-graphite/40 [animation-delay:300ms] opacity-0" />
      )}

      {/* The sticker. */}
      <span
        className={cn(
          'absolute inset-0 rounded-full bg-white/95 shadow-[0_0_0_0.5px_rgba(51,48,43,0.16),0_1px_4px_rgba(92,122,138,0.18)]',
          'transition-transform duration-500 ease-calm',
          selected && 'scale-110',
        )}
      />
      <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-graphite" />

      {/* ))) — only when chosen. */}
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        className={cn(
          'absolute left-[calc(100%+1px)] top-1/2 size-6 -translate-y-1/2 text-graphite transition-all duration-500 ease-calm',
          selected ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0',
        )}
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <path d="M2.5 8.2a5 5 0 0 1 0 7.6" opacity="0.85" />
          <path d="M7 5.6a8.6 8.6 0 0 1 0 12.8" opacity="0.6" />
          <path d="M11.6 3a12.2 12.2 0 0 1 0 18" opacity="0.38" />
        </g>
      </svg>
    </span>
  )
}
