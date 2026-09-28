import { Navigate, Outlet } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { hasPassword } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { isProfileComplete } from '@/features/onboarding/api'
import { useProfileContext } from '@/features/onboarding/useProfileContext'

/**
 * Screens a guest may open too: the public map, and the Moments / Me pages
 * (which show a guest a sign-in gate rather than a redirect).
 *
 * Signed out: render as a guest. Signed in: the account must be finished
 * first — a password, then a nickname — exactly as the member-only guards
 * require; an unfinished account is sent to finish it.
 */
export default function MemberOrGuest() {
  const { session, user, loading } = useAuth()
  const { profile, loading: profileLoading } = useProfileContext()

  if (loading || (session && profileLoading)) {
    return <LoadingScreen label="Opening LINKA" tone="paper" />
  }

  if (session && user) {
    if (!hasPassword(user)) return <Navigate to="/auth/password" replace />
    if (!isProfileComplete(profile)) return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
