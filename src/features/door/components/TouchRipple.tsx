/**
 * A single ring leaving the sticker.
 *
 * One ripple, once — acknowledgement of a real-world touch, not a loading
 * animation. Drawn in ink rather than light, because on paper the ring that
 * reads as a touch is the one a pen would make. Purely decorative, so it is
 * hidden from assistive tech.
 */
export default function TouchRipple() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 animate-ripple rounded-full border border-graphite/45"
    />
  )
}
