import type { DoorState } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

/**
 * The moment the new world overwhelms the room.
 *
 * Light floods from the doorway to near-white, then recedes — the brand is
 * revealed by the light leaving, not by a cut to another screen.
 */
export default function LightWash({ state }: { state: DoorState }) {
  const isFlooding = state === 'light'

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_50%_46%,#fffdf8_0%,#fbf5ea_55%,#f4ead8_100%)]',
        'transition-opacity ease-door',
        isFlooding ? 'opacity-100 duration-[700ms]' : 'opacity-0 duration-[900ms]',
      )}
    />
  )
}
