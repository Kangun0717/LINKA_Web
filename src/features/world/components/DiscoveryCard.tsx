import { useState } from 'react'

import type { DiscoveryPlace } from '@/features/world/model/types'
import { WORLD_COPY } from '@/features/world/worldCopy'
import { cn } from '@/lib/cn'

type DiscoveryCardProps = {
  place: DiscoveryPlace
  shown: boolean
  onClose: () => void
}

/**
 * A place, before you have been there.
 *
 * It lets someone understand a place from far away — what it is, what can be
 * done there — in the same warm paper as the Touch Memory Card, but with
 * nothing personal on it: no date, no :))), no photograph of theirs, and it
 * never says "visited". Looking is not touching. Only standing there and
 * touching the Touch Point makes a place yours.
 *
 * It rises from the navigation rather than hanging from its mark, because it
 * carries more than a name; the map above stays in view.
 */
export default function DiscoveryCard({ place, shown, onClose }: DiscoveryCardProps) {
  const [language, setLanguage] = useState<'en' | 'ja'>('en')
  const copy = WORLD_COPY.discovery

  return (
    <section
      aria-label={copy.a11y(place.name, place.nameLatin)}
      aria-hidden={!shown}
      className={cn(
        'absolute inset-x-3.5 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] max-h-[58dvh] overflow-y-auto rounded-2xl',
        'bg-[rgba(252,249,242,0.9)] backdrop-blur-[12px]',
        'shadow-[0_0_0_0.5px_rgba(51,48,43,0.07),0_12px_36px_-14px_rgba(80,112,128,0.3)]',
        'transition-[opacity,translate] duration-500 ease-calm',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      {place.image && (
        <figure className="relative m-2 mb-0 overflow-hidden rounded-xl">
          <img
            src={place.image.src}
            alt={place.image.alt}
            loading="lazy"
            decoding="async"
            className="block aspect-[16/9] w-full object-cover saturate-[0.9]"
          />
          <figcaption className="absolute bottom-1.5 right-2 text-[0.52rem] tracking-[0.04em] text-white/85 [text-shadow:0_0_4px_rgba(0,0,0,0.5)]">
            {place.image.credit}
          </figcaption>
        </figure>
      )}

      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2.5 text-[1.08rem] font-light leading-snug tracking-[0.06em] text-graphite">
              <OpenGlyph />
              {place.name}
            </h2>
            <p className="mt-0.5 pl-[1.35rem] text-[0.58rem] uppercase tracking-[0.22em] text-graphite-soft">
              {place.nameLatin}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            tabIndex={shown ? 0 : -1}
            className="-mr-2 -mt-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-graphite-soft outline-none focus-visible:ring-1 focus-visible:ring-graphite/30"
          >
            <svg aria-hidden viewBox="0 0 10 10" className="size-2.5">
              <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mt-2.5 pl-[1.35rem] text-[0.64rem] uppercase tracking-[0.2em] text-graphite-soft/85">
          {copy.notVisited}
        </p>

        <div className="mt-3.5 flex items-center gap-1 pl-[1.35rem]" role="group" aria-label={copy.language}>
          {(['en', 'ja'] as const).map((code) => (
            <button
              key={code}
              type="button"
              tabIndex={shown ? 0 : -1}
              aria-pressed={language === code}
              onClick={() => setLanguage(code)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[0.6rem] tracking-[0.12em] outline-none focus-visible:ring-1 focus-visible:ring-graphite/30',
                language === code ? 'bg-graphite/[0.07] text-graphite' : 'text-graphite-soft',
              )}
            >
              {copy.languages[code]}
            </button>
          ))}
        </div>

        <p
          lang={language}
          className="mt-2 pl-[1.35rem] text-[0.8rem] font-light leading-relaxed tracking-[0.02em] text-graphite"
        >
          {place.intro[language]}
        </p>

        {place.activities.length > 0 && (
          <div className="mt-4 pl-[1.35rem]">
            <h3 className="text-[0.58rem] uppercase tracking-[0.22em] text-graphite-soft">{copy.activities}</h3>
            <ul className="mt-2 space-y-2.5 border-l border-graphite/10 pl-3">
              {place.activities.map((activity) => (
                <li key={activity.title}>
                  <p className="text-[0.76rem] tracking-[0.02em] text-graphite">{activity.title}</p>
                  <p className="mt-0.5 text-[0.7rem] font-light leading-snug text-graphite-soft">{activity.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 pl-[1.35rem] text-[0.56rem] tracking-[0.06em] text-graphite-faint">{copy.sample}</p>
      </div>
    </section>
  )
}

/** ○ — the same open mark the place wears on the map. */
function OpenGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" focusable="false" className="size-2.5 shrink-0 text-graphite/55">
      <circle cx="5" cy="5" r="3.8" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
