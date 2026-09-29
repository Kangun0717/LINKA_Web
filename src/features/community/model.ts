/**
 * What Community screens render — shaped like the public read model in
 * 20261001100000_community_journal.sql (community_suggestions /
 * community_suggestion / community_suggestion_timeline), plus the viewer's
 * own "would like to go". Never an address, coordinates of the proposer,
 * a user id or a reviewer's note: those do not exist in the public model.
 */

export type SuggestionStatus = 'open' | 'under_review' | 'contacting_partner' | 'approved' | 'published'

export type TimelineEvent = {
  /** ISO date-time. */
  at: string
  kind: 'status' | 'update' | 'milestone'
  status?: SuggestionStatus | 'submitted'
  /** LINKA's public note, per locale. */
  note?: Partial<Record<'ja' | 'en' | 'zh-Hans', string>>
}

export type SuggestionView = {
  id: string
  name: string
  /** The only location shown publicly, written by LINKA (e.g. 佐渡・相川). */
  publicArea: string
  /** An approximate point LINKA set for the map, never the proposer's own. */
  point: { lng: number; lat: number } | null
  reason: string
  status: SuggestionStatus
  supportCount: number
  /** The viewer's own support (signed in only). */
  supportedByMe: boolean
  /** Only when the proposer chose to show their nickname. */
  proposerName: string | null
  /** Approved public photos (community-media). */
  photos: string[]
  openedAt: string
  publishedAt: string | null
  /** Once published: its LINKA place. */
  placeSlug: string | null
  timeline: TimelineEvent[]
}
