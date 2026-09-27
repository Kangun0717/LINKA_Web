import type { WorldPlace } from '@/features/world/model/types'
import { labelSide } from '@/features/world/placeCard'
import { cn } from '@/lib/cn'

type PlaceLabelProps = {
  place: WorldPlace
  anchor: { x: number; y: number }
  stageWidth: number
  shown: boolean
}

/**
 * What the card leaves behind once the world takes over again: the place's
 * name, small and written straight onto the world beside its mark. No surface,
 * no edge — just enough to know the new place is there.
 */
export default function PlaceLabel({ place, anchor, stageWidth, shown }: PlaceLabelProps) {
  const side = labelSide(anchor.x, stageWidth)

  return (
    <span
      aria-hidden
      style={{ left: anchor.x, top: anchor.y }}
      className={cn(
        'pointer-events-none absolute -translate-y-1/2 whitespace-nowrap text-[0.68rem] tracking-[0.08em] text-graphite-soft',
        '[text-shadow:0_0_6px_rgba(252,251,248,0.95),0_0_2px_rgba(252,251,248,0.9)]',
        'transition-[opacity,translate] duration-700 ease-calm',
        side === 'right' ? 'pl-3.5' : '-translate-x-full pr-3.5',
        shown ? 'opacity-100' : 'opacity-0',
        shown ? 'delay-300' : 'delay-0',
      )}
    >
      {place.name}
    </span>
  )
}
