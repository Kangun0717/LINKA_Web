/**
 * Every word My World says. Kept together, like `doorCopy`, so the voice can
 * be tuned without touching the choreography.
 */
export const WORLD_COPY = {
  title: 'My World',
  /** Zero touches only — a whisper, not an empty state. */
  quiet: 'Your world appears where you touch.',
  a11y: {
    world: 'Your world',
    quietWorld: 'Your world has not been revealed yet.',
    place: (name: string, locality: string | null, date: string) =>
      [name, locality, `touched ${date}`].filter(Boolean).join(', '),
  },
} as const

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * "06 Aug 2026". Spelled out rather than left to `Intl`, whose en-GB month
 * for September is "Sept". Uses the viewer's calendar day; locale-aware dates,
 * and dating a touch by the place's own time zone, come later.
 */
export function formatTouchDate(iso: string): string {
  const date = new Date(iso)
  const day = String(date.getDate()).padStart(2, '0')

  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}
