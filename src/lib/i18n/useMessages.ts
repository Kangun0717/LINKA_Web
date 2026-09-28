import { useLocale } from '@/lib/i18n/LocaleContext'
import { MESSAGES, type Messages } from '@/lib/i18n/messages'

/**
 * The interface copy for the current language.
 *
 * Its own module so the message table is bundled with the screens that speak
 * (My World, the Touch screen) rather than with the Door, which says nothing.
 */
export function useMessages(): Messages {
  return MESSAGES[useLocale().locale]
}
