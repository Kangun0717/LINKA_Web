const STORAGE_KEY = 'linka.return.pending'
/** Long enough to create an account; short enough that a stale return never resurfaces. */
const TTL_MS = 30 * 60 * 1000

/** Only these may be returned to: LINKA's own pages, never an address from outside. */
const ALLOWED = /^\/(community|moments|me|place)(\/[\w\-/%.]*)?(\?[\w\-=&%.]*)?$/

/**
 * Where a guest was when an action needed an account — "I'd like to go",
 * "Suggest a place", "Add a memory" — so that signing in (or creating an
 * account) brings them back there instead of to Home. Like the pending
 * Touch, it lives in this tab's sessionStorage and expires on its own.
 */
export const pendingReturn = {
  read(): string | null {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown }
      if (typeof path !== 'string' || typeof at !== 'number' || Date.now() - at > TTL_MS || !ALLOWED.test(path)) return null
      return path
    } catch {
      return null
    }
  },

  write(path: string): void {
    if (!ALLOWED.test(path)) return
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path, at: Date.now() }))
    } catch {
      // Private browsing: they land on Home after signing in instead.
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
