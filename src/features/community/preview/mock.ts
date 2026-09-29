import type { SuggestionView } from '@/features/community/model'
import type { JournalEntryView } from '@/features/journal/model'
import kinzanMemory from '@/features/world/preview/photos/kinzan-memory.jpg'
import tokiDiscovery from '@/features/world/preview/photos/toki-discovery.jpg'
import tokiMemory from '@/features/world/preview/photos/toki-memory.jpg'

/**
 * DEV PREVIEW ONLY — sample data for the Sprint 4C prototypes.
 *
 * The suggested places are real places on Sado that are not LINKA places;
 * everything said about them (reasons, supporters, dates, timeline notes,
 * nicknames) is invented for the prototype. Suggestions carry no photograph
 * — the prototype shows the drawn cover rather than borrow one. Journal
 * photos are the licensed place heroes (public/places, see
 * 20260929100100_place_heroes.sql) and the Commons photos listed in
 * world/preview/worldPreviews.ts. Reachable only from /preview/4c/*.
 */

const hero = (slug: string) => `/places/${slug}-800.jpg`

export const MOCK_SUGGESTIONS: SuggestionView[] = [
  {
    id: 'kitazawa',
    name: '北沢浮遊選鉱場跡',
    publicArea: '佐渡・相川',
    point: { lng: 138.244, lat: 38.029 },
    reason:
      '緑に飲み込まれかけた巨大な選鉱場の跡。夕方、谷に光が差すと古代遺跡のように見えます。金山と合わせて歩くと、相川の町の成り立ちがよくわかります。\n\nA vast ruined ore plant slowly returning to the forest — in the evening light it looks like an ancient temple.',
    status: 'contacting_partner',
    supportCount: 128,
    supportedByMe: true,
    proposerName: 'Mika',
    photos: [],
    openedAt: '2026-09-04T10:00:00+09:00',
    publishedAt: null,
    placeSlug: null,
    timeline: [
      { at: '2026-09-02T21:14:00+09:00', kind: 'status', status: 'submitted' },
      { at: '2026-09-04T10:00:00+09:00', kind: 'status', status: 'open', note: { ja: 'コミュニティに公開しました。', en: 'Opened to the community.', 'zh-Hans': '已向社区公开。' } },
      { at: '2026-10-08T15:30:00+09:00', kind: 'status', status: 'under_review', note: { ja: '公開時間と安全な見学ルートを確認しています。', en: 'Checking opening hours and a safe route for visitors.', 'zh-Hans': '正在确认开放时间和安全的参观路线。' } },
      { at: '2026-11-12T11:00:00+09:00', kind: 'status', status: 'contacting_partner', note: { ja: '相川の観光団体と、タッチポイントの設置場所を相談しています。', en: 'Talking with a tourism organisation in Aikawa about where a Touch Point could go.', 'zh-Hans': '正在与相川的旅游团体商量触点的设置位置。' } },
    ],
  },
  {
    id: 'iwakubi',
    name: '岩首昇竜棚田',
    publicArea: '佐渡・岩首',
    point: { lng: 138.52, lat: 37.95 },
    reason: '海に向かって駆け下りる棚田。田植えの頃は水鏡に空が映り、秋は黄金色になります。展望台からの眺めを多くの人に知ってほしい。',
    status: 'open',
    supportCount: 212,
    supportedByMe: false,
    proposerName: 'Kenta',
    photos: [],
    openedAt: '2026-09-20T09:00:00+09:00',
    publishedAt: null,
    placeSlug: null,
    timeline: [
      { at: '2026-09-18T19:02:00+09:00', kind: 'status', status: 'submitted' },
      { at: '2026-09-20T09:00:00+09:00', kind: 'status', status: 'open' },
    ],
  },
  {
    id: 'tarai',
    name: '小木のたらい舟',
    publicArea: '佐渡・小木',
    point: { lng: 138.285, lat: 37.812 },
    reason: 'Rowing a wooden tub boat around the harbour, taught by the women of Ogi. Slow, a little wobbly and completely unforgettable.',
    status: 'under_review',
    supportCount: 64,
    supportedByMe: false,
    proposerName: null,
    photos: [],
    openedAt: '2026-09-11T09:00:00+09:00',
    publishedAt: null,
    placeSlug: null,
    timeline: [
      { at: '2026-09-09T12:40:00+09:00', kind: 'status', status: 'submitted' },
      { at: '2026-09-11T09:00:00+09:00', kind: 'status', status: 'open' },
      { at: '2026-10-21T14:00:00+09:00', kind: 'status', status: 'under_review' },
    ],
  },
  {
    id: 'senkaku',
    name: '尖閣湾',
    publicArea: '佐渡・相川',
    point: { lng: 138.265, lat: 38.085 },
    reason: '断崖と澄んだ海。遊覧船から見上げる岩壁が印象的でした。',
    status: 'approved',
    supportCount: 96,
    supportedByMe: true,
    proposerName: 'Aoi',
    photos: [],
    openedAt: '2026-08-28T09:00:00+09:00',
    publishedAt: null,
    placeSlug: null,
    timeline: [
      { at: '2026-08-26T08:00:00+09:00', kind: 'status', status: 'submitted' },
      { at: '2026-08-28T09:00:00+09:00', kind: 'status', status: 'open' },
      { at: '2026-09-15T09:00:00+09:00', kind: 'status', status: 'under_review' },
      { at: '2026-10-02T09:00:00+09:00', kind: 'status', status: 'contacting_partner' },
      { at: '2026-11-20T09:00:00+09:00', kind: 'status', status: 'approved', note: { ja: 'タッチポイントの設置準備を進めています。', en: 'Preparing the Touch Point.', 'zh-Hans': '正在准备设置触点。' } },
    ],
  },
  {
    id: 'skyline',
    name: '大佐渡スカイライン',
    publicArea: '佐渡・大佐渡山地',
    point: { lng: 138.33, lat: 38.12 },
    reason: '尾根の上から、両津湾と真野湾が同時に見える場所があります。',
    status: 'open',
    supportCount: 37,
    supportedByMe: false,
    proposerName: null,
    photos: [],
    openedAt: '2026-10-01T09:00:00+09:00',
    publishedAt: null,
    placeSlug: null,
    timeline: [{ at: '2026-10-01T09:00:00+09:00', kind: 'status', status: 'open' }],
  },
  {
    id: 'shukunegi',
    name: '宿根木',
    publicArea: '佐渡・宿根木',
    point: { lng: 138.236, lat: 37.811 },
    reason: '船板でできた家々が入り江に寄り添う、時間が止まったような集落。',
    status: 'published',
    supportCount: 184,
    supportedByMe: true,
    proposerName: 'Walker',
    photos: [hero('shukunegi')],
    openedAt: '2026-06-02T09:00:00+09:00',
    publishedAt: '2026-09-26T09:00:00+09:00',
    placeSlug: 'shukunegi',
    timeline: [
      { at: '2026-05-30T09:00:00+09:00', kind: 'status', status: 'submitted' },
      { at: '2026-06-02T09:00:00+09:00', kind: 'status', status: 'open' },
      { at: '2026-07-01T09:00:00+09:00', kind: 'status', status: 'under_review' },
      { at: '2026-07-24T09:00:00+09:00', kind: 'status', status: 'contacting_partner', note: { ja: '地域の保存会と相談しています。', en: 'Talking with the village preservation society.', 'zh-Hans': '正在与当地保护会沟通。' } },
      { at: '2026-09-01T09:00:00+09:00', kind: 'status', status: 'approved' },
      { at: '2026-09-26T09:00:00+09:00', kind: 'status', status: 'published' },
      { at: '2026-09-26T10:00:00+09:00', kind: 'milestone', note: { ja: '集落の入口に設置しました。', en: 'Installed at the entrance to the village.', 'zh-Hans': '已设置在村口。' } },
    ],
  },
]

export const MOCK_JOURNAL: JournalEntryView[] = [
  {
    id: 'toki-2026',
    kind: 'verified',
    placeName: 'トキの森公園',
    placeSecond: 'Toki no Mori Park',
    placeSlug: 'toki-no-mori',
    point: { lng: 138.42129, lat: 38.03711 },
    date: '2026-09-29',
    datePrecision: 'day',
    mood: 'calm',
    text: '朝の光の中、トキが浅瀬をゆっくり歩いていた。羽の内側が本当に朱鷺色だった。\nThe ibis walked the shallows so slowly I forgot the time.',
    photos: [
      { src: tokiMemory, width: 1200, height: 900 },
      { src: tokiDiscovery, width: 1200, height: 900 },
      { src: hero('toki-no-mori'), width: 800, height: 500 },
    ],
  },
  {
    id: 'kinzan-2026',
    kind: 'verified',
    placeName: '佐渡金山',
    placeSecond: 'Sado Gold Mine',
    placeSlug: 'sado-kinzan',
    point: { lng: 138.256, lat: 38.04169 },
    date: '2026-09-28',
    datePrecision: 'day',
    mood: 'surprised',
    text: '道遊の割戸を見上げて、人の手で山が割られたことに言葉を失った。',
    photos: [{ src: kinzanMemory, width: 1200, height: 900 }],
  },
  {
    id: 'onogame-2021',
    kind: 'past',
    placeName: '大野亀',
    placeSecond: 'Onogame',
    placeSlug: 'onogame',
    point: { lng: 138.4616, lat: 38.32099 },
    date: '2021-06-01',
    datePrecision: 'month',
    mood: 'joyful',
    text: 'カンゾウの黄色い花が斜面いっぱいに咲いていた、6月の旅。',
    photos: [{ src: hero('onogame'), width: 800, height: 500 }],
  },
  {
    id: 'shukunegi-2019',
    kind: 'past',
    placeName: '宿根木',
    placeSecond: 'Shukunegi',
    placeSlug: 'shukunegi',
    point: { lng: 138.23603, lat: 37.81054 },
    date: '2019-08-12',
    datePrecision: 'day',
    mood: 'moved',
    text: 'Summer 2019, before LINKA. We got lost in the narrow lanes and found the sea at the end of every one.',
    photos: [{ src: hero('shukunegi'), width: 800, height: 500 }],
  },
  {
    id: 'kyoto-2018',
    kind: 'past',
    placeName: '京都・哲学の道',
    placeSecond: null,
    placeSlug: null,
    point: null,
    date: '2018-04-01',
    datePrecision: 'year',
    mood: 'special',
    text: '桜の散る道を、ただ歩いた春。',
    photos: [],
  },
]

/** The LINKA places a photo's coordinates are compared with (published coordinates). */
export const MOCK_PLACES = [
  { slug: 'toki-no-mori', name: 'トキの森公園', lng: 138.42129, lat: 38.03711 },
  { slug: 'sado-kinzan', name: '佐渡金山', lng: 138.256, lat: 38.04169 },
  { slug: 'shukunegi', name: '宿根木', lng: 138.23603, lat: 37.81054 },
  { slug: 'onogame', name: '大野亀', lng: 138.4616, lat: 38.32099 },
  { slug: 'donden-kogen', name: 'ドンデン高原', lng: 138.38962, lat: 38.13989 },
]

export const MOCK_ME = { nickname: 'Walker', supportedCount: 4 }
