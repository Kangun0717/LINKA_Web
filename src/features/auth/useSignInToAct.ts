import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { pendingReturn } from '@/features/auth/pendingReturn'

/**
 * For a guest's action that needs an account: remember this page, then go to
 * sign in. After signing in (or creating an account) they come back here.
 */
export function useSignInToAct(): (to?: '/auth/signin' | '/auth/signup') => void {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  return useCallback(
    (to = '/auth/signin') => {
      pendingReturn.write(`${pathname}${search}`)
      navigate(to)
    },
    [navigate, pathname, search],
  )
}
