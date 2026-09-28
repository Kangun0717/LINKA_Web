import type { ReactNode } from 'react'

import type { WorldLocation } from '@/features/world/geo/atlas'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { regionSecondName } from '@/features/world/regionName'
import { cn } from '@/lib/cn'
import { useMessages } from '@/lib/i18n/useMessages'

type WorldHeaderProps = {
  location: WorldLocation
  isQuiet: boolean
  onBack: () => void
}

/**
 * Where you are, and the way back up.
 *
 * My World keeps its own small title. Below it, each level names itself in
 * its own language first — 日本, then JAPAN — under a quiet way back to the
 * level above. The three headers cross-fade rather than slide: the camera is
 * already doing the moving.
 */
export default function WorldHeader({ location, isQuiet, onBack }: WorldHeaderProps) {
  const copy = useMessages()
  const country = location.level === 0 ? null : location.country
  const area = location.level === 2 ? location.area : null

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 px-7 pt-[max(2.25rem,env(safe-area-inset-top))]">
      <LanguageSwitcher className="absolute right-4 top-[max(1.45rem,calc(env(safe-area-inset-top)-0.8rem))] z-10" />
      <Layer shown={location.level === 0}>
        <h1 className="text-[0.7rem] font-normal uppercase tracking-[0.26em] text-graphite-soft">
          {copy.world.title}
        </h1>
        {isQuiet && (
          <p className="mt-3 text-[0.8rem] font-light tracking-wide text-graphite-faint">
            {copy.world.quiet}
          </p>
        )}
      </Layer>

      {country && (
        <Layer key={area ? `${country.id}/${area.id}` : country.id} shown absolute>
          <button
            type="button"
            onClick={onBack}
            aria-label={copy.a11y.backTo(area ? country.nameLatin : copy.world.title)}
            className="pointer-events-auto -ml-2 -mt-3 flex min-h-11 items-center gap-2 rounded-lg px-2 text-[0.64rem] uppercase tracking-[0.22em] text-graphite-soft outline-none focus-visible:ring-1 focus-visible:ring-graphite/30"
          >
            <svg aria-hidden viewBox="0 0 6 10" focusable="false" className="h-2 w-1.5">
              <path
                d="M5 1L1 5l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {area ? (
              <span>
                <span className="normal-case tracking-[0.14em]">{country.name}</span> {regionSecondName(country, copy)}
              </span>
            ) : (
              copy.world.title
            )}
          </button>

          <h1 className="mt-0.5 flex items-baseline gap-3">
            <span className="text-[1.45rem] font-light leading-none tracking-[0.16em] text-graphite">
              {(area ?? country).name}
            </span>
            <span className="text-[0.62rem] uppercase tracking-[0.28em] text-graphite-soft">
              {regionSecondName(area ?? country, copy)}
            </span>
          </h1>
        </Layer>
      )}
    </header>
  )
}

function Layer({
  shown,
  absolute = false,
  children,
}: {
  shown: boolean
  absolute?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'transition-opacity duration-500 ease-calm',
        // A level's header arrives once the camera is most of the way there.
        absolute &&
          'absolute inset-x-7 top-[max(2.25rem,env(safe-area-inset-top))] animate-[linka-fade-in_900ms_var(--ease-calm)_600ms_both] motion-reduce:animate-none',
        shown ? 'opacity-100' : 'opacity-0',
      )}
    >
      {children}
    </div>
  )
}
