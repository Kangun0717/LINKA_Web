import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthContextValue = {
  /** `undefined` while the stored session is still being restored. */
  session: Session | null | undefined
  user: User | null
  /** True until Supabase has reported the initial session state. */
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
