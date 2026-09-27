import { cn } from '@/lib/cn'

type MapLabelProps = {
  /** Native name, always first. */
  name: string
  /** English or romanised, second and smaller. */
  nameLatin: string | null
  anchor: { x: number; y: number }
  /** Which side of the anchor the words sit on; `gap` is the distance from it. */
  side: 'left' | 'right' | 'below'
  gap: number
  shown: boolean
  /** Present when the label is a way in. */
  onEnter?: () => void
  enterLabel?: string
  /** Waits this long before appearing, so labels follow what they name. */
  delayMs?: number
  /** `quiet` for what has only been discovered: the same words, in pencil. */
  tone?: 'lived' | 'quiet'
}

/**
 * A name written straight onto the map — for a country, an area or a place.
 *
 * Written, not placed: no surface or pin, only the name with a paper-coloured
 * halo so it reads over any wash. A label that can be entered is a button and
 * carries one small, quiet chevron; the rest are only words.
 */
export default function MapLabel({
  name,
  nameLatin,
  anchor,
  side,
  gap,
  shown,
  onEnter,
  enterLabel,
  delayMs = 0,
  tone = 'lived',
}: MapLabelProps) {
  const position =
    side === 'right'
      ? { left: anchor.x + gap, top: anchor.y, transform: 'translateY(-50%)' }
      : side === 'left'
        ? { left: anchor.x - gap, top: anchor.y, transform: 'translate(-100%, -50%)' }
        : { left: anchor.x, top: anchor.y + gap, transform: 'translateX(-50%)' }

  const align = side === 'left' ? 'items-end text-right' : side === 'right' ? 'items-start' : 'items-center'

  const words = (
    <>
      <span
        className={cn(
          'flex items-center gap-1 font-light leading-tight tracking-[0.14em]',
          tone === 'quiet' ? 'text-[0.74rem] text-graphite-soft' : 'text-[0.82rem] text-graphite',
        )}
      >
        {name}
        {onEnter && <Chevron />}
      </span>
      {nameLatin && (
        <span
          className={cn(
            'mt-0.5 text-[0.54rem] uppercase leading-tight tracking-[0.24em]',
            tone === 'quiet' ? 'text-graphite-faint' : 'text-graphite-soft',
          )}
        >
          {nameLatin}
        </span>
      )}
    </>
  )

  const shared = cn(
    'absolute flex flex-col whitespace-nowrap',
    '[text-shadow:0_0_6px_rgba(252,251,248,0.98),0_0_2px_rgba(252,251,248,0.95)]',
    'transition-opacity duration-700 ease-calm',
    align,
    shown ? 'opacity-100' : 'pointer-events-none opacity-0',
  )
  const style = { ...position, transitionDelay: shown ? `${delayMs}ms` : '0ms' }

  if (onEnter) {
    return (
      <button
        type="button"
        aria-label={enterLabel}
        aria-hidden={!shown}
        tabIndex={shown ? 0 : -1}
        onClick={onEnter}
        style={style}
        className={cn(
          shared,
          // A full-size target around small words.
          'min-h-11 justify-center rounded-lg px-2 py-1.5 outline-none focus-visible:ring-1 focus-visible:ring-graphite/30',
          side === 'right' && '-ml-2',
          side === 'left' && 'ml-2',
        )}
      >
        {words}
      </button>
    )
  }

  return (
    <span aria-hidden className={cn(shared, 'pointer-events-none')} style={style}>
      {words}
    </span>
  )
}

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 6 10" focusable="false" className="h-2 w-1.5 text-graphite-soft">
      <path
        d="M1 1l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
