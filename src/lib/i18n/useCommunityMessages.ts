import { COMMUNITY_APP_MESSAGES, type CommunityAppMessages } from '@/lib/i18n/communityAppMessages'
import { COMMUNITY_MESSAGES, type CommunityMessages } from '@/lib/i18n/communityMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'

export type CommunityCopy = CommunityMessages & CommunityAppMessages

const COPY = {
  en: { ...COMMUNITY_MESSAGES.en, ...COMMUNITY_APP_MESSAGES.en },
  ja: { ...COMMUNITY_MESSAGES.ja, ...COMMUNITY_APP_MESSAGES.ja },
  'zh-Hans': { ...COMMUNITY_MESSAGES['zh-Hans'], ...COMMUNITY_APP_MESSAGES['zh-Hans'] },
} satisfies Record<string, CommunityCopy>

/**
 * The words of Community, the Journal and Contributions, in the reader's
 * language. Kept out of `useMessages()` on purpose: only these screens import
 * this module, so the Door's bundle never carries their text.
 */
export function useCommunityMessages(): CommunityCopy {
  return COPY[useLocale().locale]
}
