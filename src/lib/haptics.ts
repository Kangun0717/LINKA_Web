/**
 * A single short pulse acknowledging a Touch, where the device supports it.
 *
 * Silently does nothing everywhere else — haptics are a bonus, never part of
 * the sequence's timing or state.
 */
export function pulse(durationMs = 12): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs)
    }
  } catch {
    // Some browsers throw when vibration is blocked by permissions policy.
  }
}
