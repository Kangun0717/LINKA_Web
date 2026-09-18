import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY)
  query.addEventListener('change', onChange)

  return () => query.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

/**
 * Whether the viewer has asked for reduced motion.
 *
 * Read through `useSyncExternalStore` so the value is correct on the very
 * first render — the door sequence branches on it before anything animates.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
