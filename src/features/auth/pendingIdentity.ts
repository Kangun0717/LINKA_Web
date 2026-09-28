import type { Identity } from '@/features/auth/api'

const STORAGE_KEY = 'linka.auth.pending-identity'

/**
 * The email or phone a code was just sent to, held across the send → verify step.
 *
 * Kept in `sessionStorage` rather than router state so a refresh on the
 * verification screen does not force the user to start over. It is cleared as
 * soon as a session exists.
 */
export const pendingIdentity = {
  read(): Identity | null {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      const value = raw ? (JSON.parse(raw) as Identity) : null
      if (value?.kind === 'email' && typeof value.email === 'string') return value
      if (value?.kind === 'phone' && typeof value.phone === 'string') return value
      return null
    } catch {
      return null
    }
  },

  write(identity: Identity): void {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
    } catch {
      // Private browsing can refuse storage; the verify screen still works
      // within the same navigation.
    }
  },

  clear(): void {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to do.
    }
  },
}

export function describeIdentity(identity: Identity): string {
  return identity.kind === 'email' ? identity.email : identity.phone
}
