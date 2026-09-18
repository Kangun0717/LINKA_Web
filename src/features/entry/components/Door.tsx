import TouchPointMark from '@/components/brand/TouchPointMark'

/**
 * Placeholder composition for the physical Touch Point.
 *
 * Concentric rings read as a doorway waiting to be touched. Sprint 1B replaces
 * this with the cinematic NFC reveal; the surrounding layout stays as-is.
 */
export default function Door() {
  return (
    <div aria-hidden className="relative mx-auto flex size-56 items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-ink-line" />
      <span className="absolute inset-6 rounded-full border border-ink-line/70" />
      <span className="absolute inset-12 rounded-full border border-ink-line/40" />
      <span className="absolute inset-12 rounded-full bg-glow/10 blur-2xl" />
      <TouchPointMark size="lg" className="relative text-sand/90" />
    </div>
  )
}
