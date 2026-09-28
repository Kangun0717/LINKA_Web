import { Navigate, Outlet } from 'react-router-dom'

import { hasPassword } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'

/**
 * Onboarding and the app need an account with a password. Sits inside
 * RequireSession, so a user is always present here.
 */
export default function RequirePassword() {
  const { user } = useAuth()

  if (user && !hasPassword(user)) {
    return <Navigate to="/auth/password" replace />
  }

  return <Outlet />
}
