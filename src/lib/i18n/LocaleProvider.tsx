import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { savePreferredLocale } from '@/features/onboarding/api'
import { useAuth } from '@/features/auth/useAuth'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { LocaleContext, type LocaleContextValue } from '@/lib/i18n/LocaleContext'
import { browserLocale, HTML_LANG, isLocale, storedLocale, type Locale } from '@/lib/i18n/locale'

/**
 * The current language, for the whole app.
 *
 * Precedence: a choice made on this device → the account's saved preference
 * → the browser's language. Choosing saves to both the device and, when
 * signed in, the profile, so the next device starts in the same language.
 * Switching re-renders; nothing reloads.
 */
export default function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { profile, apply } = useProfileContext()
  const [chosen, setChosen] = useState<Locale | null>(() => storedLocale.read())

  const saved = isLocale(profile?.preferred_locale) ? profile.preferred_locale : null
  const locale = chosen ?? saved ?? browserLocale()

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale]
  }, [locale])

  const setLocale = useCallback(
    (next: Locale) => {
      setChosen(next)
      storedLocale.write(next)
      if (user && profile && profile.preferred_locale !== next) {
        // Best effort: the device already remembers it; a failed write only
        // means another device will not pick it up yet.
        void savePreferredLocale(user.id, next).then(apply, () => {})
      }
    },
    [user, profile, apply],
  )

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
