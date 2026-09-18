/**
 * The seven states of the entrance, and how long each one holds.
 *
 * Timings live here alone so the choreography can be tuned without reading a
 * single component. All motion is CSS keyed off the current state.
 */
export type DoorState =
  | 'idle'
  | 'touching'
  | 'reaching'
  | 'opening'
  | 'light'
  | 'brand'
  | 'complete'

/** Full choreography, from acknowledgement to the brand landing. */
export const FULL_SEQUENCE: DoorState[] = [
  'touching',
  'reaching',
  'opening',
  'light',
  'brand',
  'complete',
]

/**
 * Reduced motion: no hand, no swing, no ripple. The brand simply arrives.
 * Same destination, same routing, roughly a second and a half.
 */
export const REDUCED_SEQUENCE: DoorState[] = ['brand', 'complete']

/** How long each state holds before advancing, in milliseconds. */
export const FULL_TIMINGS: Record<string, number> = {
  touching: 350,
  reaching: 800,
  opening: 1450,
  light: 700,
  brand: 2000,
}

export const REDUCED_TIMINGS: Record<string, number> = {
  brand: 1200,
}

export function sequenceFor(reducedMotion: boolean): DoorState[] {
  return reducedMotion ? REDUCED_SEQUENCE : FULL_SEQUENCE
}

export function timingsFor(reducedMotion: boolean): Record<string, number> {
  return reducedMotion ? REDUCED_TIMINGS : FULL_TIMINGS
}

/** Ordering helper so components can express "at this state or later". */
export function isAtOrAfter(state: DoorState, target: DoorState): boolean {
  const order: DoorState[] = [
    'idle',
    'touching',
    'reaching',
    'opening',
    'light',
    'brand',
    'complete',
  ]

  return order.indexOf(state) >= order.indexOf(target)
}
