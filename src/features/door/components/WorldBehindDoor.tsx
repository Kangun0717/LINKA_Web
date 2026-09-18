import type { DoorState } from '@/features/door/doorTimeline'
import { isAtOrAfter } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

/**
 * What is behind the door: not another room.
 *
 * Sky, sea and a distant shore, suggested rather than drawn. The palette here
 * is intentionally the one place LINKA goes bright and cool — the whole point
 * of the entrance is the contrast with the warm dark interior. These tints are
 * local to this component and deliberately not promoted to global tokens.
 */
export default function WorldBehindDoor({ state }: { state: DoorState }) {
  const isRevealing = isAtOrAfter(state, 'opening')

  return (
    <div
      aria-hidden
      className={cn(
        'absolute inset-0 origin-center transition-all duration-[1600ms] ease-door',
        isRevealing ? 'scale-100 opacity-100' : 'scale-[1.12] opacity-90',
      )}
    >
      {/* Sky: cool at the top, warming as it falls toward the horizon. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#a8bac4_0%,#c6cfcd_38%,#e4dccd_66%,#f2e9d8_74%)]" />

      {/* Low sun sitting just off the horizon. */}
      <div className="absolute left-[58%] top-[58%] size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fbf3e2] opacity-80 blur-2xl" />
      <div className="absolute left-[58%] top-[58%] size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fdf8ee] opacity-90 blur-md" />

      {/* Distant land, two depths of haze. */}
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[57%] h-[10%] w-full"
      >
        <path
          d="M0 40 L0 26 Q8 18 15 23 Q22 27 28 19 Q36 9 44 18 Q52 26 60 21 Q70 14 78 22 Q88 31 100 24 L100 40 Z"
          fill="#9aa5a4"
          opacity="0.55"
        />
        <path
          d="M0 40 L0 32 Q12 27 22 31 Q34 36 46 30 Q58 24 70 30 Q84 36 100 31 L100 40 Z"
          fill="#84908f"
          opacity="0.6"
        />
      </svg>

      {/* Horizon: the brightest line in the composition. */}
      <div className="absolute inset-x-0 top-[66.5%] h-px bg-[#fdf6e8] opacity-80" />

      {/* Sea. */}
      <div className="absolute inset-x-0 bottom-0 top-[66.5%] bg-[linear-gradient(to_bottom,#aebfc4_0%,#8ea3ab_40%,#6f858f_100%)]" />

      {/* A single specular streak so the water reads as water. */}
      <div className="absolute left-[58%] top-[68%] h-[22%] w-10 -translate-x-1/2 bg-[linear-gradient(to_bottom,#fdf6e8_0%,rgba(253,246,232,0)_100%)] opacity-40 blur-[2px]" />

      {/* Light spilling back toward the viewer through the opening. */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_60%,rgba(255,250,240,0.35)_0%,rgba(255,250,240,0)_70%)]" />
    </div>
  )
}
