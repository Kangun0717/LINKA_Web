import type { Mood } from '@/lib/i18n/journeyMessages'
import { formatCalendarDate, type Locale } from '@/lib/i18n/locale'

/**
 * One journal entry, as the Journal shows it. Two kinds, never confused:
 *
 *   verified — a memory of a Visit made with a physical LINKA Touch
 *   past     — the person's own record of a place and time; no Touch, no Visit
 *
 * Only `verified` entries may colour the map, count as verified places or
 * reach visitor analytics (that is enforced by the database: a past entry
 * has no visit). The Journal shows both with equal care, differently marked.
 */
export type JournalEntryView = {
  id: string
  kind: 'verified' | 'past'
  /** A LINKA place (native name) or the person's own words. */
  placeName: string
  placeSecond: string | null
  placeSlug: string | null
  point: { lng: number; lat: number } | null
  /** verified: the visit's local date. past: what the person chose. */
  date: string
  datePrecision: 'day' | 'month' | 'year'
  mood: Mood | null
  text: string | null
  /** Cover first. */
  photos: { src: string; width: number; height: number }[]
}

/** A date as precisely as it is known: 29 Sep 2026 · Aug 2019 · 2018. */
export function formatJournalDate(date: string, precision: JournalEntryView['datePrecision'], locale: Locale): string {
  const [y, m] = date.split('-').map(Number)
  if (precision === 'year') return locale === 'en' ? String(y) : `${y}年`
  if (precision === 'month') {
    return locale === 'en' ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}` : `${y}年${m}月`
  }
  return formatCalendarDate(date, locale)
}
