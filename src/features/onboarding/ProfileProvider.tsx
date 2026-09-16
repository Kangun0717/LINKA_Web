import { useMemo, type ReactNode } from 'react'

import { ProfileContext, type ProfileContextValue } from '@/features/onboarding/ProfileContext'
import { useProfile } from '@/features/onboarding/useProfile'

/**
 * Publishes the signed-in user's profile once for the whole tree.
 *
 * Route guards and the home screen all need it, and reading it per-route would
 * mean a round trip on every navigation.
 */
export default function ProfileProvider({ children }: { children: ReactNode }) {
  const { profile, loading, error, apply } = useProfile()

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, loading, error, apply }),
    [profile, loading, error, apply],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
