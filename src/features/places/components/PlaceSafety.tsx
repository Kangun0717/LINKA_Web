import { useRef } from 'react'

import Sheet from '@/components/ui/Sheet'
import type { PlaceExtras } from '@/data/places'
import type { SafetyResource } from '@/features/places/api'
import { cn } from '@/lib/cn'
import type { SafetyKind } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate, isLocale, type Locale } from '@/lib/i18n/locale'
import { useMessages } from '@/lib/i18n/useMessages'

export type SafetyScope = { placeId: string; regionId: string | null; regionName: string | null }

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
 * Japan's two emergency numbers. Their labels are always Japanese + English,
 * whatever the interface language — the words on signs and on the line. The
 * rows themselves (and their attribution) come from `safety_resources`; this
 * only decides which two lead and how they are named.
 */
const EMERGENCY_LINES: readonly { phone: string; label: string }[] = [
  { phone: '110', label: '警察 / Police' },
  { phone: '119', label: '消防・救急 / Fire / Ambulance' },
]

/** What leads the card: the local authority's own warnings / evacuation page. */
const PRIMARY_KINDS: SafetyKind[] = ['alerts', 'evacuation', 'weather_warnings']

/**
 * The one local official link to show first: the most urgent kind (warnings,
 * then evacuation sites, then weather warnings), and within a kind the most
 * specific scope (this district before the region). National rows never lead.
 */
function primaryResource(resources: SafetyResource[], scope?: SafetyScope): SafetyResource | null {
  const rank = (r: SafetyResource) => [
    PRIMARY_KINDS.indexOf(r.kind as SafetyKind),
    scope && r.place_id === scope.placeId ? 0 : 1,
    r.sort,
  ]
  const local = resources.filter((r) => r.place_id !== null && !r.phone && PRIMARY_KINDS.includes(r.kind as SafetyKind))
  return local.sort((a, b) => {
    const [x, y] = [rank(a), rank(b)]
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
  })[0] ?? null
}

/**
 * Official information, kept visibly apart from LINKA's own words.
 *
 * Collapsed on the card: the local authority's warnings / evacuation page
 * and the two emergency numbers — what someone needs in the first minute.
 * Everything else the official sources offer (shelters, #7119, the visitor
 * hotline, hazard maps, national and multilingual resources) is one tap away
 * in the full list. LINKA shows no alert status of its own and says so.
 */
export default function PlaceSafety({
  extras,
  scope,
  tabIndex,
  emphasised,
}: {
  extras: PlaceExtras
  scope?: SafetyScope
  tabIndex: number
  emphasised: boolean
}) {
  const copy = useMessages()
  const dialog = useRef<HTMLDialogElement>(null)
  const resources = extras.safety
  const primary = primaryResource(resources, scope)
  const lines = EMERGENCY_LINES.flatMap((line) => {
    const row = resources.find((r) => r.place_id === null && r.phone === line.phone)
    return row ? [{ ...line, row }] : []
  })
  const lineSources = [...new Set(lines.map((l) => l.row.publisher))]

  return (
    <section
      aria-label={copy.safety.title}
      className={cn('mt-7 rounded-2xl px-4 py-4 first:mt-0', emphasised ? 'bg-[#fbf1ec] ring-1 ring-[#b4553c]/30' : 'bg-[#eef1ef] ring-1 ring-graphite/10')}
    >
      <SafetyHeading />
      <p className="mt-1.5 text-[0.62rem] leading-snug text-graphite-faint">{copy.safety.liveNote}</p>

      {extras.safetyFailed && (
        <p role="alert" className="mt-3 rounded-xl bg-white/80 px-3.5 py-2.5 text-[0.72rem] text-[#a0442c]">{copy.safety.loadFailed}</p>
      )}

      {primary && (
        <div className="mt-3">
          <SafetyLink item={primary} tabIndex={tabIndex} />
        </div>
      )}

      {lines.length > 0 && (
        <>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {lines.map((line) => (
              <li key={line.phone}>
                <a
                  href={`tel:${line.phone}`}
                  tabIndex={tabIndex}
                  className="flex min-h-14 flex-col justify-center rounded-xl bg-white/80 px-3.5 py-2 outline-none ring-1 ring-graphite/10 focus-visible:ring-graphite/40"
                >
                  <span className="text-[1.2rem] leading-none tabular-nums tracking-[0.06em]">{line.phone}</span>
                  <span lang="ja" className="mt-1 text-[0.6rem] leading-tight text-graphite-soft">{line.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[0.54rem] leading-snug text-graphite-faint">{copy.safety.source(lineSources.join(' · '))}</p>
        </>
      )}

      {resources.length > 0 && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            tabIndex={tabIndex}
            aria-haspopup="dialog"
            onClick={() => dialog.current?.showModal()}
            className="min-h-11 px-1 text-[0.72rem] tracking-[0.04em] text-graphite-soft underline decoration-graphite/25 underline-offset-4 outline-none focus-visible:text-graphite"
          >
            {copy.safety.viewAll}
          </button>
        </div>
      )}

      <Sheet ref={dialog} label={copy.safety.title} heading={<SafetyHeading />}>
        <SafetyList resources={resources} scope={scope} />
      </Sheet>
    </section>
  )
}

function SafetyHeading() {
  const copy = useMessages()
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[0.86rem] tracking-[0.1em]">{copy.safety.title}</h3>
      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.54rem] uppercase tracking-[0.16em] text-graphite-soft">
        {copy.safety.official}
      </span>
    </div>
  )
}

/** The complete official list: this district, then the region, then national — with its "as of" date. */
function SafetyList({ resources, scope }: { resources: SafetyResource[]; scope?: SafetyScope }) {
  const copy = useMessages()
  const { locale } = useLocale()
  const byKind = (rows: SafetyResource[]) =>
    [...rows].sort((a, b) => SAFETY_ORDER.indexOf(a.kind as SafetyKind) - SAFETY_ORDER.indexOf(b.kind as SafetyKind) || a.sort - b.sort)
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
    <>
      <p className="mt-1.5 text-[0.66rem] leading-snug text-graphite-soft">{copy.safety.intro}</p>
      <p className="mt-1 text-[0.62rem] leading-snug text-graphite-faint">{copy.safety.liveNote}</p>

      {groups.map((group) => (
        <div key={group.key} className="mt-4">
          <h4 className="text-[0.6rem] uppercase tracking-[0.18em] text-graphite-soft">{group.title}</h4>
          <ul className="mt-1.5 space-y-2">
            {group.rows.map((item) => (
              <li key={item.id}>
                {item.phone ? (
                  <a
                    href={`tel:${item.phone.replace(/[^\d#+]/g, '')}`}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white/80 px-3.5 py-2 outline-none ring-1 ring-graphite/10 focus-visible:ring-graphite/40"
                  >
                    <span className="text-[0.74rem] leading-snug">
                      {EMERGENCY_LINES.find((l) => l.phone === item.phone)?.label ?? summaryOf(item, locale)}
                    </span>
                    <span className="shrink-0 text-[1rem] tabular-nums tracking-[0.04em]">{item.phone}</span>
                  </a>
                ) : (
                  <SafetyLink item={item} tabIndex={0} />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {checked && (
        <p className="mt-3 text-[0.56rem] leading-snug text-graphite-faint">
          {copy.place.asOf(formatCalendarDate(checked, locale))}
        </p>
      )}
    </>
  )
}

function summaryOf(item: SafetyResource, locale: Locale): string {
  return item.summary[locale] ?? item.summary.en ?? item.summary.ja ?? ''
}

/** One official page: what it is, LINKA's one-line description, who publishes it. */
function SafetyLink({ item, tabIndex }: { item: SafetyResource; tabIndex: number }) {
  const copy = useMessages()
  const { locale } = useLocale()
  const langs = item.languages.filter(isLocale).map((l: Locale) => copy.language.names[l])
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      className="block min-h-11 rounded-xl bg-white/80 px-3.5 py-2 outline-none ring-1 ring-graphite/10 focus-visible:ring-graphite/40"
    >
      <span className="block text-[0.54rem] uppercase tracking-[0.16em] text-graphite-faint">{copy.safety.kinds[item.kind as SafetyKind] ?? ''}</span>
      <span className="flex items-start justify-between gap-3">
        <span className="text-[0.74rem] leading-snug">{summaryOf(item, locale)}</span>
        <span aria-hidden className="text-graphite-soft">↗</span>
      </span>
      <span className="mt-0.5 block text-[0.58rem] leading-snug text-graphite-faint">
        {item.publisher}
        {langs.length > 0 ? ` · ${copy.safety.languages(langs.join(' / '))}` : ''}
      </span>
    </a>
  )
}
