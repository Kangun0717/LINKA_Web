/**
 * Where a place's card sits, relative to its Touch Point.
 *
 * Deterministic and deliberately simple — no collision engine. The card hangs
 * from the mark: its small :))) primitive lines up beneath (or above) the
 * mark's dot, so the two read as one thing without a callout triangle. It
 * opens below the mark when there is room above the navigation, otherwise
 * above it, and always stays clear of the header and the screen's edges.
 */

/** Distance from the card's left edge to the centre of its primitive's dot. */
export const CARD_PRIMITIVE_INSET = 18

const GUTTER = 14
/** Between the mark's centre and the card's nearest edge. */
const GAP = 24
/** Clear of the "My World" header. */
const TOP_LIMIT = 96
/** Clear of the navigation. */
const BOTTOM_CLEARANCE = 92

export type CardPlacement = {
  left: number
  top: number
  /** Which side of the mark the card opened on — sets where it grows from. */
  side: 'below' | 'above'
}

export function placeCard(
  mark: { x: number; y: number },
  stage: { width: number; height: number },
  card: { width: number; height: number },
): CardPlacement {
  const maxLeft = stage.width - card.width - GUTTER
  const left = Math.max(GUTTER, Math.min(mark.x - CARD_PRIMITIVE_INSET, maxLeft))

  const below = mark.y + GAP
  if (below + card.height <= stage.height - BOTTOM_CLEARANCE) {
    return { left, top: below, side: 'below' }
  }

  return { left, top: Math.max(TOP_LIMIT, mark.y - GAP - card.height), side: 'above' }
}

/** The quiet name label sits beside the mark, on whichever side has room. */
export function labelSide(markX: number, stageWidth: number): 'right' | 'left' {
  return markX > stageWidth * 0.62 ? 'left' : 'right'
}
