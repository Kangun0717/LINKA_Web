import type { Locale } from '@/lib/i18n/locale'

/**
 * The words of Community and the Journal (Sprint 4C), in each language.
 * Merged into `Messages` (see messages.ts).
 */

/** The public journey of a suggestion, as people see it (see `stageOf`). */
export const STAGES = ['suggested', 'support', 'review', 'local', 'preparing', 'published'] as const
export type Stage = (typeof STAGES)[number]

export type CommunityMessages = {
  community: {
    title: string
    tagline: string
    intro: string
    wantToGo: string
    wantToGoHint: string
    suggestions: string
    talking: string
    recentlyAdded: string
    seeAll: string
    suggestAction: string
    stages: Record<Stage, string>
    /** The stage names in the other script, shown small beneath (EN under JA, …). */
    stagesSecond: Record<Stage, string>
    support: string
    supported: string
    supportExplain: string
    supportCount: (count: number) => string
    signInToSupport: string
    proposedBy: (name: string) => string
    proposedAnonymously: string
    whyThisPlace: string
    journey: string
    stageNow: string
    noPhotoYet: string
    becameLinka: string
    touchPointInstalled: string
    openPlace: string
    notRanking: string
  }
  suggestFlow: {
    title: string
    step: (n: number, of: number) => string
    next: string
    back: string
    send: string
    nameLabel: string
    namePlaceholder: string
    whereLabel: string
    whereArea: string
    whereAreaPlaceholder: string
    whereMap: string
    whereLink: string
    whyLabel: string
    whyHelp: string
    prompts: readonly string[]
    whyPlaceholder: string
    photosLabel: string
    photosHelp: string
    attributionLabel: string
    attributionNickname: (name: string) => string
    attributionAnonymous: string
    privateUntilOpened: string
    optional: string
  }
  journal: {
    addMemory: string
    fromJournal: string
    verifiedTouch: string
    verifiedOn: (date: string) => string
    rememberedOn: (date: string) => string
    yourMap: string
    legendVerified: string
    legendPast: string
    photos: (count: number) => string
    cover: string
    makeCover: string
    remove: string
    moveEarlier: string
    moveLater: string
    addPhotos: string
    takePhoto: string
  }
  addPast: {
    title: string
    intro: string
    choosePhotos: string
    basedOnPhoto: string
    suggestedDate: (date: string) => string
    suggestedPlace: (place: string, distance: string) => string
    useSuggestion: string
    noMetadata: string
    placeLabel: string
    placeSearch: string
    ownWords: string
    ownWordsPlaceholder: string
    dateLabel: string
    precision: { day: string; month: string; year: string }
    moodLabel: string
    textLabel: string
    textPlaceholder: string
    save: string
    notVerified: string
    privacy: string
  }
  contributions: {
    title: string
    placesVisited: string
    verifiedPlaces: string
    journalMemories: string
    suggested: string
    supported: string
    becameLinka: string
    mySuggestions: string
    becameLinkaForever: string
    wantToGo: (count: number) => string
  }
  share: {
    title: string
    story: string
    square: string
    save: string
    kinds: { year: string; counts: string; postcard: string; milestone: string }
    myRegion: (region: string, year: number) => string
    placesTouched: (count: number) => string
    memories: (count: number) => string
    /** Beneath a large number: what it counts (verified places only). */
    touchedLabel: string
    memoriesLabel: string
    becameLinka: string
  }
  preview: {
    banner: string
    notSaved: string
  }
}

const STAGES_JA: Record<Stage, string> = {
  suggested: '提案された場所',
  support: '行ってみたい',
  review: 'LINKA確認中',
  local: '現地と相談中',
  preparing: '準備中',
  published: 'LINKAの場所になりました',
}
const STAGES_EN: Record<Stage, string> = {
  suggested: 'Suggested',
  support: 'Community support',
  review: 'LINKA review',
  local: 'Talking with local partners',
  preparing: 'Preparing',
  published: 'Now a LINKA Place',
}
const STAGES_ZH: Record<Stage, string> = {
  suggested: '被推荐的地点',
  support: '想去看看',
  review: 'LINKA 审核中',
  local: '与当地沟通中',
  preparing: '准备中',
  published: '已成为 LINKA 地点',
}

const en: CommunityMessages = {
  community: {
    title: 'Community',
    tagline: 'Help grow the LINKA world.',
    intro: 'Places travellers want to add to LINKA — suggested, supported, and followed as they become real LINKA places.',
    wantToGo: 'Places people want to visit',
    wantToGoHint: 'Where travellers would like to go',
    suggestions: 'Community suggestions',
    talking: 'Talking with local partners',
    recentlyAdded: 'Recently added',
    seeAll: 'See all',
    suggestAction: '＋ Suggest a place',
    stages: STAGES_EN,
    stagesSecond: STAGES_JA,
    support: 'I’d like to go',
    supported: 'You’d like to go',
    supportExplain: 'Tell LINKA you would be interested in visiting. It helps decide where to explore next — it is never a vote.',
    supportCount: (count) => `${count} would like to go`,
    signInToSupport: 'Sign in to say you would like to go',
    proposedBy: (name) => `Suggested by ${name}`,
    proposedAnonymously: 'Suggested by a traveller',
    whyThisPlace: 'Why this place?',
    journey: 'Its journey into LINKA',
    stageNow: 'Now',
    noPhotoYet: 'No photograph yet',
    becameLinka: 'This place is now part of LINKA',
    touchPointInstalled: 'LINKA Touch Point installed',
    openPlace: 'Open the LINKA place',
    notRanking: 'Support is interest, not a ranking.',
  },
  suggestFlow: {
    title: 'Suggest a place',
    step: (n, of) => `Step ${n} of ${of}`,
    next: 'Next',
    back: 'Back',
    send: 'Send suggestion',
    nameLabel: 'What is the place called?',
    namePlaceholder: 'e.g. Kitazawa Flotation Plant ruins',
    whereLabel: 'Where is it?',
    whereArea: 'Area',
    whereAreaPlaceholder: 'Town or area — no need for an exact address',
    whereMap: 'Mark it on the map',
    whereLink: 'A link about it',
    whyLabel: 'Why should people visit?',
    whyHelp: 'A few honest words are enough. If you are not sure where to start:',
    prompts: ['What made this place memorable?', 'What should someone experience here?', 'Is there something visitors often miss?', 'When is the best time to go?'],
    whyPlaceholder: 'Write in your own words',
    photosLabel: 'Photos',
    photosHelp: 'Your own photos, if you have them. LINKA reviews every photo before anyone else sees it.',
    attributionLabel: 'How should your suggestion be credited?',
    attributionNickname: (name) => `Show my nickname (${name})`,
    attributionAnonymous: 'Post anonymously',
    privateUntilOpened: 'Only you can see your suggestion until LINKA has reviewed it and opens it to the community.',
    optional: 'optional',
  },
  journal: {
    addMemory: '＋ Add a memory',
    fromJournal: 'From your journal',
    verifiedTouch: 'LINKA Touch',
    verifiedOn: (date) => `Touched here · ${date}`,
    rememberedOn: (date) => date,
    yourMap: 'Your journeys',
    legendVerified: 'Touched with LINKA',
    legendPast: 'From your journal',
    photos: (count) => `${count} photos`,
    cover: 'Cover',
    makeCover: 'Make cover',
    remove: 'Remove',
    moveEarlier: 'Move earlier',
    moveLater: 'Move later',
    addPhotos: 'Choose photos',
    takePhoto: 'Take a photo',
  },
  addPast: {
    title: 'Add a memory',
    intro: 'A place you visited before — with LINKA or without. It joins your journal; it does not mark a LINKA Touch.',
    choosePhotos: 'Start with photos (optional)',
    basedOnPhoto: 'Based on this photo',
    suggestedDate: (date) => `Taken ${date}`,
    suggestedPlace: (place, distance) => `Near ${place} (${distance})`,
    useSuggestion: 'Use this',
    noMetadata: 'This photo carries no date or location — choose them below.',
    placeLabel: 'Where',
    placeSearch: 'LINKA places',
    ownWords: 'Somewhere else',
    ownWordsPlaceholder: 'e.g. Kyoto, the Philosopher’s Path',
    dateLabel: 'When',
    precision: { day: 'Day', month: 'Month', year: 'Year' },
    moodLabel: 'How did it feel?',
    textLabel: 'What do you remember?',
    textPlaceholder: 'A line or two is enough.',
    save: 'Save to my journal',
    notVerified: 'Journal memories are yours to keep and share — only a LINKA Touch lights up your map.',
    privacy: 'Photo dates and locations are read on this device to suggest a place and date. They are not uploaded: saved photos keep only their pixels.',
  },
  contributions: {
    title: 'Contributions',
    placesVisited: 'Places in your journal',
    verifiedPlaces: 'Touched with LINKA',
    journalMemories: 'Memories',
    suggested: 'Places suggested',
    supported: 'Would like to go',
    becameLinka: 'Became LINKA places',
    mySuggestions: 'My suggestions',
    becameLinkaForever: 'Your suggestion became a LINKA place',
    wantToGo: (count) => `${count} would like to go`,
  },
  share: {
    title: 'Keepsakes',
    story: 'Story 9:16',
    square: 'Square 1:1',
    save: 'Save image',
    kinds: { year: 'My year', counts: 'In numbers', postcard: 'Postcard', milestone: 'Milestone' },
    myRegion: (region, year) => `My ${region} ${year}`,
    placesTouched: (count) => `${count} places touched`,
    memories: (count) => `${count} memories`,
    touchedLabel: 'places touched with LINKA',
    memoriesLabel: 'memories kept',
    becameLinka: 'This place became LINKA',
  },
  preview: {
    banner: 'PROTOTYPE · sample data · nothing is saved',
    notSaved: 'Prototype — nothing was saved.',
  },
}

const ja: CommunityMessages = {
  community: {
    title: 'コミュニティ',
    tagline: 'みんなで、LINKAの世界を広げる。',
    intro: '旅人が「LINKAに加えたい」と思った場所。提案され、応援され、LINKAの場所になるまでを見守れます。',
    wantToGo: '行ってみたい場所',
    wantToGoHint: 'みんなが行ってみたいと思っている場所',
    suggestions: 'みんなからの提案',
    talking: '現地と相談中',
    recentlyAdded: '最近LINKAになった場所',
    seeAll: 'すべて見る',
    suggestAction: '＋ 場所を提案する',
    stages: STAGES_JA,
    stagesSecond: STAGES_EN,
    support: '行ってみたい',
    supported: '行ってみたい（済）',
    supportExplain: '「行ってみたい」はLINKAが次に訪ねる場所を考える手がかりです。投票ではありません。',
    supportCount: (count) => `${count}人が行ってみたい`,
    signInToSupport: 'ログインして「行ってみたい」を伝える',
    proposedBy: (name) => `${name}さんの提案`,
    proposedAnonymously: '旅人からの提案',
    whyThisPlace: 'この場所をすすめる理由',
    journey: 'LINKAになるまでの道のり',
    stageNow: 'いま',
    noPhotoYet: '写真はまだありません',
    becameLinka: 'この場所はLINKAになりました',
    touchPointInstalled: 'LINKAタッチポイントを設置しました',
    openPlace: 'LINKAの場所を見る',
    notRanking: '応援はランキングではありません。',
  },
  suggestFlow: {
    title: '場所を提案する',
    step: (n, of) => `${n} / ${of}`,
    next: '次へ',
    back: '戻る',
    send: '提案を送る',
    nameLabel: '場所の名前は？',
    namePlaceholder: '例：北沢浮遊選鉱場跡',
    whereLabel: 'どこにありますか？',
    whereArea: 'エリア',
    whereAreaPlaceholder: '町名やエリアで大丈夫です（詳しい住所は不要）',
    whereMap: '地図で示す',
    whereLink: '関連リンク',
    whyLabel: 'どうしておすすめですか？',
    whyHelp: '一言でも大丈夫です。書き出しに迷ったら：',
    prompts: ['この場所のどこが心に残りましたか？', 'ここでどんな体験をしてほしいですか？', '見落とされがちな魅力はありますか？', 'いつ行くのがおすすめですか？'],
    whyPlaceholder: 'あなたの言葉で書いてください',
    photosLabel: '写真',
    photosHelp: 'あなたが撮った写真があれば。写真はすべてLINKAが確認してから公開します。',
    attributionLabel: '提案者の表示',
    attributionNickname: (name) => `ニックネームを表示（${name}）`,
    attributionAnonymous: '匿名で投稿',
    privateUntilOpened: 'LINKAが確認して公開するまで、提案はあなただけが見られます。',
    optional: '任意',
  },
  journal: {
    addMemory: '＋ 思い出を追加',
    fromJournal: 'あなたの旅の記録',
    verifiedTouch: 'LINKAタッチ',
    verifiedOn: (date) => `ここでタッチ · ${date}`,
    rememberedOn: (date) => date,
    yourMap: 'あなたの旅',
    legendVerified: 'LINKAでタッチした場所',
    legendPast: '旅の記録',
    photos: (count) => `写真 ${count}枚`,
    cover: 'カバー',
    makeCover: 'カバーにする',
    remove: '削除',
    moveEarlier: '前へ',
    moveLater: '後ろへ',
    addPhotos: '写真を選ぶ',
    takePhoto: '写真を撮る',
  },
  addPast: {
    title: '思い出を追加',
    intro: '以前に訪れた場所の思い出を。旅の記録に加わりますが、LINKAのタッチにはなりません。',
    choosePhotos: '写真から始める（任意）',
    basedOnPhoto: 'この写真をもとに候補を表示しています',
    suggestedDate: (date) => `撮影日 ${date}`,
    suggestedPlace: (place, distance) => `${place}の近く（${distance}）`,
    useSuggestion: 'これにする',
    noMetadata: 'この写真には日付や場所の情報がありません。下で選んでください。',
    placeLabel: '場所',
    placeSearch: 'LINKAの場所',
    ownWords: 'ほかの場所',
    ownWordsPlaceholder: '例：京都・哲学の道',
    dateLabel: 'いつ',
    precision: { day: '日', month: '月', year: '年' },
    moodLabel: 'どんな気持ちでしたか？',
    textLabel: '覚えていること',
    textPlaceholder: '一言だけでも大丈夫です。',
    save: '旅の記録に保存',
    notVerified: '旅の記録はあなただけのもの。地図に色がつくのはLINKAタッチだけです。',
    privacy: '写真の日付と位置は、この端末の中で候補を出すためだけに読み取ります。アップロードする写真には画像だけが残り、位置情報は送られません。',
  },
  contributions: {
    title: 'あなたの貢献',
    placesVisited: '旅の記録の場所',
    verifiedPlaces: 'LINKAでタッチ',
    journalMemories: '思い出',
    suggested: '提案した場所',
    supported: '行ってみたい',
    becameLinka: 'LINKAになった提案',
    mySuggestions: 'わたしの提案',
    becameLinkaForever: 'あなたの提案がLINKAの場所になりました',
    wantToGo: (count) => `みんなの「行ってみたい」 ${count}`,
  },
  share: {
    title: '旅のしおり',
    story: 'ストーリー 9:16',
    square: 'スクエア 1:1',
    save: '画像を保存',
    kinds: { year: 'わたしの一年', counts: '数字で見る', postcard: 'ポストカード', milestone: 'できごと' },
    myRegion: (region, year) => `わたしの${region} ${year}`,
    placesTouched: (count) => `${count}か所にタッチ`,
    memories: (count) => `思い出 ${count}`,
    touchedLabel: 'か所にLINKAでタッチ',
    memoriesLabel: 'の思い出',
    becameLinka: 'この場所がLINKAになりました',
  },
  preview: {
    banner: 'プロトタイプ · サンプルデータ · 保存されません',
    notSaved: 'プロトタイプのため保存されていません。',
  },
}

const zhHans: CommunityMessages = {
  community: {
    title: '社区',
    tagline: '一起扩展 LINKA 的世界。',
    intro: '旅行者希望加入 LINKA 的地点——被推荐、被支持，并一路见证它们成为真正的 LINKA 地点。',
    wantToGo: '大家想去的地方',
    wantToGoHint: '旅行者们想去的地方',
    suggestions: '大家的推荐',
    talking: '与当地沟通中',
    recentlyAdded: '最近成为 LINKA 的地点',
    seeAll: '查看全部',
    suggestAction: '＋ 推荐一个地方',
    stages: STAGES_ZH,
    stagesSecond: STAGES_JA,
    support: '想去看看',
    supported: '已表示想去',
    supportExplain: '「想去看看」帮助 LINKA 决定下一步探索哪里——它不是投票。',
    supportCount: (count) => `${count} 人想去看看`,
    signInToSupport: '登录后表示想去看看',
    proposedBy: (name) => `由 ${name} 推荐`,
    proposedAnonymously: '一位旅行者的推荐',
    whyThisPlace: '为什么推荐这里？',
    journey: '成为 LINKA 地点的历程',
    stageNow: '现在',
    noPhotoYet: '还没有照片',
    becameLinka: '这里已成为 LINKA 地点',
    touchPointInstalled: '已设置 LINKA 触点',
    openPlace: '查看这个 LINKA 地点',
    notRanking: '支持代表兴趣，不是排名。',
  },
  suggestFlow: {
    title: '推荐一个地方',
    step: (n, of) => `第 ${n} 步，共 ${of} 步`,
    next: '下一步',
    back: '返回',
    send: '提交推荐',
    nameLabel: '这个地方叫什么？',
    namePlaceholder: '例：北泽浮游选矿场遗址',
    whereLabel: '它在哪里？',
    whereArea: '区域',
    whereAreaPlaceholder: '城镇或区域即可，无需详细地址',
    whereMap: '在地图上标出',
    whereLink: '相关链接',
    whyLabel: '为什么值得一去？',
    whyHelp: '写一两句真心话就好。不知道从哪里写起的话：',
    prompts: ['这里哪一点让你难忘？', '希望来这里的人体验什么？', '有没有常被忽略的魅力？', '什么时候去最好？'],
    whyPlaceholder: '用你自己的话写',
    photosLabel: '照片',
    photosHelp: '如果有你自己拍的照片就更好。所有照片都会先由 LINKA 审核再公开。',
    attributionLabel: '推荐人显示方式',
    attributionNickname: (name) => `显示我的昵称（${name}）`,
    attributionAnonymous: '匿名发布',
    privateUntilOpened: '在 LINKA 审核并公开之前，只有你能看到这条推荐。',
    optional: '可选',
  },
  journal: {
    addMemory: '＋ 添加回忆',
    fromJournal: '来自你的旅行手账',
    verifiedTouch: 'LINKA 触碰',
    verifiedOn: (date) => `在此触碰 · ${date}`,
    rememberedOn: (date) => date,
    yourMap: '你的旅程',
    legendVerified: '用 LINKA 触碰过',
    legendPast: '旅行手账',
    photos: (count) => `${count} 张照片`,
    cover: '封面',
    makeCover: '设为封面',
    remove: '删除',
    moveEarlier: '前移',
    moveLater: '后移',
    addPhotos: '选择照片',
    takePhoto: '拍照',
  },
  addPast: {
    title: '添加回忆',
    intro: '记录一个以前去过的地方。它会加入你的旅行手账，但不算作 LINKA 触碰。',
    choosePhotos: '从照片开始（可选）',
    basedOnPhoto: '根据这张照片为你推荐',
    suggestedDate: (date) => `拍摄于 ${date}`,
    suggestedPlace: (place, distance) => `在${place}附近（${distance}）`,
    useSuggestion: '使用这个',
    noMetadata: '这张照片没有日期或位置信息，请在下方选择。',
    placeLabel: '地点',
    placeSearch: 'LINKA 地点',
    ownWords: '其他地方',
    ownWordsPlaceholder: '例：京都·哲学之道',
    dateLabel: '时间',
    precision: { day: '日', month: '月', year: '年' },
    moodLabel: '当时的心情？',
    textLabel: '你记得什么？',
    textPlaceholder: '写一两句就好。',
    save: '保存到旅行手账',
    notVerified: '旅行手账属于你自己——只有 LINKA 触碰才会点亮你的地图。',
    privacy: '照片的日期和位置只在这台设备上读取，用来推荐地点和日期，不会上传：保存的照片只保留画面本身。',
  },
  contributions: {
    title: '你的贡献',
    placesVisited: '手账里的地点',
    verifiedPlaces: '用 LINKA 触碰',
    journalMemories: '回忆',
    suggested: '推荐的地点',
    supported: '想去看看',
    becameLinka: '成为 LINKA 的推荐',
    mySuggestions: '我的推荐',
    becameLinkaForever: '你的推荐成为了 LINKA 地点',
    wantToGo: (count) => `${count} 人想去看看`,
  },
  share: {
    title: '旅行纪念卡',
    story: '竖版 9:16',
    square: '方形 1:1',
    save: '保存图片',
    kinds: { year: '我的一年', counts: '数字回顾', postcard: '明信片', milestone: '里程碑' },
    myRegion: (region, year) => `我的${region} ${year}`,
    placesTouched: (count) => `触碰了 ${count} 个地点`,
    memories: (count) => `${count} 段回忆`,
    touchedLabel: '个地点用 LINKA 触碰',
    memoriesLabel: '段回忆',
    becameLinka: '这里成为了 LINKA 地点',
  },
  preview: {
    banner: '原型 · 示例数据 · 不会保存',
    notSaved: '原型——没有保存任何内容。',
  },
}

export const COMMUNITY_MESSAGES: Record<Locale, CommunityMessages> = { en, ja, 'zh-Hans': zhHans }

/** Where a suggestion is on its public journey, from its stored status. */
export function stageOf(status: string): Stage {
  switch (status) {
    case 'under_review':
      return 'review'
    case 'contacting_partner':
      return 'local'
    case 'approved':
      return 'preparing'
    case 'published':
      return 'published'
    case 'open':
      return 'support'
    default:
      return 'suggested'
  }
}
