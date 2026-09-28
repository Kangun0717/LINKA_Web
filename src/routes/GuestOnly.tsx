import { Navigate, Outlet } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { useAuth } from '@/features/auth/useAuth'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { nextStepFor } from '@/routes/nextStep'

/**
 * Create account, sign in and forgot password.
 *
 * A returning user with a persisted session never sees them — they are sent
 * straight on, which is what "no code again" means in practice. While the
 * stored session is being restored the screen stays on the Door's paper, so
 * a signed-in visitor never glimpses the sign-in screens.
 */
export default function GuestOnly() {
  const { session, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfileContext()

  if (authLoading) {
    return <LoadingScreen label="Opening LINKA" tone="paper" />
  }

  if (!session) {
    return <Outlet />
  }

  if (profileLoading) {
    return <LoadingScreen label="Opening LINKA" tone="paper" />
  }

  return <Navigate to={nextStepFor(session.user, profile)} replace />
}
