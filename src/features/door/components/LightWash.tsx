import type { DoorState } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

/**
 * The moment the daylight outruns the drawing.
 *
 * The room was already bright, so this is not a cut from dark to light — it is
 * the same paper going overexposed, with the faintest cool cast at the top
 * where the sky was. The brand is revealed by the light easing off, never by a
 * jump to another screen, and it eases off onto paper rather than into ink.
 */
export default function LightWash({ state }: { state: DoorState }) {
  const isFlooding = state === 'light'

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0',
        'bg-[radial-gradient(92%_68%_at_50%_48%,#ffffff_0%,#fdfbf6_52%,#f8f3ea_100%)]',
        'transition-opacity ease-door',
        isFlooding ? 'opacity-100 duration-[700ms]' : 'opacity-0 duration-[900ms]',
      )}
    />
  )
}
