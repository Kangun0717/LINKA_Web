import type { DoorState } from '@/features/door/doorTimeline'
import { isAtOrAfter } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

/**
 * What is behind the door: light, and the suggestion of somewhere.
 *
 * Deliberately not a place. There is no horizon, no landscape and nothing to
 * recognise — only daylight, a wash of pale sky and a few soft leaf shapes at
 * the edges. Naming the destination would make LINKA a trip to one specific
 * world; leaving it unnamed keeps it the viewer's own. The same restraint is
 * why the foliage is abstract blobs with a drawn contour rather than plants.
 */
export default function WorldBehindDoor({ state }: { state: DoorState }) {
  const isRevealing = isAtOrAfter(state, 'opening')

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 origin-center transition-all duration-[1600ms] ease-door',
        isRevealing ? 'scale-100 opacity-100' : 'scale-[1.06] opacity-95',
      )}
    >
      {/* Sky at the top, giving way to pure daylight at eye level and below. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#d6e5ee_0%,#e6eff2_26%,#f7f4ec_58%,#fffdf7_100%)]" />

      <svg
        viewBox="0 0 184 451"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        focusable="false"
      >
        {/* Foliage: shapes, not species. Filled first, contoured second. */}
        <g className="animate-drift">
          <g fill="#c6d5c2" opacity="0.46">
            <ellipse cx="18" cy="394" rx="38" ry="23" transform="rotate(-24 18 394)" />
            <ellipse cx="2" cy="344" rx="31" ry="18" transform="rotate(-52 2 344)" />
            <ellipse cx="50" cy="428" rx="30" ry="17" transform="rotate(-9 50 428)" />
            <ellipse cx="172" cy="302" rx="33" ry="19" transform="rotate(27 172 302)" />
            <ellipse cx="186" cy="352" rx="27" ry="16" transform="rotate(8 186 352)" />
            <ellipse cx="150" cy="78" rx="23" ry="13" transform="rotate(-19 150 78)" />
          </g>

          <g
            className="ink-line"
            fill="none"
            stroke="#5d6e59"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.3"
          >
            <path d="M-12 380 C6 362, 34 366, 48 386" />
            <path d="M22 424 C40 412, 62 416, 74 430" />
            <path d="M146 292 C160 278, 186 280, 198 294" />
            <path d="M134 82 C144 70, 164 70, 172 80" />
          </g>
        </g>

        {/* Daylight sitting on top of all of it, the way real light does. */}
        <ellipse cx="96" cy="250" rx="130" ry="150" fill="#fffdf7" opacity="0.5" />
      </svg>

      {/* The doorway's own glare, spilling back toward the viewer. */}
      <div className="absolute inset-0 bg-[radial-gradient(76%_54%_at_52%_56%,rgba(255,253,246,0.7)_0%,rgba(255,253,246,0)_72%)]" />
    </div>
  )
}
