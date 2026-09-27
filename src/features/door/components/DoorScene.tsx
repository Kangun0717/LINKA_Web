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
 * A pale door in a bright, almost empty room — drawn, not rendered.
 *
 * Everything here is line: a floor, a frame, a plain panel, and nothing else.
 * The room is warm off-white and already full of daylight before anything
 * happens, so opening the door is a change of degree rather than a reveal of
 * a different world. What little shading exists is sunlight and its shadow.
 *
 * The stage is locked to the illustration's own 5:9 aspect so every percentage
 * position below lands exactly where the line art's 400x720 viewBox puts it.
 * That single constraint is what lets the drawing stay one drawing across
 * phone, tablet and desktop instead of drifting apart at the seams.
 */
export default function DoorScene({ state, onTouch }: DoorSceneProps) {
  const isOpening = isAtOrAfter(state, 'opening')
  const isFlooding = isAtOrAfter(state, 'light')

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative aspect-[5/9] h-full w-auto max-w-full">
        {/* Daylight already in the room, falling from somewhere off to the left. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_14%_8%,#fdfaf4_0%,#f7f2e9_46%,#efe8dc_100%)]" />

        {/* A window's worth of sun lying across the floor. Sunlight, not glow. */}
        <div
          aria-hidden
          className="absolute left-[-6%] top-[70%] h-[22%] w-[46%] bg-[#fffdf7] opacity-70 blur-[10px]"
          style={{ clipPath: 'polygon(14% 0%, 74% 0%, 100% 100%, 0% 100%)' }}
        />

        {/* The doorway's own shadow, pooling to the right of the frame. */}
        <div
          aria-hidden
          className={cn(
            'absolute bottom-[19.5%] left-[24%] h-[3.5%] w-[56%] rounded-[50%] bg-[#cfc4b2] blur-[9px]',
            'transition-opacity duration-[1600ms] ease-door',
            isOpening ? 'opacity-25' : 'opacity-55',
          )}
        />

        {/* Light spilling out across the floor towards the viewer. */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-x-0 bottom-0 top-[77.9%] blur-[7px] transition-opacity duration-[1600ms] ease-door',
            'bg-[linear-gradient(to_bottom,rgba(255,253,246,0.96)_0%,rgba(255,252,242,0.55)_45%,rgba(255,252,242,0)_100%)]',
            isOpening ? 'opacity-100' : 'opacity-0',
          )}
          style={{ clipPath: 'polygon(27% 0%, 73% 0%, 94% 100%, 6% 100%)' }}
        />

        {/* Before it opens, the only clue: a seam of light beneath the door. */}
        <div
          aria-hidden
          className={cn(
            'absolute bottom-[21.6%] left-[27%] h-[0.5%] w-[46%] bg-[#fffdf6] blur-[2px] transition-opacity duration-700',
            isOpening ? 'opacity-0' : 'opacity-90',
          )}
        />

        {/* The doorway. */}
        <div
          className="absolute bottom-[22.1%] left-[27%] right-[27%] top-[15.3%] overflow-hidden"
          style={{ perspective: '1500px' }}
        >
          <WorldBehindDoor state={state} />

          {/* The panel, on a real left hinge so the opening has depth. */}
          <div
            className="absolute inset-0 origin-left transition-transform duration-[1450ms] ease-door"
            style={{
              transform: `rotateY(${doorAngle(state)}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <svg
              viewBox="0 0 184 451"
              className="absolute inset-0 size-full"
              aria-hidden
              focusable="false"
            >
              {/* Pale neutral, barely warmer than the wall, shaded at the hinge. */}
              <defs>
                <linearGradient id="linka-door-face" x1="0" y1="0" x2="1" y2="0.08">
                  <stop offset="0%" stopColor="#e6ddcd" />
                  <stop offset="34%" stopColor="#f1ebe0" />
                  <stop offset="100%" stopColor="#f7f2e9" />
                </linearGradient>
              </defs>

              <rect width="184" height="451" fill="url(#linka-door-face)" />

              <g
                className="ink-line"
                fill="none"
                stroke="#3a352f"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.78"
              >
                {/* Outer contour. It does not quite meet the frame, on purpose. */}
                <path d="M3.5 449 C2.4 340 4.2 190 2.8 3 L181 2.2 C182.4 150 180.6 320 181.6 449.4" />

                {/* Two inset panels — a plain door, drawn in four strokes each. */}
                <path d="M26 34.5 C70 33, 120 35.4, 158.5 33.8" />
                <path d="M158.6 34 C160 80, 157.8 140, 159.2 186.5" />
                <path d="M159 186.8 C118 188.4, 66 186, 25.4 187.6" />
                <path d="M25.6 187.2 C24.2 140, 26.4 82, 25 34.2" />

                <path d="M25.4 254 C68 252.6, 118 255, 158.8 253.4" />
                <path d="M159 253.6 C160.2 296, 158 356, 159.4 412.6" />
                <path d="M159.2 412.8 C116 414.4, 66 412, 25.2 413.6" />
                <path d="M25.4 413.2 C24 356, 26.2 298, 24.8 253.8" />
              </g>

              {/* The handle: a lever and its rose, four lines and no more. */}
              <g
                className="ink-line"
                fill="none"
                stroke="#3a352f"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.82"
              >
                <ellipse cx="164" cy="225" rx="7.4" ry="8" />
                <path d="M158 224.4 C150 223.6, 141 225.4, 134.5 227.2" />
                <path d="M158.4 229 C151 228.6, 143 230, 136.4 231.4" />
                <path d="M134.2 226.6 C131.4 227.4, 131 231, 134 231.8" />
              </g>

              {/* Sunlight catching the opening edge as the panel swings away. */}
              <rect
                x="168"
                y="0"
                width="16"
                height="451"
                fill="#fffdf6"
                className={cn(
                  'transition-opacity duration-700',
                  state === 'reaching' || isOpening ? 'opacity-55' : 'opacity-0',
                )}
              />
            </svg>

            <TouchPointTrigger state={state} onTouch={onTouch} />
          </div>
        </div>

        {/*
          The room's own lines, drawn over everything so the frame reads as one
          continuous contour rather than a border around a hole.
        */}
        <svg
          viewBox="0 0 400 720"
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden
          focusable="false"
          fill="none"
        >
          <g
            className="ink-line"
            stroke="#3a352f"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          >
            {/* Floor. One line is the whole room. */}
            <path d="M6 560.6 C90 557.9, 170 562.3, 244 559.7 S350 558.6, 394 561.6" />

            {/* Architrave. */}
            <path d="M96.6 561 C95.2 470, 97.4 300, 95.8 99.2" />
            <path d="M94.4 98.2 C160 95.6, 244 99.2, 306.2 97.4" />
            <path d="M304.6 98.4 C306.2 250, 303.4 420, 305.4 561.4" />

            {/* The reveal — the frame's inner edge, where the door sits. */}
            <path d="M108.2 560.6 C107 460, 109 280, 107.6 110.4" />
            <path d="M106.8 110.2 C170 107.8, 238 111.4, 293.4 109.6" />
            <path d="M292.2 110 C293.6 260, 291.4 430, 292.8 560.8" />
          </g>

          {/* Skirting, fainter — enough to say "room", not enough to furnish it. */}
          <g
            className="ink-line"
            stroke="#3a352f"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.34"
          >
            <path d="M8 547.4 C40 545.8, 68 548.6, 94 546.8" />
            <path d="M307 547 C336 548.8, 364 545.6, 392 547.4" />
          </g>
        </svg>

        {/* The barest vignette, warm — paper edges, never a dark frame. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(118%_80%_at_50%_44%,rgba(0,0,0,0)_58%,rgba(186,170,144,0.16)_100%)]" />

        {/* As the light floods, the drawing gives itself up to it. */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-paper-lit transition-opacity ease-door',
            isFlooding ? 'opacity-70 duration-[700ms]' : 'opacity-0 duration-[900ms]',
          )}
        />
      </div>
    </div>
  )
}
