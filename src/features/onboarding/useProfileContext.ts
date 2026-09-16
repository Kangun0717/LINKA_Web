import { useContext } from 'react'

import { ProfileContext, type ProfileContextValue } from '@/features/onboarding/ProfileContext'

export function useProfileContext(): ProfileContextValue {
  const value = useContext(ProfileContext)

  if (!value) {
    throw new Error('useProfileContext must be used inside <ProfileProvider>.')
  }

  return value
}
