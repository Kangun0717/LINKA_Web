import { EMPTY_WORLD, type WorldPlace, type WorldSnapshot } from '@/features/world/model/types'

/**
 * DEV PREVIEW ONLY — design scenarios for /preview/my-world.
 *
 * None of this is anyone's history. It exists so the three states can be
 * judged without an account, and it is reachable only through the dev-only
 * preview route: nothing in the world's model, data or production screens
 * imports it. Deleting this folder and that route removes it completely.
 */

const SADO: WorldPlace = {
  id: 'preview-sado',
  name: 'トキの森公園',
  locality: 'Sado, Niigata',
  lat: 38.065,
  lng: 138.44,
  firstTouchedAt: '2026-08-06T11:20:00+09:00',
  lastTouchedAt: '2026-08-06T11:20:00+09:00',
}

const TOKYO: WorldPlace = {
  id: 'preview-tokyo',
  name: '代々木公園',
  locality: 'Shibuya, Tokyo',
  lat: 35.672,
  lng: 139.695,
  firstTouchedAt: '2026-05-02T16:05:00+09:00',
  lastTouchedAt: '2026-05-02T16:05:00+09:00',
}

const KYOTO: WorldPlace = {
  id: 'preview-kyoto',
  name: '哲学の道',
  locality: 'Sakyō, Kyoto',
  lat: 35.02,
  lng: 135.794,
  firstTouchedAt: '2026-09-12T09:40:00+09:00',
  lastTouchedAt: '2026-09-12T09:40:00+09:00',
}

const EDINBURGH: WorldPlace = {
  id: 'preview-edinburgh',
  name: 'Calton Hill',
  locality: 'Edinburgh, Scotland',
  lat: 55.955,
  lng: -3.183,
  firstTouchedAt: '2025-03-14T10:30:00+00:00',
  lastTouchedAt: '2025-03-14T10:30:00+00:00',
}

export type PreviewState = 'zero' | 'first' | 'many'

export type WorldPreview = {
  snapshot: WorldSnapshot
  /** The place whose arrival plays when the preview opens. */
  arrivalPlaceId: string | null
}

export const WORLD_PREVIEWS: Record<PreviewState, WorldPreview> = {
  zero: { snapshot: EMPTY_WORLD, arrivalPlaceId: null },
  first: {
    snapshot: { places: [SADO], recentPlaceId: SADO.id },
    arrivalPlaceId: SADO.id,
  },
  many: {
    snapshot: { places: [EDINBURGH, TOKYO, SADO, KYOTO], recentPlaceId: KYOTO.id },
    arrivalPlaceId: null,
  },
}

export function isPreviewState(value: string | null): value is PreviewState {
  return value === 'zero' || value === 'first' || value === 'many'
}
