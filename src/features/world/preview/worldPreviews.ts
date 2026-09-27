import {
  EMPTY_WORLD,
  type DiscoveryPlace,
  type MemoryPhoto,
  type WorldPlace,
  type WorldSnapshot,
} from '@/features/world/model/types'
import kinzanMemory from '@/features/world/preview/photos/kinzan-memory.jpg'
import tokiDiscovery from '@/features/world/preview/photos/toki-discovery.jpg'
import tokiMemory from '@/features/world/preview/photos/toki-memory.jpg'

/**
 * DEV PREVIEW ONLY — design scenarios for /preview/my-world.
 *
 * None of this is anyone's history, and none of the discovery content is live
 * or official: it is sample text and openly licensed photographs, there so the
 * states can be judged without an account. It is reachable only through the
 * dev-only preview route — nothing in the world's model, data or production
 * screens imports it — so deleting this folder and that route removes it.
 *
 * Photographs (Wikimedia Commons):
 *   toki-memory.jpg    — "Nipponia nippon Sado Toki Hogo Center 1", Totti, CC BY-SA 4.0
 *   toki-discovery.jpg — "Nipponia Nippon in Sado Ibis Conservation Center", rhodnite, CC BY 2.0
 *   kinzan-memory.jpg  — "Dōyū no Warito (under angle)", Indiana jo, CC0
 */

const TOKI_PHOTO: MemoryPhoto = {
  src: tokiMemory,
  alt: 'A toki wading in a shallow stream',
  width: 360,
  height: 270,
}

const KINZAN_PHOTO: MemoryPhoto = {
  src: kinzanMemory,
  alt: 'The split mountain of the old gold mine',
  width: 300,
  height: 400,
}

const SADO: WorldPlace = {
  id: 'preview-sado',
  name: 'トキの森公園',
  nameLatin: 'Toki Forest Park',
  locality: 'Sado, Niigata',
  lat: 38.065,
  lng: 138.44,
  firstTouchedAt: '2026-08-06T11:20:00+09:00',
  lastTouchedAt: '2026-08-06T11:20:00+09:00',
}

const TOKYO: WorldPlace = {
  id: 'preview-tokyo',
  name: '代々木公園',
  nameLatin: 'Yoyogi Park',
  locality: 'Shibuya, Tokyo',
  lat: 35.672,
  lng: 139.695,
  firstTouchedAt: '2026-05-02T16:05:00+09:00',
  lastTouchedAt: '2026-05-02T16:05:00+09:00',
}

const KYOTO: WorldPlace = {
  id: 'preview-kyoto',
  name: '哲学の道',
  nameLatin: 'Philosopher’s Path',
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

/** Sado over the years. */
const SADO_KOKUBUNJI: WorldPlace = {
  id: 'preview-sado-kokubunji',
  name: '佐渡国分寺跡',
  nameLatin: 'Kokubun-ji Ruins',
  locality: 'Sado, Niigata',
  lat: 38.037,
  lng: 138.37,
  firstTouchedAt: '2027-05-03T10:10:00+09:00',
  lastTouchedAt: '2027-05-03T10:10:00+09:00',
}

const SADO_KINZAN: WorldPlace = {
  id: 'preview-sado-kinzan',
  name: '佐渡金山',
  nameLatin: 'Sado Gold Mine',
  locality: 'Aikawa, Sado',
  lat: 38.042,
  lng: 138.262,
  firstTouchedAt: '2028-08-14T14:30:00+09:00',
  lastTouchedAt: '2028-08-14T14:30:00+09:00',
}

const SHUKUNEGI: WorldPlace = {
  id: 'preview-shukunegi',
  name: '宿根木',
  nameLatin: 'Shukunegi',
  locality: 'Ogi, Sado',
  lat: 37.823,
  lng: 138.25,
  firstTouchedAt: '2029-10-02T09:15:00+09:00',
  lastTouchedAt: '2029-10-02T09:15:00+09:00',
}

/**
 * Sado's discoverable places — sample LINKA partner locations. Their text is
 * written for the prototype, not taken from any official source.
 */
export const DISCOVERY_PREVIEW: readonly DiscoveryPlace[] = [
  {
    id: SADO.id,
    name: SADO.name,
    nameLatin: 'Toki Forest Park',
    lat: SADO.lat,
    lng: SADO.lng,
    labelSide: 'right',
    intro: {
      en: 'A quiet forest park at the edge of the Kuninaka plain, home to the island’s work bringing the crested ibis — the toki — back to the wild.',
      ja: '国中平野のはずれにある静かな森の公園。トキを野生に戻す、佐渡の取り組みの場所です。',
    },
    image: {
      src: tokiDiscovery,
      alt: 'A toki feeding at the water’s edge',
      credit: 'Photo: rhodnite, CC BY 2.0',
    },
    activities: [
      { title: 'Toki observation corridor', detail: 'Watch the birds through the glass, close enough to see their colour.' },
      { title: 'Rice fields for the toki', detail: 'Walk the paddies farmed so the birds can feed in them.' },
    ],
  },
  {
    id: SADO_KOKUBUNJI.id,
    name: SADO_KOKUBUNJI.name,
    nameLatin: 'Kokubun-ji Ruins',
    lat: SADO_KOKUBUNJI.lat,
    lng: SADO_KOKUBUNJI.lng,
    labelSide: 'right',
    intro: {
      en: 'Foundation stones of a provincial temple from the eighth century, lying in the grass among the fields.',
      ja: '八世紀の国分寺の礎石が、田畑のあいだの草地に残っています。',
    },
    image: null,
    activities: [],
  },
  {
    id: SADO_KINZAN.id,
    name: SADO_KINZAN.name,
    nameLatin: 'Sado Gold Mine',
    lat: SADO_KINZAN.lat,
    lng: SADO_KINZAN.lng,
    labelSide: 'below',
    intro: {
      en: 'Four centuries of mining in the mountains above Aikawa, where the hillside was split open by hand.',
      ja: '相川の山で四百年続いた金山。山は手掘りで二つに割られました。',
    },
    image: null,
    activities: [],
  },
  {
    id: SHUKUNEGI.id,
    name: SHUKUNEGI.name,
    nameLatin: 'Shukunegi',
    lat: SHUKUNEGI.lat,
    lng: SHUKUNEGI.lng,
    labelSide: 'below',
    intro: {
      en: 'A village of shipbuilders’ houses packed into a small cove, their walls of weathered boards.',
      ja: '小さな入り江に船大工の家が建ち並ぶ集落。',
    },
    image: null,
    activities: [],
  },
  {
    id: 'preview-onogame',
    name: '大野亀',
    nameLatin: 'Ōnogame',
    lat: 38.305,
    lng: 138.47,
    labelSide: 'left',
    intro: {
      en: 'A great rounded rock on the north coast, covered in yellow day lilies in early summer.',
      ja: '北の海岸にそびえる大きな岩。初夏にはカンゾウの花に覆われます。',
    },
    image: null,
    activities: [],
  },
  {
    id: 'preview-donden',
    name: 'ドンデン高原',
    nameLatin: 'Donden Highlands',
    lat: 38.142,
    lng: 138.4,
    labelSide: 'left',
    intro: {
      en: 'Open grassland along the ridge of Osado, with the whole island below.',
      ja: '大佐渡の尾根に広がる草原。島全体を見渡せます。',
    },
    image: null,
    activities: [],
  },
  {
    id: 'preview-ogi',
    name: '小木のたらい舟',
    nameLatin: 'Ogi Tub Boats',
    lat: 37.818,
    lng: 138.29,
    labelSide: 'right',
    intro: {
      en: 'Round wooden tub boats, once used to gather shellfish among the rocks of the harbour.',
      ja: '岩場で貝を採るために使われてきた、丸い木のたらい舟。',
    },
    image: null,
    activities: [],
  },
]

export type PreviewState = 'zero' | 'first' | 'many' | 'discover' | 'photo' | 'years'

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
  /** A: Japan has been lived in, Sado never — it can only be discovered. */
  discover: {
    snapshot: { places: [EDINBURGH, TOKYO, KYOTO], recentPlaceId: KYOTO.id },
    arrivalPlaceId: null,
  },
  /** C: トキの森公園 touched, and one photograph added. */
  photo: {
    snapshot: { places: [{ ...SADO, photo: TOKI_PHOTO }], recentPlaceId: SADO.id },
    arrivalPlaceId: null,
  },
  /** D: years of Sado — some places remembered, some only touched, some never. */
  years: {
    snapshot: {
      places: [
        EDINBURGH,
        TOKYO,
        KYOTO,
        { ...SADO, photo: TOKI_PHOTO },
        SADO_KOKUBUNJI,
        { ...SADO_KINZAN, photo: KINZAN_PHOTO },
        SHUKUNEGI,
      ],
      recentPlaceId: SHUKUNEGI.id,
    },
    arrivalPlaceId: null,
  },
}

const STATES = Object.keys(WORLD_PREVIEWS) as PreviewState[]

export function isPreviewState(value: string | null): value is PreviewState {
  return STATES.includes(value as PreviewState)
}
