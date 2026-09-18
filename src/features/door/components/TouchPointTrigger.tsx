import TouchPointMark from '@/components/brand/TouchPointMark'
import { DOOR_COPY } from '@/features/door/doorCopy'
import TouchRipple from '@/features/door/components/TouchRipple'
import type { DoorState } from '@/features/door/doorTimeline'
import { isAtOrAfter } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

type TouchPointTriggerProps = {
  state: DoorState
  onTouch: () => void
}

/**
 * The :))) Touch Point, mounted on the door beside the handle.
 *
 * It breathes while it waits so it reads as a physical thing embedded in the
 * world rather than a button drawn on top of one. Activating it produces a
 * `direct` Touch signal; a physical tag will produce an `nfc` one. The visual
 * entrance is identical either way — only the trigger differs.
 */
export default function TouchPointTrigger({ state, onTouch }: TouchPointTriggerProps) {
  const isWaiting = state === 'idle'
  const hasFired = isAtOrAfter(state, 'touching')

  return (
    <div className="absolute right-[8%] top-[33%] -translate-y-1/2">
      <button
        type="button"
        onClick={onTouch}
        disabled={!isWaiting}
        aria-label={DOOR_COPY.a11y.trigger}
        className={cn(
          'group relative flex size-[54px] items-center justify-center rounded-full',
          'outline-none transition-all duration-500 ease-calm',
          'focus-visible:ring-2 focus-visible:ring-glow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
          'disabled:cursor-default',
        )}
      >
        {/* Brushed plate the mark is engraved into. */}
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full border transition-colors duration-500 ease-calm',
            'bg-[radial-gradient(circle_at_38%_30%,#26221e_0%,#171412_60%,#100e0c_100%)]',
            hasFired ? 'border-glow/45' : 'border-ink-line',
          )}
        />

        {/* Warm halo — the Touch Point quietly alive in a dark room. */}
        <span
          aria-hidden
          className={cn(
            'absolute -inset-3 rounded-full bg-glow/25 blur-lg transition-opacity duration-500',
            isWaiting ? 'animate-halo' : hasFired ? 'opacity-70' : 'opacity-0',
          )}
        />

        <TouchPointMark
          size="sm"
          className={cn(
            'relative transition-colors duration-500 ease-calm',
            hasFired ? 'text-glow' : 'text-sand/70',
            isWaiting && 'animate-breathe',
          )}
        />

        {state === 'touching' ? <TouchRipple /> : null}
      </button>
    </div>
  )
}
