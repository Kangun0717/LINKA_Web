import { createContext } from 'react'

import type { Profile } from '@/features/onboarding/api'

export type ProfileContextValue = {
  profile: Profile | null
  /** True while the session or the profile row is still being resolved. */
  loading: boolean
  /** Set when the profile row could not be read (for example, blocked by RLS). */
  error: unknown
  /** Seed state from a row we just wrote, without a second round trip. */
  apply: (profile: Profile) => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)
