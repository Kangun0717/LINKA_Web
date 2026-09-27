import TouchPointMark from '@/components/brand/TouchPointMark'
import { DOOR_COPY } from '@/features/door/doorCopy'
import type { DoorState } from '@/features/door/doorTimeline'
import { isAtOrAfter } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

/**
 * :))) then LINKA then the line, arriving as the light eases off.
 *
 * It lands on paper, not on ink. Cutting to black here would end the entrance
 * somewhere other than where it happened — the last frame has to be the same
 * warm off-white the first one was, only brighter, so the whole thing reads as
 * one drawing rather than an animation followed by a title card. The sky and
 * the two leaf contours are what is left of the world behind the door.
 *
 * All copy comes from `doorCopy` — this component owns the choreography only.
 */
export default function LinkaReveal({ state }: { state: DoorState }) {
  const isShowing = isAtOrAfter(state, 'brand')

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 transition-opacity duration-500',
        isShowing ? 'opacity-100' : 'opacity-0',
      )}
    >
      {/* The last of the illustration, held at a whisper behind the brand. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[38%] bg-[linear-gradient(to_bottom,rgba(214,229,238,0.5)_0%,rgba(214,229,238,0)_100%)]" />

        <svg
          viewBox="0 0 400 720"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
          focusable="false"
        >
          <g
            className="ink-line"
            fill="none"
            stroke="#6f7d6b"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.16"
          >
            <path d="M-20 664 C22 626, 86 634, 118 678" />
            <path d="M296 700 C330 662, 392 666, 424 704" />
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <TouchPointMark
          className={cn(
            'text-graphite-soft transition-all duration-700 ease-calm',
            isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
        />

        <h1
          className={cn(
            'mt-9 text-5xl font-light tracking-[0.2em] text-graphite transition-all duration-700 ease-calm sm:text-6xl',
            isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
          style={{ transitionDelay: isShowing ? '180ms' : '0ms' }}
        >
          {DOOR_COPY.wordmark}
        </h1>

        <p
          className={cn(
            'mt-9 text-base leading-relaxed text-graphite-soft transition-all duration-700 ease-calm',
            isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
          style={{ transitionDelay: isShowing ? '420ms' : '0ms' }}
        >
          {DOOR_COPY.slogan}
        </p>
      </div>
    </div>
  )
}
