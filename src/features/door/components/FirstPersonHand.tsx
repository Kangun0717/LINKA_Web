import type { DoorState } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

/**
 * The first-person hand.
 *
 * A silhouette with a warm rim light, not an illustration of a hand — anatomy
 * detail is what makes these read as cartoons. It holds no phone: the viewer's
 * real phone performed the physical Touch, and this is the digital self
 * answering by taking the handle.
 */
export default function FirstPersonHand({ state }: { state: DoorState }) {
  const isReaching = state === 'reaching'
  const isGripping = state === 'opening'
  const isVisible = isReaching || isGripping

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 transition-all ease-door',
        isGripping ? 'duration-[1450ms]' : 'duration-[800ms]',
        isReaching && 'translate-y-[6%] opacity-100',
        isGripping && 'translate-y-0 opacity-100',
        !isVisible && 'translate-y-[46%] opacity-0',
      )}
    >
      <svg
        viewBox="0 0 390 780"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id="linka-hand-rim" x1="0" y1="1" x2="0.4" y2="0">
            <stop offset="0%" stopColor="#e2b271" stopOpacity="0" />
            <stop offset="65%" stopColor="#e2b271" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f2ece2" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Rim light: the same forms, nudged toward the doorway's glow. */}
        <g
          transform="translate(-3.5,-4)"
          fill="none"
          stroke="url(#linka-hand-rim)"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M300 800 L288 640" strokeWidth="84" />
          <path d="M286 650 L280 582" strokeWidth="103" />
          <path d="M261 590 L268 470" strokeWidth="29" />
          <path d="M282 584 L288 452" strokeWidth="29" />
          <path d="M303 588 L309 462" strokeWidth="28" />
          <path d="M321 598 L331 492" strokeWidth="26" />
          <path d="M258 612 L214 572" strokeWidth="31" />
        </g>

        {/* The hand itself: one flat mass, barely separated from the room. */}
        <g
          fill="#080706"
          stroke="#080706"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M300 800 L288 640" strokeWidth="78" />
          <path d="M286 650 L280 582" strokeWidth="97" />
          <path d="M261 590 L268 470" strokeWidth="25" />
          <path d="M282 584 L288 452" strokeWidth="25" />
          <path d="M303 588 L309 462" strokeWidth="24" />
          <path d="M321 598 L331 492" strokeWidth="22" />
          <path d="M258 612 L214 572" strokeWidth="27" />
        </g>

        {/* Two hairlines for knuckles — any more and it becomes a drawing. */}
        <g stroke="#1b1714" strokeWidth="1.1" strokeLinecap="round" opacity="0.8">
          <path d="M272 566 L296 560" />
          <path d="M296 562 L316 570" />
        </g>
      </svg>
    </div>
  )
}
