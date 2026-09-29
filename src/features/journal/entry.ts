import type { JourneyEntry } from '@/data/journey'
import { formatJournalDate } from '@/features/journal/model'
import type { MemoryPhotoRow, MemoryRecord } from '@/features/memories/api'
import { formatCalendarDate, type Locale } from '@/lib/i18n/locale'

/** What a journal entry shows, from either kind — a verified visit or a past entry. */
export type EntryFace = {
  verified: boolean
  /** A LINKA place's own name, or the person's own words. */
  name: string
  /** The second line (a verified name or romanization), when the place is a LINKA place. */
  second: string | null
  slug: string | null
  /** Shown date, as precisely as it is known; null when the person gave none. */
  date: string | null
  /** For the ink stamp: 2026.09.29 / 2019.08 / 2018. */
  stamp: string | null
  year: string | null
  photos: MemoryPhotoRow[]
}

export function faceOf(entry: JourneyEntry, locale: Locale): EntryFace {
  const memory = entry.memory
  const photos = orderedPhotos(memory)
  if (entry.kind === 'visit') {
    return {
      verified: true,
      name: entry.place.name,
      second: entry.place.nameLatin,
      slug: entry.place.slug,
      date: formatCalendarDate(entry.visit.local_date, locale),
      stamp: entry.visit.local_date.replaceAll('-', '.'),
      year: entry.visit.local_date.slice(0, 4),
      photos,
    }
  }
  const stamp = entry.date ? (entry.precision === 'year' ? entry.date.slice(0, 4) : entry.precision === 'month' ? entry.date.slice(0, 7).replace('-', '.') : entry.date.replaceAll('-', '.')) : null
  return {
    verified: false,
    name: entry.place?.name ?? entry.label ?? '',
    second: entry.place?.nameLatin ?? null,
    slug: entry.place?.slug ?? null,
    date: entry.date ? formatJournalDate(entry.date, entry.precision, locale) : null,
    stamp,
    year: entry.date?.slice(0, 4) ?? null,
    photos,
  }
}

/** A memory's photographs, cover first, then in their chosen order. */
export function orderedPhotos(memory: MemoryRecord | null): MemoryPhotoRow[] {
  if (!memory) return []
  return [...memory.memory_photos].sort((a, b) => {
    if (a.id === memory.cover_photo_id) return -1
    if (b.id === memory.cover_photo_id) return 1
    return a.position - b.position
  })
}
