import { useMemo, useRef, useState } from 'react'

import PlaceCard from '@/features/world/components/PlaceCard'
import PlaceLabel from '@/features/world/components/PlaceLabel'
import TouchMark from '@/features/world/components/TouchMark'
import WorldGlobe, { type Bloom } from '@/features/world/components/WorldGlobe'
import { frameWorld, landPaths, project } from '@/features/world/geo/orthographic'
import type { WorldSnapshot } from '@/features/world/model/types'
import { useArrival } from '@/features/world/useArrival'
import { formatTouchDate, WORLD_COPY } from '@/features/world/worldCopy'
import { useElementSize } from '@/hooks/useElementSize'
import { cn } from '@/lib/cn'

type MyWorldProps = {
  snapshot: WorldSnapshot
  /**
   * The place a touch has just added, if the user arrived from one. Its mark,
   * ripple and wash play in; everything else is already there.
   */
  arrivalPlaceId?: string | null
}

/**
 * My World, at world scale.
 *
 * The world is the whole screen — larger than the phone, running past its
 * edges — so the user looks into it rather than at a globe placed on a page.
 * It does not know where its places come from: production passes the user's
 * own (today, none) and the dev preview passes its scenarios.
 */
export default function MyWorld({ snapshot, arrivalPlaceId = null }: MyWorldProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(stageRef)
  const phase = useArrival(arrivalPlaceId)
  /** `null`: the user has not chosen yet. `''`: they chose nothing. */
  const [chosenId, setChosenId] = useState<string | null>(null)

  const { places, recentPlaceId } = snapshot
  const isQuiet = places.length === 0

  const frame = useMemo(() => frameWorld(places, width, height), [places, width, height])
  const land = useMemo(() => landPaths(frame), [frame])

  // Nothing is placed until the stage has a size to place it in.
  const marks = useMemo(
    () =>
      width === 0
        ? []
        : places
            .map((place) => ({ place, at: project(frame, place.lng, place.lat) }))
            .filter(({ at }) => at.visible),
    [places, frame, width],
  )

  const blooms: Bloom[] = marks.map(({ place, at }) => ({
    id: place.id,
    x: at.x,
    y: at.y,
    r: Math.min(150, Math.max(54, frame.r * (places.length === 1 ? 0.3 : 0.24))),
    variant: variantOf(place.id),
    open: place.id !== arrivalPlaceId || (phase !== 'rest' && phase !== 'mark'),
  }))

  // An arrival names its place, holds, then lets go; after that, the user chooses.
  const selectedId = chosenId ?? (phase === 'named' ? arrivalPlaceId : null)
  const selectedMark = marks.find(({ place }) => place.id === selectedId) ?? null

  // The card keeps showing its last place while it fades, rather than emptying.
  const [cardMark, setCardMark] = useState(selectedMark)
  if (selectedMark && selectedMark !== cardMark) setCardMark(selectedMark)

  // The newest place keeps a quiet name once its card has folded away.
  const arrivalMark = marks.find(({ place }) => place.id === arrivalPlaceId) ?? null
  const isLabelShown = phase === 'settled' && selectedId !== arrivalPlaceId

  return (
    <div className="relative h-full overflow-hidden bg-canvas">
      {/* Daylight: a pale sky at the top and the faintest warmth in one corner. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_32%_at_86%_4%,rgba(247,233,189,0.42)_0%,rgba(247,233,189,0)_100%),linear-gradient(to_bottom,rgba(232,241,245,0.9)_0%,rgba(232,241,245,0)_42%)]"
      />

      <div
        ref={stageRef}
        role="img"
        aria-label={isQuiet ? WORLD_COPY.a11y.quietWorld : WORLD_COPY.a11y.world}
        className="absolute inset-0"
        onClick={() => setChosenId('')}
      >
        {width > 0 && (
          <WorldGlobe width={width} height={height} frame={frame} land={land} blooms={blooms} />
        )}
      </div>

      {marks.map(({ place, at }) => {
        const isArriving = place.id === arrivalPlaceId
        const isShown = !isArriving || phase !== 'rest'
        const isSelected = place.id === selectedId

        return (
          <button
            key={place.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={WORLD_COPY.a11y.place(
              place.name,
              place.locality,
              formatTouchDate(place.firstTouchedAt),
            )}
            onClick={() => setChosenId(isSelected ? '' : place.id)}
            style={{ left: at.x, top: at.y }}
            className={cn(
              'absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full',
              'transition-[opacity,scale] duration-700 ease-calm outline-none focus-visible:ring-1 focus-visible:ring-graphite/30',
              isShown ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
            )}
          >
            <TouchMark
              recent={place.id === recentPlaceId && (!isArriving || phase === 'settled')}
              selected={isSelected}
              arriving={isArriving && isShown}
            />
          </button>
        )
      })}

      <header className="pointer-events-none absolute inset-x-0 top-0 px-7 pt-[max(2.25rem,env(safe-area-inset-top))]">
        <h1 className="text-[0.7rem] font-normal uppercase tracking-[0.26em] text-graphite-soft">
          {WORLD_COPY.title}
        </h1>
        {isQuiet && (
          <p className="mt-3 text-[0.8rem] font-light tracking-wide text-graphite-faint">
            {WORLD_COPY.quiet}
          </p>
        )}
      </header>

      {arrivalMark && (
        <PlaceLabel
          place={arrivalMark.place}
          anchor={arrivalMark.at}
          stageWidth={width}
          shown={isLabelShown}
        />
      )}

      {cardMark && (
        <PlaceCard
          place={cardMark.place}
          anchor={cardMark.at}
          stage={{ width, height }}
          shown={selectedMark !== null}
        />
      )}
    </div>
  )
}

/** A stable choice of watercolor edge per place, so no two washes look stamped. */
function variantOf(id: string): number {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash) % 3
}
