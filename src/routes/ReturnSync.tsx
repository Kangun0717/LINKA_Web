import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { pendingReturn } from '@/features/auth/pendingReturn'
import { useAuth } from '@/features/auth/useAuth'

/** Once a signed-in person has arrived back where they were going, the return is spent. */
export default function ReturnSync() {
  const { pathname, search } = useLocation()
  const { session } = useAuth()
  useEffect(() => {
    if (session && pendingReturn.read() === `${pathname}${search}`) pendingReturn.clear()
  }, [session, pathname, search])
  return null
}
