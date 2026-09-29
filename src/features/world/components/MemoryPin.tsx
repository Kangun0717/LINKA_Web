import { cn } from '@/lib/cn'

/** A past journal entry placed on the map: where, and what to show. Never a visit. */
export type MemoryPinData = {
  /** The newest entry at this place — what the pin opens. */
  id: string
  placeId: string
  lat: number
  lng: number
  name: string
  date: string
  count: number
  /** A thumbnail URL, when the entry has a photo. */
  photo: string | null
}

/**
 * A memory from the journal, taped onto the map: a small, slightly
 * translucent print with a strip of tape. It sits beside the land and never
 * colours it — only a LINKA Touch does that — and it reads as paper, not as
 * the :))) mark, so it can never be mistaken for a verified place.
 */
export default function MemoryPin({
  pin,
  at,
  seed,
  shown,
  label,
  onOpen,
}: {
  pin: MemoryPinData
  at: { x: number; y: number }
  seed: number
  shown: boolean
  label: string
  onOpen: () => void
}) {
  const tilt = [-8, 6, -4, 9][seed % 4]
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onOpen}
      // Up and to the right of the place, clear of its own 44 px mark, so a tap
      // on the place never lands on the memory (or the other way round).
      style={{ left: at.x + 22, top: at.y - 54 }}
      className={cn(
        'absolute flex size-11 items-center justify-center outline-none transition-opacity duration-700 ease-calm focus-visible:ring-1 focus-visible:ring-graphite/30',
        shown ? 'opacity-100 delay-500' : 'pointer-events-none opacity-0',
      )}
    >
      <span
        aria-hidden
        className="relative block bg-white/85 p-[2px] pb-[4px] shadow-[0_1px_2px_rgba(51,48,43,0.18),0_6px_12px_-8px_rgba(51,48,43,0.5)] backdrop-blur-[1px]"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        {pin.photo ? (
          <img src={pin.photo} alt="" loading="lazy" decoding="async" className="block h-[22px] w-[28px] object-cover opacity-90" />
        ) : (
          <span className="block h-[22px] w-[28px] bg-[repeating-linear-gradient(transparent_0_5px,rgba(111,104,96,0.18)_5px_6px)] bg-[#f6f1e8]" />
        )}
        <span className="absolute -top-1.5 left-1/2 block h-[6px] w-4 -translate-x-1/2 rotate-[-4deg] bg-[rgba(240,214,140,0.72)]" />
        {pin.count > 1 && (
          <span className="absolute -bottom-2 -right-2 flex size-4 items-center justify-center rounded-full bg-paper-lit text-[0.5rem] tabular-nums text-graphite ring-1 ring-graphite/20">
            {pin.count}
          </span>
        )}
      </span>
    </button>
  )
}
