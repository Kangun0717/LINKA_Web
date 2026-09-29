import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

/**
 * A small keyed cache for server data — deliberately not a library.
 *
 * Every key is either `public:…` (published places, safety links: the same
 * for everyone) or `private:<user id>:…` (one person's visits, memories,
 * suggestions). Private keys carry the user they belong to, and
 * `resetPrivateData()` — called whenever the signed-in account changes —
 * drops every private entry, so one account's data can never be served to
 * another, even from a request that was still in flight.
 *
 * Reads are shared: any number of screens asking for the same key make one
 * request. `invalidate()` refetches in place (the old value stays on screen
 * until the new one arrives); `update()` writes a value the app already knows.
 */

type Entry = {
  data?: unknown
  error?: unknown
  promise?: Promise<unknown>
  /** When the data arrived (ms); stale after the key's time-to-live. */
  at?: number
  stale: boolean
  /** A new object on every change, so React sees one. */
  snapshot: Snapshot<unknown>
  listeners: Set<() => void>
  /** Set by the screens showing this key: how to fetch it again. */
  refetch?: () => Promise<unknown>
}

export type Snapshot<T> = { data: T | undefined; error: unknown; loading: boolean }

const IDLE: Snapshot<never> = { data: undefined, error: null, loading: false }
const entries = new Map<string, Entry>()
const resetHooks = new Set<() => void>()

function entryOf(key: string): Entry {
  let entry = entries.get(key)
  if (!entry) {
    entry = { stale: true, snapshot: { data: undefined, error: null, loading: true }, listeners: new Set() }
    entries.set(key, entry)
  }
  return entry
}

function publish(entry: Entry) {
  entry.snapshot = { data: entry.data, error: entry.error ?? null, loading: entry.promise !== undefined && entry.data === undefined }
  for (const listener of entry.listeners) listener()
}

/** Fetch a key (once, however many callers), keeping the result for `ttlMs`. */
export function load<T>(key: string, fetcher: () => Promise<T>, ttlMs = Infinity): Promise<T> {
  const entry = entryOf(key)
  const fresh = !entry.stale && entry.at !== undefined && Date.now() - entry.at < ttlMs
  if (fresh) return Promise.resolve(entry.data as T)
  if (entry.promise) return entry.promise as Promise<T>

  const promise = fetcher().then(
    (data) => {
      // Dropped while in flight (the account changed): leave no trace.
      if (entries.get(key) !== entry) return data
      Object.assign(entry, { data, error: null, at: Date.now(), stale: false, promise: undefined })
      publish(entry)
      return data
    },
    (error: unknown) => {
      if (entries.get(key) === entry) {
        Object.assign(entry, { error, promise: undefined })
        publish(entry)
      }
      throw error
    },
  )
  entry.promise = promise
  publish(entry)
  return promise
}

/** Refetch every key starting with `prefix` that someone is showing; forget the rest. */
export function invalidate(prefix: string) {
  for (const [key, entry] of entries) {
    if (!key.startsWith(prefix)) continue
    entry.stale = true
    if (entry.listeners.size === 0) entries.delete(key)
    else if (entry.refetch) void entry.refetch().catch(() => {})
  }
}

/** Write a value the app already knows (e.g. the row a save returned). */
export function update<T>(key: string, change: (current: T | undefined) => T) {
  const entry = entries.get(key)
  if (!entry || entry.data === undefined) return
  entry.data = change(entry.data as T)
  publish(entry)
}

/** Forget everything private: called when the signed-in account changes. */
export function resetPrivateData() {
  for (const key of [...entries.keys()]) if (key.startsWith('private:')) entries.delete(key)
  for (const hook of resetHooks) hook()
}

/** Other private caches (e.g. signed photo URLs) register to be cleared with the rest. */
export function onPrivateReset(hook: () => void) {
  resetHooks.add(hook)
}

export const privateKey = (userId: string, name: string) => `private:${userId}:${name}`

/**
 * Subscribe to a key. `key: null` means "nothing to load" (a guest asking for
 * private data): no request, no data, not loading.
 */
export function useResource<T>(key: string | null, fetcher: () => Promise<T>, ttlMs = Infinity): Snapshot<T> & { reload: () => void } {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!key) return () => {}
      const entry = entryOf(key)
      entry.listeners.add(listener)
      return () => entry.listeners.delete(listener)
    },
    [key],
  )
  const snapshot = useSyncExternalStore(subscribe, () => (key ? entryOf(key).snapshot : IDLE)) as Snapshot<T>

  // A key names everything its fetcher reads, so a new fetcher for the same
  // key never means new data: keep the latest one without refetching.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    if (!key) return
    const entry = entryOf(key)
    entry.refetch = () => load(key, () => fetcherRef.current(), 0)
    load(key, () => fetcherRef.current(), ttlMs).catch(() => {})
  }, [key, ttlMs])

  const reload = useCallback(() => {
    if (key) invalidate(key)
  }, [key])

  return { ...snapshot, reload }
}
