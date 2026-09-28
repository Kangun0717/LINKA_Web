/**
 * The languages LINKA speaks. Tags match `place_translations.locale` and
 * `profiles.preferred_locale`, so a choice made here is the key used there.
 */
export const LOCALES = ['ja', 'en', 'zh-Hans'] as const

export type Locale = (typeof LOCALES)[number]

/** Each language named in itself — never translated. */
export const LOCALE_NAMES: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
  'zh-Hans': '简体中文',
}

/** The `lang` attribute for text in this locale. */
export const HTML_LANG: Record<Locale, string> = { ja: 'ja', en: 'en', 'zh-Hans': 'zh-Hans' }

const STORAGE_KEY = 'linka.locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** The browser's own preference, mapped onto the three we have. */
export function browserLocale(): Locale {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const lower = tag.toLowerCase()
    if (lower.startsWith('ja')) return 'ja'
    // Traditional Chinese is not offered yet; it reads Simplified better than English.
    if (lower.startsWith('zh')) return 'zh-Hans'
    if (lower.startsWith('en')) return 'en'
  }
  return 'en'
}

/** The choice this device last made, if any. */
export const storedLocale = {
  read(): Locale | null {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY)
      return isLocale(value) ? value : null
    } catch {
      return null
    }
  },
  write(locale: Locale): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // Private browsing: the choice still holds for this visit.
    }
  },
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * A calendar date — `2026-09-28` — as this locale writes it.
 *
 * It takes the date string, not a timestamp: a Touch keeps the date at the
 * place where it happened (`touch_events.local_date`), so nothing here may
 * consult the viewer's time zone. English is spelled out rather than left to
 * `Intl`, whose en-GB September is "Sept".
 */
export function formatCalendarDate(isoDate: string, locale: Locale): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return isoDate

  if (locale === 'en') return `${String(day).padStart(2, '0')} ${MONTHS_EN[month - 1]} ${year}`
  return `${year}年${month}月${day}日`
}
