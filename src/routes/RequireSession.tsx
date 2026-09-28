import { Navigate, Outlet } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { useAuth } from '@/features/auth/useAuth'

/** Everything behind the door needs a Supabase session. */
export default function RequireSession() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Restoring your session" tone="paper" />
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
