import type { Mood } from '@/lib/i18n/journeyMessages'

/** A wash of colour behind a mood, never louder than the photograph. */
export const MOOD_TINT: Record<Mood, string> = {
  joyful: '#f7e7b4',
  calm: '#d6e5ee',
  surprised: '#ead9cf',
  moved: '#efc2b1',
  learned: '#d3e7cd',
  special: '#e6dcf0',
}
