import type { DoorState } from '@/features/door/doorTimeline'

const INK = '#3a352f'
const SKIN = '#f8e7d7'

/**
 * One digit: a tube with a drawn edge.
 *
 * Stroking the same spine twice — ink first at a slightly greater width, then
 * skin over it — gives a rounded, evenly outlined finger that follows any
 * curve, which authoring two offset contours by hand never quite does. Drawing
 * the digits back to front then makes the nearer ones overlap correctly, and
 * the gaps between them are just where two edges meet.
 */
function Digit({ d, width }: { d: string; width: number }) {
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={INK}
        strokeWidth={width + 3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path
        d={d}
        fill="none"
        stroke={SKIN}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

/*
 * Fingers, pinky first so the index — nearest the eye — ends up on top. Every
 * spine is measured off one knuckle line, placed so the closed fist centres on
 * the lever the door actually draws at y=335, x 239..266. Lengths are graded
 * (middle longest, pinky shortest) and each finger is fanned a few degrees, so
 * the hand opens rather than splays.
 *
 * The scale is taken from the door rather than guessed. The panel is 184 units
 * for a real ~90cm door, so a unit is about half a centimetre and an 8.5cm hand
 * is ~17 units across — doubled to 38 because the hand is roughly twice as
 * close to the eye as the door is. Drawn any larger it stops being a hand in a
 * room and becomes a hand with a room behind it.
 */
const EXTENDED = [
  { width: 8.5, d: 'M 298.8 326.8 Q 286.7 306.4 279.5 298.8' },
  { width: 10, d: 'M 291.8 335.2 Q 274.3 314.6 264.2 306.3' },
  { width: 11, d: 'M 284.6 343.4 Q 262.4 324.5 249.6 316.7' },
  { width: 11, d: 'M 277.1 351.5 Q 253.7 337.0 241.0 332.0' },
]

/* The same knuckles, each finger folded at its proximal joint onto the lever. */
const CURLED = [
  { width: 8.5, d: 'M 298.8 326.8 L 285.0 306.8 Q 283.3 304.3 280.1 316.2' },
  { width: 10, d: 'M 291.8 335.2 L 272.6 315.1 Q 270.5 312.9 268.4 327.7' },
  { width: 11, d: 'M 284.6 343.4 L 260.6 325.1 Q 258.2 323.3 258.1 340.1' },
  { width: 11, d: 'M 277.1 351.5 L 252.1 338.0 Q 249.5 336.6 252.1 351.8' },
]

/* Shorter, thicker, lower-jointed and clear of the index — so it reads thumb. */
const THUMB_EXTENDED = 'M 283.0 354.0 Q 270.0 350.0 257.0 343.0'
const THUMB_CURLED = 'M 283.0 354.0 Q 272.0 347.0 268.0 336.0'

const PALM =
  'M 267.4 346.3 Q 277.0 329.4 292.6 317.7 Q 310.0 332.8 321.9 352.4 ' +
  'Q 307.8 356.4 289.2 356.5 Q 276.5 355.0 267.4 346.3 Z'
const FOREARM =
  'M 289.2 356.5 C 286.2 436.5, 311.3 578.1, 319.3 748.1 ' +
  'L 384.7 739.9 C 380.7 559.9, 329.9 442.4, 321.9 352.4 Z'

type Pose = 'away' | 'reach' | 'approach' | 'open'

type PoseSpec = {
  transform: string
  /** Transform timing — the hand travelling. */
  ms: number
  delay: number
  opacity: number
  /** Opacity timing, kept separate so a pose can move first and fade later. */
  fadeMs: number
  fadeDelay: number
}

/**
 * Where the hand sits for each beat, and how long it takes to get there.
 *
 * These are CSS transition lengths, not sequence timings — the state machine
 * and its durations are untouched. What they buy is ordering the state machine
 * does not express: the fingers close late in `reaching` (see `gripDelay`), so
 * the handle is already held when `opening` begins and the panel starts to
 * move. Grabbing a handle after the door has started swinging is the one thing
 * that would give the whole sequence away.
 *
 * The fade in `open` is the honest answer to a real problem. The panel is a 3D
 * `rotateY` on a left hinge, so its handle sweeps away from the viewer on a
 * path no 2D transform can follow. The hand tracks it for the first third of
 * the swing — close enough, since both use the same duration and easing — and
 * is gone before the divergence could be noticed.
 */
const POSES: Record<Pose, PoseSpec> = {
  away: {
    transform: 'translate3d(3%, 30%, 0) scale(0.94)',
    ms: 500,
    delay: 0,
    opacity: 0,
    fadeMs: 420,
    fadeDelay: 0,
  },
  reach: {
    transform: 'translate3d(4%, 11%, 0) scale(0.96)',
    ms: 340,
    delay: 0,
    opacity: 1,
    fadeMs: 260,
    fadeDelay: 0,
  },
  approach: {
    transform: 'translate3d(0.8%, 2%, 0) scale(0.995)',
    ms: 780,
    delay: 0,
    opacity: 1,
    fadeMs: 260,
    fadeDelay: 0,
  },
  open: {
    // Matches the panel's own 1450ms swing exactly, so the two move as one.
    transform: 'translate3d(-16%, -2.5%, 0) rotate(-5deg) scale(0.97)',
    ms: 1450,
    delay: 0,
    opacity: 0,
    fadeMs: 560,
    fadeDelay: 280,
  },
}

function poseFor(state: DoorState): Pose {
  if (state === 'touching') return 'reach'
  if (state === 'reaching') return 'approach'
  if (state === 'opening') return 'open'
  return 'away'
}

/**
 * The first-person hand, drawn in the same pen as the room.
 *
 * Built from landmarks rather than freehand: a knuckle line, four graded
 * fingers fanned off it, an opposing thumb with a real bend, and a forearm that
 * widens toward the frame edge because it is coming at the eye. Everything is
 * thin outline over a very light warm fill — no silhouette, and no anatomy
 * past two creases, which is where a drawn hand starts becoming an illustration
 * of one.
 *
 * Four poses, two drawings. Extended and curled fingers are both drawn and
 * crossfaded; everything else — palm, thumb root, forearm — is shared and never
 * moves, because closing a hand does not move the arm. REACH and APPROACH are
 * the extended drawing at two positions, GRIP and OPEN the curled one.
 *
 * It holds no phone. The viewer's real phone performed the physical Touch, and
 * this is the digital self answering by taking the handle.
 *
 * Its stage is locked to the same 5:9 aspect as `DoorScene` so the fingers meet
 * the drawn handle at every viewport size.
 */
export default function FirstPersonHand({ state }: { state: DoorState }) {
  const pose = poseFor(state)
  const { transform, ms, delay, opacity, fadeMs, fadeDelay } = POSES[pose]
  /*
   * The hand closes near the end of `reaching`, not at the start of `opening`:
   * 440ms into that 800ms state, while it is settling onto the handle and the
   * panel has not begun to move.
   */
  const isClosed = pose === 'approach' || pose === 'open'
  const gripDelay = pose === 'approach' ? 440 : 0

  /*
   * Asymmetric on purpose: the open hand leaves faster than the fist arrives,
   * so the two drawings are never both half-visible. Overlap them evenly and
   * the grip reads as a dissolve between two hands instead of one closing.
   */
  const extended = {
    opacity: isClosed ? 0 : 1,
    transition: `opacity 160ms var(--ease-door) ${gripDelay}ms`,
  }
  const curled = {
    opacity: isClosed ? 1 : 0,
    transition: `opacity 240ms var(--ease-door) ${gripDelay}ms`,
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div className="relative aspect-[5/9] h-full w-auto max-w-full">
        <div
          className="absolute inset-0 origin-bottom-right"
          style={{
            transform,
            transitionProperty: 'transform',
            transitionDuration: `${ms}ms`,
            transitionDelay: `${delay}ms`,
            transitionTimingFunction: 'var(--ease-door)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              opacity,
              transitionProperty: 'opacity',
              transitionDuration: `${fadeMs}ms`,
              transitionDelay: `${fadeDelay}ms`,
              transitionTimingFunction: 'var(--ease-door)',
            }}
          >
            <svg viewBox="0 0 400 720" className="absolute inset-0 size-full" focusable="false">
              {/* Its shadow on the door: soft, short and warm, as daylight makes them. */}
              <g transform="translate(9 7)" opacity="0.24" filter="url(#linka-soft-shadow)">
                <path d={FOREARM} fill="#c2b49c" />
                <path d={PALM} fill="#c2b49c" />
              </g>

              {/* Forearm. Narrow at the wrist, widening as it comes at the eye. */}
              <g className="ink-line">
                <path d={FOREARM} fill={SKIN} />
                <g fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" opacity="0.8">
                  <path d="M 289.2 356.5 C 286.2 436.5, 311.3 578.1, 319.3 748.1" />
                  <path d="M 321.9 352.4 C 329.9 442.4, 380.7 559.9, 384.7 739.9" />
                </g>
              </g>

              <g style={extended}>
                <g className="ink-line">
                  {EXTENDED.map((finger) => (
                    <Digit key={finger.d} d={finger.d} width={finger.width} />
                  ))}
                </g>
              </g>

              <g style={curled}>
                <g className="ink-line">
                  {CURLED.map((finger) => (
                    <Digit key={finger.d} d={finger.d} width={finger.width} />
                  ))}
                </g>
              </g>

              {/* Back of the hand, laid over the finger bases to hide the joins. */}
              <g className="ink-line">
                <path d={PALM} fill={SKIN} />
                {/*
                  Only the two side edges are stroked. Closing this path would
                  draw a line straight across the knuckles, which is the single
                  thing that makes a drawn hand look assembled from parts.
                */}
                <g fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" opacity="0.8">
                  <path d="M 267.4 346.3 Q 276.5 355.0 289.2 356.5" />
                  <path d="M 292.6 317.7 Q 310.0 332.8 321.9 352.4" />
                </g>

                {/* Two creases. A third would start describing a person. */}
                <g fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.24">
                  <path d="M 276.8 349.2 Q 284.3 337.8 291.0 331.0" />
                  <path d="M 283.6 354.2 Q 290.3 344.0 297.0 337.0" />
                </g>
              </g>

              {/* Thumb, drawn last: it is the nearest thing to the eye. */}
              <g className="ink-line">
                <g style={extended}>
                  <Digit d={THUMB_EXTENDED} width={13} />
                </g>
                <g style={curled}>
                  <Digit d={THUMB_CURLED} width={13} />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
