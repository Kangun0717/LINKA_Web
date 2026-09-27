import { Navigate, Outlet } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { isProfileComplete } from '@/features/onboarding/api'
import { useProfileContext } from '@/features/onboarding/useProfileContext'

/** Home is only reachable once the user has a nickname. */
export default function RequireProfile() {
  const { profile, loading } = useProfileContext()

  if (loading) {
    return <LoadingScreen label="Loading your world" tone="paper" />
  }

  if (!isProfileComplete(profile)) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
