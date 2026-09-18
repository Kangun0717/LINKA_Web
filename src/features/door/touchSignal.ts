/**
 * What starts the Door Experience.
 *
 * The sequence is never started by a click handler directly — it is started by
 * a signal. That is the seam between today's in-app trigger and tomorrow's
 * physical Touch Point:
 *
 *   direct : the viewer activated the :))) mark inside LINKA
 *   nfc    : a physical tag opened a LINKA touch URL, which carries the code
 *
 * No Web NFC is involved in either case. A physical tag opens a URL; the URL
 * is the signal. Resolving `/t/:code` is a later sprint — this type is simply
 * ready for it, so the animation never has to learn about touch points.
 */
export type TouchSource = 'direct' | 'nfc'

export type TouchSignal = {
  source: TouchSource
  /** Touch Point code, present only for `nfc` signals. */
  code?: string
}
