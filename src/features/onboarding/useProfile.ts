import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import { fetchProfile, type Profile } from '@/features/onboarding/api'

/** A settled read, tagged with the user it belongs to. */
type LoadedProfile = {
  userId: string
  profile: Profile | null
  error: unknown
}

type ProfileState = {
  profile: Profile | null
  /** True until the first read for the current user settles. */
  loading: boolean
  error: unknown
  /** Seed state from a row we just wrote, without a second round trip. */
  apply: (profile: Profile) => void
}

/**
 * Loads the signed-in user's profile row and keeps it in sync with the session.
 *
 * The result is tagged with its user id so that "still loading" is derived
 * during render rather than pushed through an extra state update.
 *
 * Routing depends on this, so a failed read is surfaced rather than silently
 * treated as "no profile".
 */
export function useProfile(): ProfileState {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  const [loaded, setLoaded] = useState<LoadedProfile | null>(null)

  const apply = useCallback((profile: Profile) => {
    setLoaded({ userId: profile.id, profile, error: null })
  }, [])

  useEffect(() => {
    if (authLoading || !userId) {
      return
    }

    let active = true

    fetchProfile(userId)
      .then((profile) => {
        if (active) {
          setLoaded({ userId, profile, error: null })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoaded({ userId, profile: null, error })
        }
      })

    return () => {
      active = false
    }
  }, [userId, authLoading])

  const isFresh = loaded !== null && loaded.userId === userId

  return {
    profile: isFresh ? loaded.profile : null,
    loading: authLoading || (userId !== null && !isFresh),
    error: isFresh ? loaded.error : null,
    apply,
  }
}
