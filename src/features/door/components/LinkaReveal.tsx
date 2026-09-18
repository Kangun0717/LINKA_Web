import TouchPointMark from '@/components/brand/TouchPointMark'
import { DOOR_COPY } from '@/features/door/doorCopy'
import type { DoorState } from '@/features/door/doorTimeline'
import { isAtOrAfter } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

/**
 * :))) then LINKA then the line, arriving as the light fades.
 *
 * All copy comes from `doorCopy` — this component owns the choreography only.
 */
export default function LinkaReveal({ state }: { state: DoorState }) {
  const isShowing = isAtOrAfter(state, 'brand')

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center',
        isShowing ? 'opacity-100' : 'opacity-0',
      )}
    >
      <TouchPointMark
        className={cn(
          'text-sand-faint transition-all duration-700 ease-calm',
          isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      />

      <h1
        className={cn(
          'mt-9 text-5xl font-light tracking-[0.2em] text-sand transition-all duration-700 ease-calm sm:text-6xl',
          isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
        style={{ transitionDelay: isShowing ? '180ms' : '0ms' }}
      >
        {DOOR_COPY.wordmark}
      </h1>

      <p
        className={cn(
          'mt-9 text-base leading-relaxed text-sand-muted transition-all duration-700 ease-calm',
          isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
        style={{ transitionDelay: isShowing ? '420ms' : '0ms' }}
      >
        {DOOR_COPY.slogan}
      </p>
    </div>
  )
}
