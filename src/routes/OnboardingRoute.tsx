import { Navigate } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { isProfileComplete } from '@/features/onboarding/api'
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'
import { useProfileContext } from '@/features/onboarding/useProfileContext'

/** Connects the onboarding form to the shared profile state. */
export default function OnboardingRoute() {
  const { profile, loading, apply } = useProfileContext()

  if (loading) {
    return <LoadingScreen label="Loading your profile" />
  }

  if (isProfileComplete(profile)) {
    return <Navigate to="/home" replace />
  }

  return <OnboardingScreen profile={profile} onSaved={apply} />
}
