/**
 * A single ring leaving the Touch Point.
 *
 * One ripple, once — acknowledgement of a real-world touch, not a loading
 * animation. It is purely decorative, so it is hidden from assistive tech.
 */
export default function TouchRipple() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 animate-ripple rounded-full border border-glow/70"
    />
  )
}
