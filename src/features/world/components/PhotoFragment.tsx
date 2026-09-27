import type { MemoryPhoto } from '@/features/world/model/types'
import { cn } from '@/lib/cn'

type PhotoFragmentProps = {
  photo: MemoryPhoto
  /** The place's Touch Point on screen; the fragment rests just above it. */
  anchor: { x: number; y: number }
  /** Which side of the mark it leans toward — away from the place's name. */
  side: 'left' | 'right'
  seed: string
  shown: boolean
  label: string
  onOpen: () => void
}

/** The longest edge of a fragment, px. Small enough that the map stays the hero. */
const EDGE = 54

/**
 * A Memory Fragment: one real photograph, laid lightly on the drawn map.
 *
 * The illustration is the remembered world; the photograph is something that
 * actually happened there. So it is kept small and physical — a print with a
 * narrow warm border, a soft shadow and a slight, natural tilt, resting beside
 * its Touch Point — and never a tile, a card or a gallery.
 */
export default function PhotoFragment({ photo, anchor, side, seed, shown, label, onOpen }: PhotoFragmentProps) {
  const landscape = photo.width >= photo.height
  const width = landscape ? EDGE : Math.round((EDGE * photo.width) / photo.height)
  const height = landscape ? Math.round((EDGE * photo.height) / photo.width) : EDGE
  const tilt = tiltOf(seed, side)

  // The corner nearest the mark sits a little up and to one side of it.
  const left = side === 'left' ? anchor.x - width - 16 : anchor.x + 14
  const top = anchor.y - height - 12

  return (
    <button
      type="button"
      aria-label={label}
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      onClick={onOpen}
      style={{ left, top, rotate: `${tilt}deg` }}
      className={cn(
        'absolute rounded-[2px] bg-[#fbf8f1] p-[3px] outline-none focus-visible:ring-1 focus-visible:ring-graphite/30',
        'shadow-[0_0_0_0.5px_rgba(51,48,43,0.08),0_1px_2px_rgba(62,52,40,0.1),0_7px_16px_-8px_rgba(62,52,40,0.34)]',
        'transition-[opacity,translate,scale] duration-700 ease-calm',
        shown ? 'translate-y-0 scale-100 opacity-100 delay-[1800ms]' : 'pointer-events-none translate-y-1 scale-95 opacity-0',
      )}
    >
      <img
        src={photo.src}
        alt={photo.alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{ width, height }}
        className="block object-cover saturate-[0.92]"
      />
    </button>
  )
}

/** One to three degrees, leaning with the side it rests on, stable per place. */
function tiltOf(seed: string, side: 'left' | 'right'): number {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const magnitude = 1 + (Math.abs(hash) % 21) / 10
  return side === 'left' ? -magnitude : magnitude
}
