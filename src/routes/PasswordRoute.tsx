import { Navigate } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { hasPassword } from '@/features/auth/api'
import SetPasswordScreen from '@/features/auth/screens/SetPasswordScreen'
import { useAuth } from '@/features/auth/useAuth'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { nextStepFor } from '@/routes/nextStep'

/** /auth/password is only for an account that has no password yet. */
export default function PasswordRoute() {
  const { user } = useAuth()
  const { profile, loading } = useProfileContext()

  if (user && hasPassword(user)) {
    if (loading) return <LoadingScreen label="Opening LINKA" tone="paper" />
    return <Navigate to={nextStepFor(user, profile)} replace />
  }

  return <SetPasswordScreen />
}
