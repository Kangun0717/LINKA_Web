import { useRef } from 'react'

import type { WorldPlace } from '@/features/world/model/types'
import { placeCard } from '@/features/world/placeCard'
import { useElementSize } from '@/hooks/useElementSize'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate } from '@/lib/i18n/locale'

type PlaceCardProps = {
  place: WorldPlace
  /** The place's Touch Point on screen; the card hangs from it. */
  anchor: { x: number; y: number }
  stage: { width: number; height: number }
  shown: boolean
  /**
   * Later: opens the full Place Sheet (moments, photos, people). While it is
   * absent the card is a quiet surface, not a control.
   */
  onOpen?: () => void
}

/**
 * The Touch Memory Card.
 *
 * A small piece of warm, translucent paper resting on the world beside the
 * place it names — not a panel laid over it. It carries only the place's
 * identity, and its :))) primitive sits in line with the Touch Point above it,
 * which is what ties the two together instead of a pointer.
 */
export default function PlaceCard({ place, anchor, stage, shown, onOpen }: PlaceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const size = useElementSize(cardRef)
  const { left, top, side } = placeCard(anchor, stage, {
    width: size.width || 200,
    height: size.height || 92,
  })

  const surface = cn(
    'block w-50 rounded-2xl px-4 pb-3.5 pt-3 text-left',
    'bg-[rgba(252,249,242,0.66)] backdrop-blur-[10px]',
    'shadow-[0_0_0_0.5px_rgba(51,48,43,0.07),0_8px_28px_-10px_rgba(80,112,128,0.22)]',
  )

  const content = <PlaceIdentity place={place} />

  return (
    <div
      ref={cardRef}
      aria-hidden={!shown}
      style={{ left, top, transformOrigin: side === 'below' ? '18px 0' : '18px 100%' }}
      className={cn(
        'absolute transition-[opacity,translate,scale] duration-500 ease-calm',
        shown
          ? 'translate-y-0 scale-100 opacity-100'
          : cn('pointer-events-none scale-[0.96] opacity-0', side === 'below' ? '-translate-y-1' : 'translate-y-1'),
      )}
    >
      {onOpen ? (
        <button type="button" onClick={onOpen} className={surface}>
          {content}
        </button>
      ) : (
        <section aria-live="polite" className={surface}>
          {content}
        </section>
      )}
    </div>
  )
}

/**
 * A place's identity: name, where, when. Kept separate so the future Place
 * Sheet can open with exactly the same heading the card showed.
 */
export function PlaceIdentity({ place }: { place: WorldPlace }) {
  const { locale } = useLocale()

  return (
    <>
      <div className="flex items-center gap-2.5">
        <TouchGlyph />
        <h2 className="min-w-0 text-[1.08rem] font-light leading-snug tracking-[0.06em] text-graphite">
          {place.name}
        </h2>
      </div>

      <div className="mt-1.5 pl-[1.4rem]">
        {place.locality && (
          <p className="text-[0.72rem] leading-tight tracking-[0.03em] text-graphite-soft">
            {place.locality}
          </p>
        )}
        <p className="mt-1 text-[0.6rem] uppercase leading-tight tracking-[0.2em] text-graphite-soft/85 tabular-nums">
          {formatCalendarDate(place.firstTouchedOn ?? place.firstTouchedAt, locale)}
        </p>
      </div>
    </>
  )
}

/**
 * `:)))` reduced to a dot and three arcs — the same mark as the Touch Point
 * above, drawn small and faint so it reads as a signature, not a button.
 */
function TouchGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 13 10"
      focusable="false"
      className="h-2.5 w-3 shrink-0 text-graphite/55"
    >
      <circle cx="1.6" cy="5" r="1.3" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        <path d="M4.6 3.1a2.7 2.7 0 0 1 0 3.8" />
        <path d="M7.3 1.7a4.7 4.7 0 0 1 0 6.6" opacity="0.75" />
        <path d="M10 0.6a6.3 6.3 0 0 1 0 8.8" opacity="0.5" />
      </g>
    </svg>
  )
}
