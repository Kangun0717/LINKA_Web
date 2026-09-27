/**
 * Every word the Door Experience shows.
 *
 * Isolated deliberately: this copy is temporary and will change, and changing
 * it must never mean touching animation logic.
 */
export const DOOR_COPY = {
  wordmark: 'LINKA',
  /** Temporary brand line for the prototype. Expected to be replaced. */
  slogan: 'Touch the world. Make it yours.',

  /** Accessible names — not shown on screen. */
  a11y: {
    trigger: 'Touch the LINKA Touch Point to enter',
    handle: 'Open the door',
    triggerHint: 'Development trigger. In the shipped product this is a physical Touch Point.',
    opening: 'Opening LINKA',
    skip: 'Skip',
  },
} as const
