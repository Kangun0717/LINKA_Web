/**
 * Every word My World says. Kept together, like `doorCopy`, so the voice can
 * be tuned without touching the choreography.
 */
export const WORLD_COPY = {
  title: 'My World',
  /** Zero touches only — a whisper, not an empty state. */
  quiet: 'Your world appears where you touch.',
  back: 'Back',
  /** A place seen from afar. Never says visited, never says checked in. */
  discovery: {
    notVisited: 'Not visited yet',
    activities: 'Things to do',
    language: 'Language',
    languages: { en: 'English', ja: '日本語' },
    close: 'Close',
    sample: 'Sample information for the prototype — not live or official.',
    a11y: (name: string, nameLatin: string) => `${name}, ${nameLatin}, not visited yet`,
  },
  a11y: {
    world: 'Your world',
    quietWorld: 'Your world has not been revealed yet.',
    place: (name: string, locality: string | null, date: string) =>
      [name, locality, `touched ${date}`].filter(Boolean).join(', '),
    enter: (name: string, nameLatin: string) => `Enter ${name}, ${nameLatin}`,
    backTo: (name: string) => `Back to ${name}`,
    country: (name: string, nameLatin: string) => `${name}, ${nameLatin}`,
    localMap: (name: string, nameLatin: string) => `${name}, ${nameLatin}, a hand-drawn map`,
    discoverable: (name: string, nameLatin: string) => `${name}, ${nameLatin}, not visited yet`,
    photo: (name: string) => `Your photo at ${name}`,
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
