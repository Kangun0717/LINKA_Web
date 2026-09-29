import type { Stage } from '@/lib/i18n/communityMessages'
import type { Locale } from '@/lib/i18n/locale'

/**
 * The words of the real Community, Journal and Contributions screens
 * (Sprint 4C, phase 2), in each language. Read through
 * `useCommunityMessages()`, which only those screens import — so none of
 * this is in the bundle the Door downloads.
 */
export type CommunityAppMessages = {
  hub: {
    eyebrow: string
    title: string
    lead: string
    foundTitle: string
    foundLead: string
    wantTitle: string
    wantLead: string
    journeyTitle: string
    journeyLead: string
    becameTitle: string
    becameLead: string
    mapTitle: string
    suggestTitle: string
    suggestLead: string
    suggestCta: string
    seeAll: string
    allTitle: string
    filterAll: string
    empty: string
    emptyFilter: string
    mapEntry: string
    mapEntrySecond: string
    back: string
    count: (n: number) => string
  }
  /** The six stops of a suggestion's journey, short, for the progress line and timeline. */
  stageShort: Record<Stage, string>
  act: {
    became: string
    frozen: (n: number) => string
    own: string
    ownHint: string
    signIn: string
    signInHint: string
    rateLimited: string
    closed: string
    failed: string
    offline: string
    share: string
    copied: string
    shareText: (name: string) => string
  }
  detail: {
    reason: string
    photos: string
    updates: string
    journey: string
    progress: string
    fromLinka: string
    notFound: string
    notFoundBody: string
    privateTitle: string
    privateBody: string
    yourOriginal: string
    publicVersion: string
    publicVersionHint: string
    withdraw: string
    withdrawConfirm: string
    withdrawn: string
    closedStates: Record<'declined' | 'duplicate' | 'withdrawn', string>
    area: string
  }
  suggest: {
    title: string
    lead: string
    points: readonly string[]
    privacy: string
    nameLabel: string
    namePlaceholder: string
    areaLabel: string
    areaPlaceholder: string
    pinLabel: string
    pinHint: string
    pinClear: string
    reasonLabel: string
    reasonHelp: string
    reasonPlaceholder: string
    linkLabel: string
    photosLabel: string
    photosHelp: string
    attributionLabel: string
    nickname: (name: string) => string
    anonymous: string
    required: string
    invalidLink: string
    submit: string
    submitting: string
    uploading: (done: number, of: number) => string
    photoFailed: string
    retryPhotos: string
    doneTitle: string
    doneBody: string
    doneSteps: readonly string[]
    seeMine: string
    backToCommunity: string
    another: string
    signInTitle: string
    signInBody: string
  }
  diary: {
    subtitle: string
    add: string
    empty: string
    emptyTouch: string
    emptyAdd: string
    verifiedBadge: string
    pastBadge: string
    verifiedExplain: string
    pastExplain: string
    noDate: string
    edit: string
    delete: string
    deleteConfirm: string
    deleting: string
    deleteFailed: string
    photosTitle: string
    managePhotos: string
    writeMemory: string
    back: string
    photoOf: (n: number, of: number) => string
    openPlace: string
    notFound: string
  }
  pastForm: {
    editTitle: string
    searchPlaces: string
    noMatch: string
    chosen: string
    change: string
    needWhere: string
    datePlaceholder: string
    clearDate: string
    saving: string
    saved: string
    failed: string
    uploading: (done: number, of: number) => string
    photoFailed: string
    retry: string
    cancel: string
    fromPhoto: string
  }
  layer: {
    label: string
    verified: string
    memories: string
    all: string
    pin: (place: string, date: string) => string
  }
  mine: {
    title: string
    lead: string
    travelled: string
    remembered: string
    suggested: string
    helped: string
    travelledLine: (n: number) => string
    rememberedLine: (n: number) => string
    suggestedLine: (n: number) => string
    helpedLine: (n: number) => string
    mySuggestions: string
    supported: string
    became: string
    noSuggestions: string
    noSupports: string
    noBecame: string
    privateChip: string
    suggestCta: string
    communityCta: string
    settings: string
  }
  placeCommunity: {
    title: string
    fromCommunity: string
    history: (n: number) => string
    openStory: string
    yours: string
    verifiedHere: (date: string) => string
    pastHere: (n: number) => string
    openMoments: string
    addPast: string
  }
}

const en: CommunityAppMessages = {
  hub: {
    eyebrow: 'LINKA Community',
    title: 'Places travellers found',
    lead: 'Places people love and would like LINKA to open — each one followed from a first suggestion to a LINKA Touch Point.',
    foundTitle: 'Newly found',
    foundLead: 'Just opened to the community.',
    wantTitle: 'I’d like to go',
    wantLead: 'Where travellers say they would like to go. Interest, not a vote.',
    journeyTitle: 'On the way to LINKA',
    journeyLead: 'LINKA checks each place, talks with the people who look after it, and prepares a Touch Point.',
    becameTitle: 'Became LINKA places',
    becameLead: 'Suggested by travellers — now places anyone can touch.',
    mapTitle: 'On the map',
    suggestTitle: 'Know a place?',
    suggestLead: 'Tell LINKA about somewhere worth the journey.',
    suggestCta: 'Suggest a place',
    seeAll: 'See all',
    allTitle: 'All suggestions',
    filterAll: 'All',
    empty: 'No suggestions are open yet. The first ones will appear here once LINKA has reviewed them.',
    emptyFilter: 'Nothing at this stage right now.',
    mapEntry: 'Community',
    mapEntrySecond: 'Places travellers found',
    back: 'Community',
    count: (n) => `${n} ${n === 1 ? 'place' : 'places'}`,
  },
  stageShort: {
    suggested: 'Suggested',
    support: 'Community support',
    review: 'LINKA review',
    local: 'Talking locally',
    preparing: 'Preparing',
    published: 'LINKA Place',
  },
  act: {
    became: 'Became a LINKA Place ✓',
    frozen: (n) => `${n} said they would like to go`,
    own: 'Your suggestion',
    ownHint: 'Support is interest from other travellers, so you cannot add your own.',
    signIn: 'Sign in to say you’d like to go',
    signInHint: 'You will come straight back here.',
    rateLimited: 'That is a lot at once — please try again a little later.',
    closed: 'This place is no longer taking support.',
    failed: 'That did not go through. Please try again.',
    offline: 'You seem to be offline. Please try again when connected.',
    share: 'Share',
    copied: 'Link copied',
    shareText: (name) => `${name} — on its way to LINKA`,
  },
  detail: {
    reason: 'Why this place',
    photos: 'Photographs',
    updates: 'From LINKA',
    journey: 'Its journey to LINKA',
    progress: 'Where it is now',
    fromLinka: 'LINKA',
    notFound: 'This suggestion is not public',
    notFoundBody: 'It may still be under review, or it is no longer open.',
    privateTitle: 'Only you can see this suggestion',
    privateBody: 'LINKA is reviewing it. If it opens to the community, travellers will see the public version below.',
    yourOriginal: 'What you wrote',
    publicVersion: 'Shown publicly',
    publicVersionHint: 'LINKA may shorten the public text for privacy. Your own words are kept as you wrote them.',
    withdraw: 'Withdraw this suggestion',
    withdrawConfirm: 'Withdraw it? It will no longer be reviewed or shown.',
    withdrawn: 'You withdrew this suggestion.',
    closedStates: {
      declined: 'LINKA will not be adding this place for now. Thank you for suggesting it.',
      duplicate: 'Someone suggested this place already — it continues there.',
      withdrawn: 'You withdrew this suggestion.',
    },
    area: 'Area',
  },
  suggest: {
    title: 'Suggest a place',
    lead: 'Somewhere you think deserves a LINKA Touch Point.',
    points: [
      'Your suggestion starts private — only you can see it.',
      'LINKA reviews it, and may open it to the community.',
      'Once open, travellers can say they would like to go.',
    ],
    privacy: 'Please do not include personal information — yours or anyone else’s (home addresses, phone numbers, full names).',
    nameLabel: 'The place',
    namePlaceholder: 'e.g. Kitazawa Flotation Plant ruins',
    areaLabel: 'Where',
    areaPlaceholder: 'Town or area — no exact address needed',
    pinLabel: 'Mark it on Sado',
    pinHint: 'Optional, and only if it is on Sado. Only LINKA sees your mark.',
    pinClear: 'Clear mark',
    reasonLabel: 'Why should people go?',
    reasonHelp: 'A few honest lines are enough.',
    reasonPlaceholder: 'What makes it special, what to see, the best time to go…',
    linkLabel: 'A link about it',
    photosLabel: 'Your photos',
    photosHelp: 'LINKA reviews every photo before anyone else sees it. Location data is removed on your phone.',
    attributionLabel: 'If it is opened, show',
    nickname: (name) => `My nickname · ${name}`,
    anonymous: 'Anonymous · “a traveller”',
    required: 'Please fill this in.',
    invalidLink: 'That does not look like a web address.',
    submit: 'Send to LINKA',
    submitting: 'Sending…',
    uploading: (done, of) => `Sending photos · ${done} of ${of}`,
    photoFailed: 'Some photos could not be sent. Your suggestion is saved.',
    retryPhotos: 'Try the photos again',
    doneTitle: 'Thank you — LINKA has it.',
    doneBody: 'Your suggestion is private for now. You can follow it in Me → Contributions.',
    doneSteps: ['LINKA reviews it', 'It may open to the community', 'Travellers say they would like to go', 'It becomes a LINKA Place'],
    seeMine: 'See my suggestion',
    backToCommunity: 'Back to Community',
    another: 'Suggest another place',
    signInTitle: 'Sign in to suggest a place',
    signInBody: 'Suggestions are kept with your account so you can follow them.',
  },
  diary: {
    subtitle: 'Travel journal',
    add: 'Add a memory',
    empty: 'Your journal is waiting for its first page.',
    emptyTouch: 'Touch a LINKA Touch Point on your travels —',
    emptyAdd: 'or write down a journey from before.',
    verifiedBadge: 'Touched with LINKA',
    pastBadge: 'From my journal',
    verifiedExplain: 'You were here — recorded by a LINKA Touch Point. It colours your map.',
    pastExplain: 'Your own record of this journey. Kept with the same care; only a LINKA Touch colours the map.',
    noDate: 'Undated',
    edit: 'Edit',
    delete: 'Delete this memory',
    deleteConfirm: 'Delete this memory and its photos? This cannot be undone.',
    deleting: 'Deleting…',
    deleteFailed: 'It could not be deleted. Please try again.',
    photosTitle: 'Photographs',
    managePhotos: 'Photos',
    writeMemory: 'Write about it',
    back: 'Moments',
    photoOf: (n, of) => `Photo ${n} of ${of}`,
    openPlace: 'About this place',
    notFound: 'This memory is not in your journal.',
  },
  pastForm: {
    editTitle: 'Edit memory',
    searchPlaces: 'Search LINKA places',
    noMatch: 'No LINKA place by that name — write it in your own words below.',
    chosen: 'Chosen',
    change: 'Change',
    needWhere: 'Choose a place or write where it was.',
    datePlaceholder: 'Choose a date',
    clearDate: 'No date',
    saving: 'Saving…',
    saved: 'Saved to your journal.',
    failed: 'It could not be saved. Please try again.',
    uploading: (done, of) => `Adding photos · ${done} of ${of}`,
    photoFailed: 'Some photos could not be added.',
    retry: 'Try again',
    cancel: 'Cancel',
    fromPhoto: 'From your photo',
  },
  layer: {
    label: 'Show',
    verified: 'LINKA',
    memories: 'Memories',
    all: 'All',
    pin: (place, date) => `Memory: ${place}, ${date} — from your journal, not a LINKA Touch`,
  },
  mine: {
    title: 'Contributions',
    lead: 'Your journeys, and the places you helped add to LINKA.',
    travelled: 'I travelled here',
    remembered: 'I remembered this',
    suggested: 'I suggested this',
    helped: 'I helped it become LINKA',
    travelledLine: (n) => `${n} ${n === 1 ? 'place' : 'places'} touched with LINKA`,
    rememberedLine: (n) => `${n} journal ${n === 1 ? 'memory' : 'memories'}`,
    suggestedLine: (n) => `${n} ${n === 1 ? 'place' : 'places'} suggested`,
    helpedLine: (n) => `${n} became LINKA`,
    mySuggestions: 'My suggestions',
    supported: 'Places I’d like to go',
    became: 'Became LINKA places',
    noSuggestions: 'You have not suggested a place yet.',
    noSupports: 'Say “I’d like to go” to places in Community and they will gather here.',
    noBecame: 'When a place you suggested or supported becomes LINKA, it is kept here.',
    privateChip: 'Private · in review',
    suggestCta: 'Suggest a place',
    communityCta: 'Explore Community',
    settings: 'Settings',
  },
  placeCommunity: {
    title: 'From the community',
    fromCommunity: 'This place joined LINKA from a traveller’s suggestion.',
    history: (n) => `${n} travellers said they would like to go`,
    openStory: 'Its story',
    yours: 'Your journal',
    verifiedHere: (date) => `You touched here · ${date}`,
    pastHere: (n) => `${n} ${n === 1 ? 'memory' : 'memories'} in your journal`,
    openMoments: 'Open in Moments',
    addPast: 'Add a memory of this place',
  },
}

const ja: CommunityAppMessages = {
  hub: {
    eyebrow: 'LINKA コミュニティ',
    title: 'みんなが見つけた場所',
    lead: '旅人が「LINKAにしてほしい」と思った場所。最初の提案から、タッチポイントができるまでを見守れます。',
    foundTitle: '新しく見つかった場所',
    foundLead: 'コミュニティに公開されたばかりです。',
    wantTitle: '行ってみたい',
    wantLead: '旅人が「行ってみたい」と伝えた場所。投票ではなく、関心のしるしです。',
    journeyTitle: 'LINKAになるまで',
    journeyLead: 'LINKAが確かめ、その場所を守る人たちと相談し、タッチポイントを準備します。',
    becameTitle: 'LINKAになった場所',
    becameLead: '旅人の提案から、だれでもタッチできる場所に。',
    mapTitle: '地図で見る',
    suggestTitle: 'すてきな場所を知っていますか？',
    suggestLead: '旅する価値のある場所を、LINKAに教えてください。',
    suggestCta: '場所を提案する',
    seeAll: 'すべて見る',
    allTitle: 'すべての提案',
    filterAll: 'すべて',
    empty: 'まだ公開された提案はありません。LINKAが確認した提案から、ここに並びます。',
    emptyFilter: 'いまこの段階の場所はありません。',
    mapEntry: 'コミュニティ',
    mapEntrySecond: 'みんなが見つけた場所',
    back: 'コミュニティ',
    count: (n) => `${n}か所`,
  },
  stageShort: {
    suggested: '提案',
    support: 'みんなの応援',
    review: 'LINKA確認',
    local: '現地と相談',
    preparing: '準備中',
    published: 'LINKA Place',
  },
  act: {
    became: 'LINKAになりました ✓',
    frozen: (n) => `${n}人が「行ってみたい」と伝えました`,
    own: 'あなたの提案',
    ownHint: '「行ってみたい」はほかの旅人からの関心です。自分の提案には付けられません。',
    signIn: 'ログインして「行ってみたい」',
    signInHint: 'ログイン後、このページに戻ります。',
    rateLimited: '短い時間に続けて操作されました。少し時間をおいてお試しください。',
    closed: 'この場所はもう「行ってみたい」を受け付けていません。',
    failed: 'うまくいきませんでした。もう一度お試しください。',
    offline: 'オフラインのようです。接続してからお試しください。',
    share: 'シェア',
    copied: 'リンクをコピーしました',
    shareText: (name) => `${name} ー LINKAになるまで`,
  },
  detail: {
    reason: 'この場所をすすめる理由',
    photos: '写真',
    updates: 'LINKAから',
    journey: 'LINKAになるまで',
    progress: 'いまの段階',
    fromLinka: 'LINKA',
    notFound: 'この提案は公開されていません',
    notFoundBody: 'まだ確認中か、すでに公開を終えた提案です。',
    privateTitle: 'この提案はあなたにだけ見えています',
    privateBody: 'LINKAが確認しています。コミュニティに公開されると、下の公開用の文章が表示されます。',
    yourOriginal: 'あなたが書いたこと',
    publicVersion: '公開される文章',
    publicVersionHint: 'プライバシーのため、公開用の文章をLINKAが短くすることがあります。あなたの文章はそのまま保存されます。',
    withdraw: 'この提案を取り下げる',
    withdrawConfirm: '取り下げますか？確認も公開もされなくなります。',
    withdrawn: 'この提案は取り下げました。',
    closedStates: {
      declined: '今回はLINKAに加えないことになりました。提案してくださりありがとうございました。',
      duplicate: 'この場所はすでに提案されていて、そちらで進んでいます。',
      withdrawn: 'この提案は取り下げました。',
    },
    area: 'エリア',
  },
  suggest: {
    title: '場所を提案する',
    lead: 'LINKAのタッチポイントがあってほしい場所を教えてください。',
    points: [
      '提案は非公開ではじまり、あなたにだけ見えます。',
      'LINKAが確認し、コミュニティに公開することがあります。',
      '公開されると、旅人が「行ってみたい」と伝えられます。',
    ],
    privacy: 'ご自身やほかの人の個人情報（自宅の住所、電話番号、氏名など）は書かないでください。',
    nameLabel: '場所の名前',
    namePlaceholder: '例：北沢浮遊選鉱場跡',
    areaLabel: 'どこにありますか',
    areaPlaceholder: '町やエリアで大丈夫です（詳しい住所は不要）',
    pinLabel: '佐渡の地図に印をつける',
    pinHint: '佐渡の場所なら、任意で。印はLINKAだけが見ます。',
    pinClear: '印を消す',
    reasonLabel: 'なぜ行ってほしいですか',
    reasonHelp: '正直な言葉で、数行あれば十分です。',
    reasonPlaceholder: '特別なところ、見てほしいもの、おすすめの季節…',
    linkLabel: '参考になるリンク',
    photosLabel: 'あなたの写真',
    photosHelp: '写真はすべてLINKAが確認してから公開されます。位置情報は端末の中で取り除かれます。',
    attributionLabel: '公開されたときの表示',
    nickname: (name) => `ニックネーム · ${name}`,
    anonymous: '匿名 ·「ひとりの旅人」',
    required: '入力してください。',
    invalidLink: 'URLの形式ではないようです。',
    submit: 'LINKAに送る',
    submitting: '送信中…',
    uploading: (done, of) => `写真を送信中 · ${done} / ${of}`,
    photoFailed: '送れなかった写真があります。提案は保存されています。',
    retryPhotos: '写真をもう一度送る',
    doneTitle: 'ありがとうございます。LINKAに届きました。',
    doneBody: 'いまはあなただけに見える提案です。マイページの「あなたの貢献」から様子を見られます。',
    doneSteps: ['LINKAが確認します', 'コミュニティに公開されることがあります', '旅人が「行ってみたい」と伝えます', 'LINKAの場所になります'],
    seeMine: '自分の提案を見る',
    backToCommunity: 'コミュニティに戻る',
    another: 'もう一か所提案する',
    signInTitle: 'ログインすると場所を提案できます',
    signInBody: '提案はアカウントに保存され、その後の様子を見られます。',
  },
  diary: {
    subtitle: '旅のノート',
    add: '思い出を追加',
    empty: '旅のノートは、最初のページを待っています。',
    emptyTouch: '旅先でLINKAのタッチポイントにタッチするか、',
    emptyAdd: '以前の旅を書き残してみましょう。',
    verifiedBadge: 'LINKAでタッチ',
    pastBadge: '旅の記録',
    verifiedExplain: 'LINKAのタッチポイントで記録した訪問です。あなたの地図に色がつきます。',
    pastExplain: 'あなた自身の旅の記録です。同じように大切に残します。地図に色がつくのはLINKAのタッチだけです。',
    noDate: '日付なし',
    edit: '編集',
    delete: 'この思い出を削除',
    deleteConfirm: 'この思い出と写真を削除しますか？元に戻せません。',
    deleting: '削除中…',
    deleteFailed: '削除できませんでした。もう一度お試しください。',
    photosTitle: '写真',
    managePhotos: '写真',
    writeMemory: 'この日のことを書く',
    back: 'モーメント',
    photoOf: (n, of) => `${of}枚中${n}枚目`,
    openPlace: 'この場所について',
    notFound: 'この思い出はノートにありません。',
  },
  pastForm: {
    editTitle: '思い出を編集',
    searchPlaces: 'LINKAの場所を探す',
    noMatch: 'その名前のLINKAの場所はありません。下にご自身の言葉で書いてください。',
    chosen: '選択中',
    change: '変更',
    needWhere: '場所を選ぶか、どこだったかを書いてください。',
    datePlaceholder: '日付を選ぶ',
    clearDate: '日付なし',
    saving: '保存中…',
    saved: '旅のノートに保存しました。',
    failed: '保存できませんでした。もう一度お試しください。',
    uploading: (done, of) => `写真を追加中 · ${done} / ${of}`,
    photoFailed: '追加できなかった写真があります。',
    retry: 'もう一度',
    cancel: 'やめる',
    fromPhoto: '写真から',
  },
  layer: {
    label: '表示',
    verified: 'LINKA',
    memories: '思い出',
    all: 'すべて',
    pin: (place, date) => `思い出：${place}、${date}（旅の記録。LINKAのタッチではありません）`,
  },
  mine: {
    title: 'あなたの貢献',
    lead: 'あなたの旅と、LINKAに加わるのを手伝った場所。',
    travelled: 'ここを旅した',
    remembered: 'ここを覚えている',
    suggested: 'ここを提案した',
    helped: 'LINKAになるのを手伝った',
    travelledLine: (n) => `LINKAでタッチした場所 ${n}`,
    rememberedLine: (n) => `旅の記録 ${n}`,
    suggestedLine: (n) => `提案した場所 ${n}`,
    helpedLine: (n) => `LINKAになった場所 ${n}`,
    mySuggestions: 'わたしの提案',
    supported: '行ってみたい場所',
    became: 'LINKAになった場所',
    noSuggestions: 'まだ場所を提案していません。',
    noSupports: 'コミュニティで「行ってみたい」を付けた場所が、ここに集まります。',
    noBecame: 'あなたが提案・応援した場所がLINKAになると、ここに残ります。',
    privateChip: '非公開 · 確認中',
    suggestCta: '場所を提案する',
    communityCta: 'コミュニティを見る',
    settings: '設定',
  },
  placeCommunity: {
    title: 'コミュニティから',
    fromCommunity: 'この場所は、旅人の提案からLINKAになりました。',
    history: (n) => `${n}人が「行ってみたい」と伝えました`,
    openStory: 'その物語',
    yours: 'あなたの記録',
    verifiedHere: (date) => `LINKAでタッチ · ${date}`,
    pastHere: (n) => `旅の記録 ${n}`,
    openMoments: 'モーメントで開く',
    addPast: 'この場所の思い出を追加',
  },
}

const zhHans: CommunityAppMessages = {
  hub: {
    eyebrow: 'LINKA 社区',
    title: '大家发现的地方',
    lead: '旅行者希望 LINKA 开放的地方——从第一次推荐，到设置触点的每一步都能看到。',
    foundTitle: '新发现的地方',
    foundLead: '刚刚向社区公开。',
    wantTitle: '想去看看',
    wantLead: '旅行者表示想去的地方。这是兴趣，不是投票。',
    journeyTitle: '成为 LINKA 之前',
    journeyLead: 'LINKA 会实地确认，与守护这个地方的人沟通，并准备触点。',
    becameTitle: '已成为 LINKA 的地点',
    becameLead: '来自旅行者的推荐——现在每个人都可以触碰。',
    mapTitle: '在地图上看',
    suggestTitle: '知道一个好地方？',
    suggestLead: '把值得一去的地方告诉 LINKA。',
    suggestCta: '推荐一个地方',
    seeAll: '查看全部',
    allTitle: '全部推荐',
    filterAll: '全部',
    empty: '还没有公开的推荐。LINKA 审核后的推荐会出现在这里。',
    emptyFilter: '目前没有处于这个阶段的地点。',
    mapEntry: '社区',
    mapEntrySecond: '大家发现的地方',
    back: '社区',
    count: (n) => `${n} 个地点`,
  },
  stageShort: {
    suggested: '推荐',
    support: '大家的支持',
    review: 'LINKA 审核',
    local: '与当地沟通',
    preparing: '准备中',
    published: 'LINKA 地点',
  },
  act: {
    became: '已成为 LINKA 地点 ✓',
    frozen: (n) => `${n} 人表示想去看看`,
    own: '你的推荐',
    ownHint: '「想去看看」代表其他旅行者的兴趣，不能给自己的推荐。',
    signIn: '登录后表示想去看看',
    signInHint: '登录后会回到这一页。',
    rateLimited: '操作有点频繁，请稍后再试。',
    closed: '这个地点已不再接受「想去看看」。',
    failed: '没有成功，请重试。',
    offline: '似乎没有网络，请连接后重试。',
    share: '分享',
    copied: '已复制链接',
    shareText: (name) => `${name} ——成为 LINKA 之前`,
  },
  detail: {
    reason: '推荐这里的理由',
    photos: '照片',
    updates: '来自 LINKA',
    journey: '成为 LINKA 的历程',
    progress: '现在的阶段',
    fromLinka: 'LINKA',
    notFound: '这条推荐未公开',
    notFoundBody: '它可能仍在审核中，或已经不再公开。',
    privateTitle: '只有你能看到这条推荐',
    privateBody: 'LINKA 正在审核。向社区公开后，旅行者会看到下面的公开文字。',
    yourOriginal: '你写的内容',
    publicVersion: '公开显示的文字',
    publicVersionHint: '出于隐私考虑，LINKA 可能会精简公开文字。你的原文会原样保留。',
    withdraw: '撤回这条推荐',
    withdrawConfirm: '要撤回吗？它将不再被审核或显示。',
    withdrawn: '你已撤回这条推荐。',
    closedStates: {
      declined: 'LINKA 目前不会加入这个地点。感谢你的推荐。',
      duplicate: '已经有人推荐过这个地点，会在那条推荐中继续。',
      withdrawn: '你已撤回这条推荐。',
    },
    area: '区域',
  },
  suggest: {
    title: '推荐一个地方',
    lead: '告诉我们你希望设置 LINKA 触点的地方。',
    points: ['推荐一开始是私密的，只有你能看到。', 'LINKA 会审核，并可能向社区公开。', '公开后，旅行者可以表示想去看看。'],
    privacy: '请不要填写你或他人的个人信息（住址、电话号码、全名等）。',
    nameLabel: '地点名称',
    namePlaceholder: '例：北泽浮游选矿场遗址',
    areaLabel: '在哪里',
    areaPlaceholder: '城镇或区域即可，无需详细地址',
    pinLabel: '在佐渡地图上标出',
    pinHint: '如果在佐渡，可以选择标出。标记只有 LINKA 能看到。',
    pinClear: '清除标记',
    reasonLabel: '为什么值得一去',
    reasonHelp: '写几句真心话就好。',
    reasonPlaceholder: '特别之处、值得看的东西、最好的季节……',
    linkLabel: '相关链接',
    photosLabel: '你的照片',
    photosHelp: '所有照片都会先由 LINKA 审核再公开。位置信息会在你的手机上去除。',
    attributionLabel: '公开时显示为',
    nickname: (name) => `我的昵称 · ${name}`,
    anonymous: '匿名 ·「一位旅行者」',
    required: '请填写。',
    invalidLink: '这看起来不像网址。',
    submit: '发送给 LINKA',
    submitting: '发送中……',
    uploading: (done, of) => `正在发送照片 · ${done} / ${of}`,
    photoFailed: '有照片没有发送成功。推荐已经保存。',
    retryPhotos: '重新发送照片',
    doneTitle: '谢谢——LINKA 已收到。',
    doneBody: '现在只有你能看到这条推荐。可以在「我的 → 你的贡献」中查看进展。',
    doneSteps: ['LINKA 审核', '可能向社区公开', '旅行者表示想去看看', '成为 LINKA 地点'],
    seeMine: '查看我的推荐',
    backToCommunity: '返回社区',
    another: '再推荐一个地方',
    signInTitle: '登录后即可推荐地点',
    signInBody: '推荐会保存在你的账号中，方便查看进展。',
  },
  diary: {
    subtitle: '旅行笔记',
    add: '添加回忆',
    empty: '你的旅行笔记还在等待第一页。',
    emptyTouch: '在旅途中触碰 LINKA 触点，',
    emptyAdd: '或者写下以前的一段旅行。',
    verifiedBadge: '用 LINKA 触碰',
    pastBadge: '旅行记录',
    verifiedExplain: '由 LINKA 触点记录的到访。它会为你的地图着色。',
    pastExplain: '你自己的旅行记录，同样被珍惜地保存。只有 LINKA 触碰会为地图着色。',
    noDate: '无日期',
    edit: '编辑',
    delete: '删除这段回忆',
    deleteConfirm: '删除这段回忆和照片吗？无法恢复。',
    deleting: '删除中……',
    deleteFailed: '删除失败，请重试。',
    photosTitle: '照片',
    managePhotos: '照片',
    writeMemory: '写下这一天',
    back: '瞬间',
    photoOf: (n, of) => `第 ${n} 张，共 ${of} 张`,
    openPlace: '关于这个地点',
    notFound: '这段回忆不在你的笔记中。',
  },
  pastForm: {
    editTitle: '编辑回忆',
    searchPlaces: '搜索 LINKA 地点',
    noMatch: '没有这个名字的 LINKA 地点——请在下方用自己的话写。',
    chosen: '已选择',
    change: '更改',
    needWhere: '请选择一个地点，或写下是在哪里。',
    datePlaceholder: '选择日期',
    clearDate: '无日期',
    saving: '保存中……',
    saved: '已保存到你的旅行笔记。',
    failed: '保存失败，请重试。',
    uploading: (done, of) => `正在添加照片 · ${done} / ${of}`,
    photoFailed: '有照片没有添加成功。',
    retry: '重试',
    cancel: '取消',
    fromPhoto: '来自照片',
  },
  layer: {
    label: '显示',
    verified: 'LINKA',
    memories: '回忆',
    all: '全部',
    pin: (place, date) => `回忆：${place}，${date}（旅行记录，不是 LINKA 触碰）`,
  },
  mine: {
    title: '你的贡献',
    lead: '你的旅程，以及你帮助加入 LINKA 的地方。',
    travelled: '我来过这里',
    remembered: '我记得这里',
    suggested: '我推荐了这里',
    helped: '我帮助它成为 LINKA',
    travelledLine: (n) => `用 LINKA 触碰的地点 ${n}`,
    rememberedLine: (n) => `旅行记录 ${n}`,
    suggestedLine: (n) => `推荐的地点 ${n}`,
    helpedLine: (n) => `成为 LINKA 的地点 ${n}`,
    mySuggestions: '我的推荐',
    supported: '我想去的地方',
    became: '已成为 LINKA 的地点',
    noSuggestions: '你还没有推荐过地点。',
    noSupports: '在社区里表示「想去看看」的地点会汇集在这里。',
    noBecame: '你推荐或支持的地点成为 LINKA 后，会保留在这里。',
    privateChip: '私密 · 审核中',
    suggestCta: '推荐一个地方',
    communityCta: '浏览社区',
    settings: '设置',
  },
  placeCommunity: {
    title: '来自社区',
    fromCommunity: '这个地点来自一位旅行者的推荐。',
    history: (n) => `${n} 位旅行者表示想去看看`,
    openStory: '它的故事',
    yours: '你的记录',
    verifiedHere: (date) => `用 LINKA 触碰 · ${date}`,
    pastHere: (n) => `旅行记录 ${n}`,
    openMoments: '在「瞬间」中打开',
    addPast: '添加这个地点的回忆',
  },
}

export const COMMUNITY_APP_MESSAGES: Record<Locale, CommunityAppMessages> = { en, ja, 'zh-Hans': zhHans }
