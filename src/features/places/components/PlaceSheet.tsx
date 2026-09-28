import type { ReactNode } from 'react'

import type { SafetyResource } from '@/features/places/api'
import type { Hero, LocalizedText, Practical } from '@/features/places/localize'
import type { PlaceExtras } from '@/features/places/usePlaceExtras'
import { cn } from '@/lib/cn'
import type { SafetyKind } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, HTML_LANG, isLocale, type Locale } from '@/lib/i18n/locale'
import { useMessages } from '@/lib/i18n/useMessages'

/** Everything the sheet can say about a place. All of it real and sourced. */
export type SheetPlace = {
  name: string
  nameLatin: string
  locality: string | null
  summary: LocalizedText | null
  practical: Practical | null
  officialUrl: string | null
  sources: readonly { url: string; publisher: string | null }[]
  hero: Hero | null
  /** Dev-preview only: the sheet says the content is a sample. */
  sampleNote?: string
}

export type SheetProgress = { region: string; visited: number; total: number } | null

type PlaceSheetProps = {
  place: SheetPlace
  /** `YYYY-MM-DD` at the place when first touched, or null if never. */
  visitedOn: string | null
  extras: PlaceExtras
  progress: SheetProgress
  /**
   * A notice shown above the place — supplied by the caller. Production passes
   * none; the dev-only emergency demonstration passes its clearly-labelled one.
   */
  notice?: ReactNode
  /** Put the official safety section first, right under the notice. */
  safetyFirst?: boolean
  /** Hero loading: eager for a landing page's first image, lazy in a card. */
  heroPriority?: boolean
  /** `-1` while the surface holding the sheet is hidden. */
  tabIndex?: number
  /** Which rows of the safety list belong to this place, and which to its region. */
  scope?: { placeId: string; regionId: string | null; regionName: string | null }
  /** Other discoverable LINKA places, shown last; tapping one opens it. */
  others?: readonly { id: string; name: string; nameLatin: string; hero: Hero | null }[]
  onOpenOther?: (id: string) => void
  /**
   * Only the photo, identity and introduction — for the NFC landing before
   * the visitor has chosen a path. The details follow once they have.
   */
  compact?: boolean
  /** Extra content under the identity (the check-in status, actions). */
  children?: ReactNode
}

const SAFETY_ORDER: SafetyKind[] = [
  'alerts',
  'emergency_contact',
  'evacuation',
  'hazard_map',
  'weather_warnings',
  'disaster_info',
  'multilingual',
]

/**
 * The Place Sheet: one place, in the order a visitor needs it.
 *
 *   photo → name → visited or not → what it is → who is here today →
 *   how much of the region you have explored → what is on → hours, fees →
 *   safety → the official site and where every fact came from.
 *
 * The same warm paper and graphite as the Touch Memory Card, with the
 * photograph giving it a face. Every statement is sourced: LINKA's short
 * words about the place, and — kept visibly apart — official safety
 * information, which LINKA only ever links to.
 */
export default function PlaceSheet({
  place,
  visitedOn,
  extras,
  progress,
  notice = null,
  safetyFirst = false,
  heroPriority = false,
  tabIndex = 0,
  compact = false,
  scope,
  others = [],
  onOpenOther,
  children,
}: PlaceSheetProps) {
  const copy = useMessages()
  const { locale } = useLocale()
  const fallbacks = [
    ...new Set([place.summary, place.practical].flatMap((part) => (part?.fallback ? [part.locale] : []))),
  ]
  const rows = place.practical?.rows ?? []
  const hours = rows.filter((row) => row.key === 'hours' || row.key === 'closed')
  const fees = rows.filter((row) => row.key === 'admission')
  const access = rows.filter((row) => row.key === 'access')

  return (
    <article className="text-graphite">
      {place.hero && <PlaceHero hero={place.hero} priority={heroPriority} tabIndex={tabIndex} />}

      <div className={cn('px-5', place.hero ? 'pt-4' : 'pt-5')}>
        {notice}
        {safetyFirst && (extras.safety.length > 0 || extras.safetyFailed) && (
          <div className="mb-5">
            <SafetySection extras={extras} scope={scope} tabIndex={tabIndex} emphasised />
          </div>
        )}

        <h2 lang="ja" className="text-[1.5rem] font-light leading-tight tracking-[0.08em]">
          {place.name}
        </h2>
        <p className="mt-1 text-[0.6rem] uppercase tracking-[0.24em] text-graphite-soft">{place.nameLatin}</p>

        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-[0.66rem] tracking-[0.08em] text-graphite-soft">
          <VisitMark visited={Boolean(visitedOn)} />
          <span className={visitedOn ? 'text-graphite' : undefined}>
            {visitedOn ? `${copy.sheet.visited} · ${formatCalendarDate(visitedOn, locale)}` : copy.sheet.notVisited}
          </span>
          {place.locality && <span>· {place.locality}</span>}
        </p>

        {children}

        {fallbacks.length > 0 && (
          <p className="mt-4 text-[0.62rem] leading-snug tracking-[0.03em] text-graphite-faint">
            {copy.place.fallback(fallbacks.map((l) => copy.language.names[l]).join(' / '))}
          </p>
        )}
        {place.summary && (
          <p lang={HTML_LANG[place.summary.locale]} className="mt-2 text-[0.86rem] font-light leading-relaxed tracking-[0.02em]">
            {place.summary.text}
          </p>
        )}

        {!compact && (extras.visitors !== null || progress) && (
          <div className="mt-5 grid grid-cols-1 gap-2">
            {extras.visitors !== null && (
              <Module>
                <span className="text-[1.1rem] font-light tabular-nums">{extras.visitors}</span>
                <span className="ml-2 text-[0.72rem] text-graphite-soft">{copy.sheet.visitorsToday(extras.visitors)}</span>
              </Module>
            )}
            {progress && progress.total > 0 && (
              <Module>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.72rem] tracking-[0.06em] text-graphite-soft">{copy.sheet.explore(progress.region)}</span>
                  <span className="text-[0.86rem] tabular-nums">{copy.sheet.progress(progress.visited, progress.total)}</span>
                </div>
                <div aria-hidden className="mt-2 h-[3px] overflow-hidden rounded-full bg-graphite/[0.08]">
                  <div
                    className="h-full rounded-full bg-[var(--color-meadow)]"
                    style={{ width: `${Math.round((progress.visited / progress.total) * 100)}%` }}
                  />
                </div>
              </Module>
            )}
          </div>
        )}

        {!compact && extras.events.length > 0 && (
          <Section title={copy.sheet.events}>
            <ul className="space-y-2.5">
              {extras.events.map((event) => {
                const t = pickTranslation(event.place_event_translations, locale)
                if (!t) return null
                return (
                  <li key={event.id}>
                    <p lang={HTML_LANG[t.locale]} className="text-[0.8rem]">{t.row.title}</p>
                    <p className="text-[0.64rem] text-graphite-soft tabular-nums">
                      {formatCalendarDate(event.starts_at, locale)}
                      {event.ends_at ? ` – ${formatCalendarDate(event.ends_at, locale)}` : ''}
                      {event.status === 'cancelled' ? ' · ✕' : ''}
                    </p>
                  </li>
                )
              })}
            </ul>
          </Section>
        )}

        {!compact && hours.length > 0 && (
          <Section title={copy.place.hours}>
            <Rows rows={hours} practical={place.practical!} />
          </Section>
        )}
        {!compact && fees.length > 0 && (
          <Section title={copy.sheet.fees}>
            <Rows rows={fees} practical={place.practical!} />
          </Section>
        )}
        {!compact && access.length > 0 && (
          <Section title={copy.place.access}>
            <Rows rows={access} practical={place.practical!} />
          </Section>
        )}
        {!compact && place.practical?.asOf && (
          <p className="mt-2 text-[0.6rem] leading-snug tracking-[0.03em] text-graphite-faint">
            {copy.place.asOf(formatCalendarDate(place.practical.asOf, locale))}
          </p>
        )}

        {!compact && !safetyFirst && (extras.safety.length > 0 || extras.safetyFailed) && (
          <SafetySection extras={extras} scope={scope} tabIndex={tabIndex} emphasised={false} />
        )}

        {!compact && place.officialUrl && (
          <a
            href={place.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={tabIndex}
            className="mt-6 flex min-h-11 items-center justify-between rounded-xl px-3.5 text-[0.8rem] tracking-[0.04em] ring-1 ring-graphite/15 outline-none focus-visible:ring-graphite/40"
          >
            {copy.place.official}
            <span aria-hidden className="text-graphite-soft">↗</span>
          </a>
        )}

        {!compact && place.sources.length > 0 && (
          <details className="mt-3 text-[0.62rem] text-graphite-faint">
            <summary tabIndex={tabIndex} className="min-h-9 cursor-pointer py-2 tracking-[0.06em] outline-none">
              {copy.place.sources}
            </summary>
            <ul className="space-y-1 break-all pb-2">
              {place.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} className="underline-offset-2 hover:underline">
                    {source.publisher ? `${source.publisher} — ` : ''}
                    {source.url.replace(/^https:\/\//, '')}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}

        {!compact && others.length > 0 && onOpenOther && (
          <Section title={copy.sheet.otherPlaces}>
            <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {others.map((other) => (
                <li key={other.id} className="w-36 shrink-0">
                  <button
                    type="button"
                    tabIndex={tabIndex}
                    onClick={() => onOpenOther(other.id)}
                    className="block w-full overflow-hidden rounded-xl bg-white/70 text-left ring-1 ring-graphite/[0.08] outline-none focus-visible:ring-graphite/40"
                  >
                    {other.hero ? (
                      <img src={other.hero.src} alt="" loading="lazy" className="block aspect-[4/3] w-full object-cover" />
                    ) : (
                      <span className="block aspect-[4/3] w-full bg-graphite/[0.06]" />
                    )}
                    <span lang="ja" className="block px-2.5 pt-2 text-[0.8rem] tracking-[0.04em] text-graphite">{other.name}</span>
                    <span className="block px-2.5 pb-2 text-[0.52rem] uppercase tracking-[0.18em] text-graphite-soft">{other.nameLatin}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {place.sampleNote && <p className="mt-4 text-[0.56rem] tracking-[0.06em] text-graphite-faint">{place.sampleNote}</p>}
      </div>
    </article>
  )
}

function PlaceHero({ hero, priority, tabIndex }: { hero: Hero; priority: boolean; tabIndex: number }) {
  return (
    <figure className="relative overflow-hidden bg-[#e9e4da]">
      <img
        src={hero.src}
        srcSet={hero.srcSet}
        sizes="(max-width: 480px) 100vw, 480px"
        alt={hero.alt}
        width={800}
        height={500}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="block aspect-[16/10] w-full object-cover saturate-[0.92]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
      <figcaption className="absolute bottom-1.5 right-2 text-[0.54rem] tracking-[0.03em] text-white/90 [text-shadow:0_0_4px_rgba(0,0,0,0.6)]">
        {hero.sourceUrl ? (
          <a href={hero.sourceUrl} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} className="underline-offset-2 hover:underline">
            {hero.credit}
          </a>
        ) : (
          hero.credit
        )}
      </figcaption>
    </figure>
  )
}

/** Official information, kept visibly apart from LINKA's own words. */
function SafetySection({
  extras,
  scope,
  tabIndex,
  emphasised,
}: {
  extras: PlaceExtras
  scope?: { placeId: string; regionId: string | null; regionName: string | null }
  tabIndex: number
  emphasised: boolean
}) {
  const copy = useMessages()
  const { locale } = useLocale()
  const resources = extras.safety
  const byKind = (rows: SafetyResource[]) =>
    [...rows].sort((a, b) => SAFETY_ORDER.indexOf(a.kind as SafetyKind) - SAFETY_ORDER.indexOf(b.kind as SafetyKind) || a.sort - b.sort)
  // The most specific official information first: this district, then the region, then national.
  const groups = [
    { key: 'place', title: copy.safety.scopePlace, rows: byKind(resources.filter((r) => scope && r.place_id === scope.placeId)) },
    {
      key: 'region',
      title: copy.safety.scopeRegion(scope?.regionName ?? ''),
      rows: byKind(resources.filter((r) => r.place_id !== null && (!scope || r.place_id !== scope.placeId))),
    },
    { key: 'national', title: copy.safety.scopeNational, rows: byKind(resources.filter((r) => r.place_id === null)) },
  ].filter((g) => g.rows.length > 0)
  const checked = resources.reduce((latest, r) => (r.checked_at > latest ? r.checked_at : latest), '')

  return (
    <section
      aria-label={copy.safety.title}
      className={cn('mt-7 rounded-2xl px-4 py-4 first:mt-0', emphasised ? 'bg-[#fbf1ec] ring-1 ring-[#b4553c]/30' : 'bg-[#eef1ef] ring-1 ring-graphite/10')}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[0.86rem] tracking-[0.1em]">{copy.safety.title}</h3>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.54rem] uppercase tracking-[0.16em] text-graphite-soft">
          {copy.safety.official}
        </span>
      </div>
      <p className="mt-1.5 text-[0.66rem] leading-snug text-graphite-soft">{copy.safety.intro}</p>
      <p className="mt-1 text-[0.62rem] leading-snug text-graphite-faint">{copy.safety.liveNote}</p>

      {extras.safetyFailed && (
        <p role="alert" className="mt-3 rounded-xl bg-white/80 px-3.5 py-2.5 text-[0.72rem] text-[#a0442c]">{copy.safety.loadFailed}</p>
      )}

      {groups.map((group) => (
        <div key={group.key} className="mt-4">
          <h4 className="text-[0.6rem] uppercase tracking-[0.18em] text-graphite-soft">{group.title}</h4>
          <ul className="mt-1.5 space-y-2">
            {group.rows.map((item) => {
              const summary = item.summary[locale] ?? item.summary.en ?? item.summary.ja ?? ''
              const langs = item.languages.filter(isLocale).map((l: Locale) => copy.language.names[l])
              const kind = copy.safety.kinds[item.kind as SafetyKind] ?? ''
              return (
                <li key={item.id}>
                  {item.phone ? (
                    <a
                      href={`tel:${item.phone.replace(/[^\d#+]/g, '')}`}
                      tabIndex={tabIndex}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white/80 px-3.5 py-2 outline-none ring-1 ring-graphite/10 focus-visible:ring-graphite/40"
                    >
                      <span className="text-[0.74rem] leading-snug">{summary}</span>
                      <span className="shrink-0 text-[1rem] tabular-nums tracking-[0.04em]">{item.phone}</span>
                    </a>
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={tabIndex}
                      className="block min-h-11 rounded-xl bg-white/80 px-3.5 py-2 outline-none ring-1 ring-graphite/10 focus-visible:ring-graphite/40"
                    >
                      <span className="block text-[0.54rem] uppercase tracking-[0.16em] text-graphite-faint">{kind}</span>
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-[0.74rem] leading-snug">{summary}</span>
                        <span aria-hidden className="text-graphite-soft">↗</span>
                      </span>
                      <span className="mt-0.5 block text-[0.58rem] leading-snug text-graphite-faint">
                        {item.publisher}
                        {langs.length > 0 ? ` · ${copy.safety.languages(langs.join(' / '))}` : ''}
                      </span>
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {checked && (
        <p className="mt-3 text-[0.56rem] leading-snug text-graphite-faint">
          {copy.place.asOf(formatCalendarDate(checked, locale))}
        </p>
      )}
    </section>
  )
}

function Rows({ rows, practical }: { rows: Practical['rows']; practical: Practical }) {
  const copy = useMessages()
  return (
    <dl lang={HTML_LANG[practical.locale]} className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.key}>
          {row.key === 'closed' && <dt className="text-[0.6rem] tracking-[0.1em] text-graphite-soft">{copy.place.closed}</dt>}
          <dd className="text-[0.78rem] font-light leading-snug">{row.text}</dd>
        </div>
      ))}
    </dl>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-1.5 text-[0.58rem] uppercase tracking-[0.22em] text-graphite-soft">{title}</h3>
      {children}
    </section>
  )
}

function Module({ children }: { children: ReactNode }) {
  return <div className="rounded-xl bg-white/60 px-3.5 py-2.5 ring-1 ring-graphite/[0.07]">{children}</div>
}

/** ○ before a visit, :))) after — the same marks the map uses. */
function VisitMark({ visited }: { visited: boolean }) {
  return visited ? (
    <svg aria-hidden viewBox="0 0 13 10" className="h-2.5 w-3 text-graphite/60">
      <circle cx="1.6" cy="5" r="1.3" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
        <path d="M4.6 3.1a2.7 2.7 0 0 1 0 3.8" />
        <path d="M7.3 1.7a4.7 4.7 0 0 1 0 6.6" opacity="0.75" />
        <path d="M10 0.6a6.3 6.3 0 0 1 0 8.8" opacity="0.5" />
      </g>
    </svg>
  ) : (
    <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 text-graphite/55">
      <circle cx="5" cy="5" r="3.8" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function pickTranslation<T extends { locale: string }>(rows: T[], locale: Locale): { row: T; locale: Locale } | null {
  for (const l of [locale, 'en', 'ja'] as Locale[]) {
    const row = rows.find((r) => r.locale === l)
    if (row) return { row, locale: l }
  }
  return null
}
