import type { Messages } from '@/lib/i18n/messages'

/**
 * A country's or area's second name, in the reader's language — JAPAN / SADO
 * in English and Japanese, and nothing in Chinese, where the name is already
 * written the same way (日本, 佐渡) and repeating it would only be noise.
 */
export function regionSecondName(
  region: { id: string; name: string; nameLatin: string },
  copy: Messages,
): string | null {
  const second = copy.regions[region.id] ?? region.nameLatin
  return second === region.name ? null : second
}
