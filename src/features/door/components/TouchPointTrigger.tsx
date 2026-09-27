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
 * The two ways through the door: the Touch Point, and the handle.
 *
 * The sticker is deliberately, almost inconveniently small. A LINKA Touch Point
 * is a physical thing the size of a coin — drawing it larger would turn the
 * entrance into a screen with a button on it, which is precisely what LINKA is
 * not. So the drawing stays coin-sized and the *targets* are generous and
 * invisible: a 56x48 box around the sticker, a 64x64 one over the handle.
 *
 * Both produce the same `direct` Touch signal, because both are the same
 * gesture — a physical tag produces an `nfc` one, and the entrance that follows
 * is identical. Only the trigger differs.
 *
 * The targets are real `<button>`s rather than pseudo-elements: a `::before`
 * hit area is invisible to `getBoundingClientRect`, which makes "is this thing
 * actually reachable?" impossible to answer from the outside — and this is
 * exactly the kind of control where that question has to stay answerable.
 */
export default function TouchPointTrigger({ state, onTouch }: TouchPointTriggerProps) {
  const isWaiting = state === 'idle'
  const hasFired = isAtOrAfter(state, 'touching')

  const target = cn(
    'outline-none transition-none enabled:cursor-pointer disabled:cursor-default',
    'focus-visible:ring-2 focus-visible:ring-graphite/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
  )

  return (
    <>
      {/*
        The handle. No visual of its own — it is already drawn into the panel —
        so this is purely the target over it. It comes first in the DOM so the
        sticker, which shares this corner of the door, stays on top of it.
      */}
      <button
        type="button"
        onClick={onTouch}
        disabled={!isWaiting}
        aria-label={DOOR_COPY.a11y.handle}
        className={cn(
          'absolute left-[80.5%] top-[50.3%] size-16 -translate-x-1/2 -translate-y-1/2 rounded-full',
          target,
        )}
      />

      {/* The sticker, and the box you can actually hit it with. */}
      <span className="pointer-events-none absolute left-[81.5%] top-[46.4%] z-10 w-[15%] -translate-x-1/2 -translate-y-1/2">
        {/* Warm bloom, breathing. The only thing here that asks to be found. */}
        <span
          aria-hidden
          className={cn(
            'absolute -inset-[70%] rounded-full bg-glow/50 blur-md transition-opacity duration-500',
            isWaiting ? 'animate-halo' : hasFired ? 'opacity-45' : 'opacity-0',
          )}
        />

        <svg
          viewBox="0 0 44 30"
          className="relative block w-full"
          aria-hidden
          focusable="false"
        >
          <g transform="rotate(-4.5 22 15)">
            {/* The sticker sits a hair off the door, so it casts a hair of shadow. */}
            <path
              d="M4 7 C14 5, 30 6, 40 5 C41.6 11, 40.4 21, 41 27 C30 28.4, 14 27.2, 4 28 C3 21, 4.6 13, 4 7 Z"
              transform="translate(1.4 2)"
              fill="#b9ad98"
              opacity="0.34"
              filter="url(#linka-soft-shadow)"
            />

            <g className="ink-line">
              <path
                d="M4 7 C14 5, 30 6, 40 5 C41.6 11, 40.4 21, 41 27 C30 28.4, 14 27.2, 4 28 C3 21, 4.6 13, 4 7 Z"
                fill="#fdfbf5"
                stroke={hasFired ? '#c9913f' : '#3a352f'}
                strokeWidth="1.25"
                strokeLinejoin="round"
                className="transition-[stroke] duration-500 ease-calm"
                opacity="0.9"
              />
            </g>

            <text
              x="22.5"
              y="21"
              textAnchor="middle"
              fontFamily="ui-monospace, 'SFMono-Regular', Menlo, monospace"
              fontSize="13"
              letterSpacing="0.6"
              fill={hasFired ? '#b8802e' : '#3a352f'}
              className="transition-[fill] duration-500 ease-calm"
            >
              :)))
            </text>
          </g>
        </svg>

        {state === 'touching' ? <TouchRipple /> : null}

        <button
          type="button"
          onClick={onTouch}
          disabled={!isWaiting}
          aria-label={DOOR_COPY.a11y.trigger}
          className={cn(
            'pointer-events-auto absolute left-1/2 top-1/2 h-12 w-14 -translate-x-1/2 -translate-y-1/2 rounded-md',
            target,
          )}
        />
      </span>
    </>
  )
}
