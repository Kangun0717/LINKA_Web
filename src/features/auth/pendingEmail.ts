const STORAGE_KEY = 'linka.auth.pending-email'

/**
 * The address a code was just sent to, held across the email → verify step.
 *
 * Kept in `sessionStorage` rather than router state so a refresh on the
 * verification screen does not force the user to start over. It is cleared as
 * soon as a session exists.
 */
export const pendingEmail = {
  read(): string | null {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  },

  write(email: string): void {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, email)
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
