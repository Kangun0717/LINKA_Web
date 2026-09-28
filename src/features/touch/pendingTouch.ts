const STORAGE_KEY = 'linka.touch.pending'
/** Long enough to create an account; short enough that a stale tap never resurfaces. */
const TTL_MS = 30 * 60 * 1000

/**
 * The Touch Point someone tapped before they were signed in.
 *
 * Signing in (or creating an account) takes several screens; this is what
 * brings them back to the same Touch Point afterwards instead of to Home. It
 * lives in `sessionStorage` — the tab that opened the NFC URL is the tab that
 * signs in — and expires on its own.
 */
export const pendingTouch = {
  read(): string | null {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const { id, at } = JSON.parse(raw) as { id?: unknown; at?: unknown }
      if (typeof id !== 'string' || typeof at !== 'number' || Date.now() - at > TTL_MS) return null
      return id
    } catch {
      return null
    }
  },

  write(publicId: string): void {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: publicId, at: Date.now() }))
    } catch {
      // Private browsing: the user lands on Home after signing in instead.
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

/** `/t/:publicId` — the URL written into a physical tag. */
export function touchPath(publicId: string): string {
  return `/t/${encodeURIComponent(publicId)}`
}
