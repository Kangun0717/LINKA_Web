import type { PlaceRecord, TranslationRow } from '@/features/places/api'
import { isLocale, type Locale } from '@/lib/i18n/locale'

/**
 * A place, as one language presents it.
 *
 * Fallback is explicit and field by field. The native name is never
 * translated and always leads. For text, the requested language is used when
 * it exists; otherwise English, then Japanese (a district name, for Chinese
 * readers, prefers the Japanese kanji over romaji) — and the result says which
 * language it actually is, so the interface can say so rather than pass one
 * language off as another. Nothing is invented to fill a gap.
 */

/** Text, and the language it is really written in. */
export type LocalizedText = {
  text: string
  locale: Locale
  /** True when this is not the language that was asked for. */
  fallback: boolean
}

export type PracticalKey = 'hours' | 'closed' | 'admission' | 'access'

export type Practical = {
  rows: { key: PracticalKey; text: string }[]
  /** `YYYY-MM-DD`: when this was last confirmed — time-sensitive, so shown. */
  asOf: string | null
  locale: Locale
  fallback: boolean
}

export type Hero = {
  /** 800 px wide — the card. */
  src: string
  /** `src` plus the 1600 px version, for high-density screens. */
  srcSet: string
  alt: string
  credit: string
  sourceUrl: string | null
  license: string | null
  licenseUrl: string | null
}

export type LocalizedPlace = {
  id: string
  slug: string
  kind: string
  parentId: string | null
  /** The place's own name, first, always. */
  name: string
  /** The second line: a verified name in this language, or a romanization. */
  nameLatin: string
  locality: string | null
  summary: LocalizedText | null
  practical: Practical | null
  officialUrl: string | null
  sources: { url: string; publisher: string | null }[]
  lat: number
  lng: number
  timezone: string
  labelSide: 'left' | 'right' | 'below' | undefined
  discoverable: boolean
  hero: Hero | null
}

const FALLBACK_ORDER: Locale[] = ['en', 'ja']
const PRACTICAL_KEYS: PracticalKey[] = ['hours', 'closed', 'admission', 'access']

export function localizePlace(place: PlaceRecord, locale: Locale): LocalizedPlace {
  const byLocale = new Map<Locale, TranslationRow>()
  for (const row of place.place_translations) if (isLocale(row.locale)) byLocale.set(row.locale, row)

  const order = [locale, ...FALLBACK_ORDER.filter((l) => l !== locale)]
  const first = <T>(pick: (row: TranslationRow) => T | null | undefined, within: readonly Locale[] = order) => {
    for (const l of within) {
      const row = byLocale.get(l)
      const value = row ? pick(row) : null
      if (value !== null && value !== undefined && value !== '') return { value, locale: l }
    }
    return null
  }

  const summary = first((row) => row.short_description)
  const practical = first((row) => practicalRows(row.practical_info))
  // A district name reads better in kanji than in romaji for a Chinese reader.
  const locality = locale === 'zh-Hans' ? first((row) => row.locality, ['zh-Hans', 'ja', 'en']) : first((row) => row.locality)

  // Japanese readers see the English name second (日本 · JAPAN); everyone
  // else sees their own verified name, or the romanization when there is none.
  const secondLocale: Locale = locale === place.native_locale ? 'en' : locale
  const nameLatin = byLocale.get(secondLocale)?.name ?? place.romanized_name ?? place.native_name

  return {
    id: place.id,
    slug: place.slug,
    kind: place.kind,
    parentId: place.parent_id,
    name: place.native_name,
    nameLatin,
    locality: locality?.value ?? null,
    summary: summary && { text: summary.value, locale: summary.locale, fallback: summary.locale !== locale },
    practical: practical && {
      rows: practical.value,
      asOf: byLocale.get(practical.locale)?.practical_info_as_of ?? null,
      locale: practical.locale,
      fallback: practical.locale !== locale,
    },
    officialUrl: place.official_url,
    sources: place.place_sources.map(({ url, publisher }) => ({ url, publisher })),
    lat: place.latitude,
    lng: place.longitude,
    timezone: place.timezone,
    labelSide: place.label_side === 'left' || place.label_side === 'right' || place.label_side === 'below'
      ? place.label_side
      : undefined,
    discoverable: place.discovery_enabled && place.kind === 'destination',
    hero: heroOf(place, first((row) => (row as TranslationRow & { hero_image_alt?: string | null }).hero_image_alt)?.value ?? null),
  }
}

function practicalRows(info: unknown): Practical['rows'] | null {
  if (!info || typeof info !== 'object') return null
  const record = info as Record<string, unknown>
  const rows = PRACTICAL_KEYS.flatMap((key) =>
    typeof record[key] === 'string' && record[key] ? [{ key, text: record[key] as string }] : [],
  )
  return rows.length > 0 ? rows : null
}

/**
 * The place's photograph. A path starting with "/" is an image shipped with
 * the app (`/places/<slug>` → -800.jpg / -1600.jpg); anything else is an
 * object in the public place-media bucket. No image is shown without a credit.
 */
function heroOf(place: PlaceRecord, alt: string | null): Hero | null {
  const path = place.hero_image_path
  if (!path || !place.hero_image_credit) return null

  const base = path.startsWith('/')
    ? path
    : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/place-media/${path}`
  return {
    src: `${base}-800.jpg`,
    srcSet: `${base}-800.jpg 800w, ${base}-1600.jpg 1600w`,
    alt: alt ?? '',
    credit: place.hero_image_credit,
    sourceUrl: place.hero_image_source_url ?? null,
    license: place.hero_image_license ?? null,
    licenseUrl: place.hero_image_license_url ?? null,
  }
}
