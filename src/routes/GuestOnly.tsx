import { Navigate, Outlet } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { useAuth } from '@/features/auth/useAuth'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { nextStepFor } from '@/routes/nextStep'

/**
 * The door, the reveal and the OTP screens.
 *
 * A returning user with a persisted session never sees them — they are sent
 * straight on, which is what "no OTP again" means in practice.
 */
export default function GuestOnly() {
  const { session, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfileContext()

  if (authLoading) {
    return <LoadingScreen label="Opening LINKA" />
  }

  if (!session) {
    return <Outlet />
  }

  if (profileLoading) {
    return <LoadingScreen label="Opening LINKA" />
  }

  return <Navigate to={nextStepFor(profile)} replace />
}
