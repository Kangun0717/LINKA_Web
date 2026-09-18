import TouchPointTrigger from '@/features/door/components/TouchPointTrigger'
import WorldBehindDoor from '@/features/door/components/WorldBehindDoor'
import type { DoorState } from '@/features/door/doorTimeline'
import { isAtOrAfter } from '@/features/door/doorTimeline'
import { cn } from '@/lib/cn'

type DoorSceneProps = {
  state: DoorState
  onTouch: () => void
}

/** How far the panel has swung, by state. */
function doorAngle(state: DoorState): number {
  if (isAtOrAfter(state, 'light')) return -104
  if (state === 'opening') return -76
  return 0
}

/**
 * First-person view of a door in a quiet, warm-dark room.
 *
 * The panel is a real 3D rotation on a left hinge rather than an SVG trick, so
 * the opening has genuine parallax against the world behind it — one composited
 * transform, which is what keeps it smooth on a phone.
 */
export default function DoorScene({ state, onTouch }: DoorSceneProps) {
  const isOpening = isAtOrAfter(state, 'opening')

  return (
    <div className="absolute inset-0 mx-auto w-full max-w-[420px] overflow-hidden">
      {/* The room: warm dark, lit only by what leaks around the door. */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_85%_at_50%_40%,#171410_0%,#0d0b0a_58%,#060505_100%)]" />

      {/* Floor, and the warm pool the doorway casts onto it. */}
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.6)_100%)]" />
      <div
        className={cn(
          'absolute bottom-[14%] left-1/2 h-[16%] w-[76%] -translate-x-1/2 rounded-[50%] blur-2xl transition-opacity duration-[1600ms] ease-door',
          'bg-[radial-gradient(closest-side,rgba(226,178,113,0.5)_0%,rgba(226,178,113,0)_100%)]',
          isOpening ? 'opacity-95' : 'opacity-25',
        )}
      />

      {/* Architrave — two hairlines and a lintel imply the wall. */}
      <div className="absolute bottom-[16%] left-[18.5%] top-[10.5%] w-px bg-ink-line" />
      <div className="absolute bottom-[16%] right-[18.5%] top-[10.5%] w-px bg-ink-line" />
      <div className="absolute left-[18.5%] right-[18.5%] top-[10.5%] h-px bg-ink-line" />

      {/* The doorway aperture. */}
      <div
        className="absolute bottom-[18%] left-[21%] right-[21%] top-[13%]"
        style={{ perspective: '1400px' }}
      >
        <div className="absolute inset-0 overflow-hidden bg-[#0a0908]">
          <WorldBehindDoor state={state} />
        </div>

        {/* Reveal jamb: the frame's inner edge catching the new light. */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 transition-opacity duration-[1200ms]',
            'shadow-[inset_2px_0_6px_-2px_rgba(0,0,0,0.85),inset_0_2px_6px_-2px_rgba(0,0,0,0.85)]',
            isOpening ? 'opacity-100' : 'opacity-0',
          )}
        />

        {/* The panel. */}
        <div
          className="absolute inset-0 origin-left transition-transform duration-[1450ms] ease-door"
          style={{
            transform: `rotateY(${doorAngle(state)}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <svg
            viewBox="0 0 100 170"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full"
          >
            <defs>
              <linearGradient id="linka-door-face" x1="0" y1="0" x2="1" y2="0.2">
                <stop offset="0%" stopColor="#1b1714" />
                <stop offset="55%" stopColor="#141211" />
                <stop offset="100%" stopColor="#0f0d0c" />
              </linearGradient>
            </defs>

            <rect width="100" height="170" fill="url(#linka-door-face)" />

            {/* Two recessed panels. Hairlines only — no bevel clipart. */}
            <g fill="none" stroke="#2b2622" strokeWidth="0.6">
              <rect x="12" y="12" width="76" height="74" rx="1.5" />
              <rect x="12" y="98" width="76" height="60" rx="1.5" />
            </g>
            <g fill="none" stroke="#070605" strokeWidth="0.6" opacity="0.9">
              <rect x="13" y="13.4" width="76" height="74" rx="1.5" />
              <rect x="13" y="99.4" width="76" height="60" rx="1.5" />
            </g>

            {/* Vertical grain, barely there. */}
            <g stroke="#221e1b" strokeWidth="0.35" opacity="0.55">
              <path d="M28 6 L28 164" />
              <path d="M52 6 L52 164" />
              <path d="M74 6 L74 164" />
            </g>
          </svg>

          {/* Light creeping around the opening edge of the panel. */}
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 right-0 w-8 transition-opacity duration-700',
              'bg-[linear-gradient(to_left,rgba(253,246,232,0.5)_0%,rgba(253,246,232,0)_100%)]',
              state === 'reaching' || isOpening ? 'opacity-70' : 'opacity-0',
            )}
          />

          {/* Lever handle, kept out of the stretched SVG so it stays true. */}
          <div aria-hidden className="absolute right-[7%] top-[52%] -translate-y-1/2">
            <div className="h-11 w-[9px] rounded-full bg-[linear-gradient(to_bottom,#544e46_0%,#8c8478_45%,#3d3833_100%)]" />
            <div className="absolute -left-[30px] top-1/2 h-[7px] w-[34px] -translate-y-1/2 rounded-full bg-[linear-gradient(to_bottom,#a49b8e_0%,#7d7568_55%,#413c36_100%)]" />
            <div className="absolute -left-[30px] top-1/2 h-[2px] w-[30px] -translate-y-[6px] rounded-full bg-sand/25" />
          </div>

          <TouchPointTrigger state={state} onTouch={onTouch} />
        </div>
      </div>

      {/* Vignette, drawn last so it sits over everything in the room. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(115%_75%_at_50%_45%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  )
}
