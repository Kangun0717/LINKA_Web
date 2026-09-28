import type { Locale } from '@/lib/i18n/locale'

/**
 * The words of the journey: the NFC landing, the Place Sheet, memories and
 * moods, Moments, Me, Suggest a Place and Safety — in each language.
 * Merged into `Messages` (see messages.ts).
 */

export const MOODS = ['joyful', 'calm', 'surprised', 'moved', 'learned', 'special'] as const
export type Mood = (typeof MOODS)[number]

export const MOOD_EMOJI: Record<Mood, string> = {
  joyful: '😊',
  calm: '😌',
  surprised: '😮',
  moved: '🥹',
  learned: '🤔',
  special: '✨',
}

export type SuggestionStatus =
  | 'submitted'
  | 'under_review'
  | 'community_interest'
  | 'contacting_place'
  | 'added'
  | 'not_proceeding'

export type SafetyKind =
  | 'disaster_info'
  | 'alerts'
  | 'hazard_map'
  | 'evacuation'
  | 'weather_warnings'
  | 'multilingual'
  | 'emergency_contact'

export type JourneyMessages = {
  nav: { map: string; moments: string; me: string }
  regions: { japan: string; sado: string }
  landing: {
    detected: string
    startTitle: string
    startBody: string
    startAction: string
    exploreTitle: string
    exploreBody: string
    exploreAction: string
    haveAccount: string
    logIn: string
    infoOnly: string
    back: string
    benefits: readonly string[]
    exploreMap: string
  }
  sheet: {
    visited: string
    notVisited: string
    visitorsToday: (count: number) => string
    explore: (region: string) => string
    progress: (visited: number, total: number) => string
    events: string
    fees: string
    photoCredit: string
    otherPlaces: string
  }
  safety: {
    title: string
    intro: string
    official: string
    kinds: Record<SafetyKind, string>
    call: (phone: string) => string
    languages: (list: string) => string
    scopePlace: string
    scopeRegion: (region: string) => string
    scopeNational: string
    liveNote: string
    loadFailed: string
  }
  memory: {
    feelingQuestion: string
    moods: Record<Mood, string>
    prompts: readonly string[]
    placeholder: string
    addPhoto: string
    uploading: string
    uploadFailed: string
    removePhoto: string
    save: string
    saving: string
    saved: string
    failed: string
    private: string
    photoAlt: (place: string) => string
    closePhoto: string
    moodNotSaved: string
    retryPhoto: string
  }
  gate: {
    title: string
    benefits: readonly string[]
    create: string
    signIn: string
  }
  loadFailed: string
  retry: string
  moments: {
    title: string
    empty: string
    emptyAction: string
    noMemoryYet: string
    addMemory: string
    test: string
  }
  me: {
    title: string
    places: string
    regions: string
    memories: string
    photos: string
    journey: string
    journeyEmpty: string
    myMemories: string
    seeMoments: string
    suggestions: string
    suggestionsEmpty: string
    suggest: string
    account: string
    language: string
    profile: string
    signOut: string
  }
  suggest: {
    title: string
    intro: string
    name: string
    namePlaceholder: string
    area: string
    areaPlaceholder: string
    reason: string
    reasonPlaceholder: string
    link: string
    linkPlaceholder: string
    optional: string
    submit: string
    submitting: string
    thanks: string
    thanksBody: string
    done: string
    failed: string
    required: string
    invalidLink: string
    status: Record<SuggestionStatus, string>
  }
}

const en: JourneyMessages = {
  nav: { map: 'Map', moments: 'Moments', me: 'Me' },
  regions: { japan: 'Japan', sado: 'Sado' },
  landing: {
    detected: 'LINKA Touch Point detected',
    startTitle: 'Save this journey',
    startBody: 'Mark the places you visit on your own map, and keep your photos, feelings and memories as a travel record only you can see.',
    startAction: 'Save this journey',
    exploreTitle: 'Just explore this time',
    exploreBody: 'Read about this place, its opening hours, official information and safety resources. No account needed — and nothing is recorded.',
    exploreAction: 'See the information',
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    infoOnly: 'Viewing information only — this is not a check-in.',
    back: 'Back',
    benefits: ['Check in here', 'Light up your personal map', 'Save your mood, note and photos', 'Build your own travel journal', 'See your journey later in Moments and Me'],
    exploreMap: 'Explore LINKA places on the map',
  },
  sheet: {
    visited: 'Visited',
    notVisited: 'Not visited yet',
    visitorsToday: (count) => `${count} people touched LINKA here today`,
    explore: (region) => `Exploring ${region}`,
    progress: (visited, total) => `${visited} / ${total} places`,
    events: 'Happening here',
    fees: 'Fees',
    photoCredit: 'Photo',
    otherPlaces: 'More LINKA places nearby',
  },
  safety: {
    title: 'Safety',
    intro: 'Official disaster and safety information. LINKA only links to the authorities that publish it.',
    official: 'Official information',
    kinds: {
      disaster_info: 'Disaster information',
      alerts: 'Evacuation & alerts',
      hazard_map: 'Hazard maps',
      evacuation: 'Evacuation sites',
      weather_warnings: 'Weather warnings',
      multilingual: 'In other languages',
      emergency_contact: 'Emergency numbers',
    },
    call: (phone) => `Call ${phone}`,
    languages: (list) => `Available in: ${list}`,
    scopePlace: 'For this area',
    scopeRegion: (region) => `${region}-wide`,
    scopeNational: 'Nationwide & emergency numbers',
    liveNote: 'LINKA does not show live warning status. Open the official links for current information.',
    loadFailed: 'Official safety information could not be loaded. Please try again.',
  },
  memory: {
    feelingQuestion: 'How did it feel to be here today?',
    moods: { joyful: 'Joyful', calm: 'Soothed', surprised: 'Surprised', moved: 'Moved', learned: 'Learned something', special: 'Special' },
    prompts: ['What stayed with you most?', 'What did you discover here today?', 'Who were you with?', 'A word for your future self?'],
    placeholder: 'A line or two is enough.',
    addPhoto: 'Add a photo',
    uploading: 'Uploading…',
    uploadFailed: 'The photo could not be uploaded. Try again.',
    removePhoto: 'Remove photo',
    save: 'Save memory',
    saving: 'Saving…',
    saved: 'Saved to your Moments.',
    failed: 'We could not save it. Please try again.',
    private: 'Only you can see this.',
    photoAlt: (place) => `Your photo at ${place}`,
    closePhoto: 'Close photo',
    moodNotSaved: 'Your note and photos are saved. The mood could not be saved yet.',
    retryPhoto: 'Try again',
  },
  gate: {
    title: 'Sign in to keep your journey',
    benefits: ['Check in at LINKA Touch Points', 'Light up your own map', 'Save moods, notes and photos', 'Build your travel journal in Moments and Me'],
    create: 'Create account',
    signIn: 'Sign in',
  },
  loadFailed: 'This could not be loaded.',
  retry: 'Try again',
  moments: {
    title: 'Moments',
    empty: 'Your moments begin with your first Touch.',
    emptyAction: 'Open My World',
    noMemoryYet: 'No memory written yet.',
    addMemory: 'Add a memory',
    test: 'Test Touch',
  },
  me: {
    title: 'Me',
    places: 'Places',
    regions: 'Regions',
    memories: 'Memories',
    photos: 'Photos',
    journey: 'My journey',
    journeyEmpty: 'Places you touch will gather here.',
    myMemories: 'My memories',
    seeMoments: 'See all moments',
    suggestions: 'My suggestions',
    suggestionsEmpty: 'Know a place that belongs on LINKA?',
    suggest: '+ Suggest a place',
    account: 'Account',
    language: 'Language',
    profile: 'Profile',
    signOut: 'Sign out',
  },
  suggest: {
    title: 'Suggest a place',
    intro: 'Tell us about a place you love. Every suggestion is read by the LINKA team — it is never published automatically.',
    name: 'Place name',
    namePlaceholder: 'e.g. Kitazawa Flotation Plant ruins',
    area: 'Where is it?',
    areaPlaceholder: 'Town, area or address',
    reason: 'Why do you recommend it?',
    reasonPlaceholder: 'What makes it special?',
    link: 'Link',
    linkPlaceholder: 'https://',
    optional: 'optional',
    submit: 'Send suggestion',
    submitting: 'Sending…',
    thanks: 'Thank you — we’ll take a look :)))',
    thanksBody: 'You can follow it under Me → My suggestions.',
    done: 'Done',
    failed: 'It could not be sent. Please try again.',
    required: 'Please fill this in.',
    invalidLink: 'That link does not look right.',
    status: {
      submitted: 'Submitted',
      under_review: 'Under review',
      community_interest: 'Community interest',
      contacting_place: 'Contacting the place',
      added: 'Added to LINKA',
      not_proceeding: 'Not proceeding',
    },
  },
}

const ja: JourneyMessages = {
  nav: { map: 'マップ', moments: 'モーメント', me: 'マイページ' },
  regions: { japan: 'JAPAN', sado: 'SADO' },
  landing: {
    detected: 'LINKAタッチポイントを検出しました',
    startTitle: '旅を記録する',
    startBody: '訪れた場所を地図に残して、写真・気分・思い出を、あなただけの旅の記録に。',
    startAction: '旅を記録する',
    exploreTitle: '今回は情報だけ見る',
    exploreBody: 'この場所の紹介、営業時間、公式情報、防災情報を見られます。アカウントは不要で、記録は残りません。',
    exploreAction: '情報を見る',
    haveAccount: 'アカウントをお持ちの方は',
    logIn: 'ログイン',
    infoOnly: '情報の閲覧のみです（チェックインではありません）。',
    back: '戻る',
    benefits: ['ここでチェックイン', 'あなたの地図に色がつく', '気分・メモ・写真を保存', 'あなただけの旅の記録に', 'あとでモーメントとマイページで振り返れる'],
    exploreMap: '地図でLINKAの場所を見る',
  },
  sheet: {
    visited: '訪れた場所',
    notVisited: 'まだ訪れていません',
    visitorsToday: (count) => `今日、${count}人がここでLINKAにタッチしました`,
    explore: (region) => `${region}を探索`,
    progress: (visited, total) => `${visited} / ${total} か所`,
    events: '開催中・予定',
    fees: '料金',
    photoCredit: '写真',
    otherPlaces: '近くのLINKAの場所',
  },
  safety: {
    title: '安全・防災',
    intro: '公式の防災・安全情報です。LINKAは発信元の公式サイトへご案内します。',
    official: '公式情報',
    kinds: {
      disaster_info: '防災情報',
      alerts: '避難情報・警報',
      hazard_map: 'ハザードマップ',
      evacuation: '避難場所',
      weather_warnings: '気象警報・注意報',
      multilingual: '多言語の情報',
      emergency_contact: '緊急連絡先',
    },
    call: (phone) => `${phone} に電話`,
    languages: (list) => `対応言語：${list}`,
    scopePlace: 'この地区の情報',
    scopeRegion: (region) => `${region}全体の情報`,
    scopeNational: '全国の情報・緊急連絡先',
    liveNote: 'LINKAは現在の警報状況を表示していません。最新情報は公式サイトでご確認ください。',
    loadFailed: '公式の防災情報を読み込めませんでした。もう一度お試しください。',
  },
  memory: {
    feelingQuestion: '今日、ここでどんな気持ちでしたか？',
    moods: { joyful: '楽しかった', calm: '癒された', surprised: '驚いた', moved: '感動した', learned: '学びがあった', special: '特別だった' },
    prompts: ['一番印象に残ったことは？', '今日ここで発見したことは？', '誰と来ましたか？', '未来の自分に一言残すなら？'],
    placeholder: '一言だけでも大丈夫です。',
    addPhoto: '写真を追加',
    uploading: 'アップロード中…',
    uploadFailed: '写真をアップロードできませんでした。もう一度お試しください。',
    removePhoto: '写真を削除',
    save: '思い出を保存',
    saving: '保存しています…',
    saved: 'モーメントに保存しました。',
    failed: '保存できませんでした。もう一度お試しください。',
    private: 'あなただけが見られます。',
    photoAlt: (place) => `${place}で撮った写真`,
    closePhoto: '写真を閉じる',
    moodNotSaved: 'メモと写真は保存しました。気分はまだ保存できませんでした。',
    retryPhoto: 'もう一度',
  },
  gate: {
    title: 'サインインして旅を記録しましょう',
    benefits: ['LINKAタッチポイントでチェックイン', 'あなたの地図に色がつく', '気分・メモ・写真を保存', 'モーメントとマイページで旅の記録に'],
    create: 'アカウントを作成',
    signIn: 'サインイン',
  },
  loadFailed: '読み込めませんでした。',
  retry: 'もう一度',
  moments: {
    title: 'モーメント',
    empty: '最初のタッチから、あなたのモーメントが始まります。',
    emptyAction: 'マイワールドを開く',
    noMemoryYet: 'まだ思い出が書かれていません。',
    addMemory: '思い出を書く',
    test: 'テストタッチ',
  },
  me: {
    title: 'マイページ',
    places: '訪れた場所',
    regions: '探索した地域',
    memories: '思い出',
    photos: '写真',
    journey: 'わたしの旅',
    journeyEmpty: 'タッチした場所がここに集まります。',
    myMemories: 'わたしの思い出',
    seeMoments: 'すべてのモーメントを見る',
    suggestions: 'わたしの提案',
    suggestionsEmpty: 'LINKAに載せたい場所はありますか？',
    suggest: '＋ 場所を提案する',
    account: 'アカウント',
    language: '言語',
    profile: 'プロフィール',
    signOut: 'サインアウト',
  },
  suggest: {
    title: '場所を提案する',
    intro: 'あなたの好きな場所を教えてください。提案はすべてLINKAチームが確認します。自動で公開されることはありません。',
    name: '場所の名前',
    namePlaceholder: '例：北沢浮遊選鉱場跡',
    area: '場所・エリア',
    areaPlaceholder: '町名・エリア・住所など',
    reason: 'おすすめの理由',
    reasonPlaceholder: 'どんなところが特別ですか？',
    link: 'リンク',
    linkPlaceholder: 'https://',
    optional: '任意',
    submit: '提案を送る',
    submitting: '送信しています…',
    thanks: 'ありがとうございます。確認しますね :)))',
    thanksBody: 'マイページの「わたしの提案」で状況を確認できます。',
    done: '閉じる',
    failed: '送信できませんでした。もう一度お試しください。',
    required: '入力してください。',
    invalidLink: 'リンクの形式が正しくありません。',
    status: {
      submitted: '受付済み',
      under_review: '確認中',
      community_interest: 'みんなの関心',
      contacting_place: '先方に連絡中',
      added: 'LINKAに追加',
      not_proceeding: '見送り',
    },
  },
}

const zhHans: JourneyMessages = {
  nav: { map: '地图', moments: '瞬间', me: '我的' },
  regions: { japan: '日本', sado: '佐渡' },
  landing: {
    detected: '已检测到 LINKA 触点',
    startTitle: '保存这次旅程',
    startBody: '把去过的地方留在你的地图上，把照片、心情和回忆，变成只属于你的旅行记录。',
    startAction: '保存这次旅程',
    exploreTitle: '这次只看看',
    exploreBody: '查看这个地方的介绍、开放时间、官方信息和防灾信息。无需账户，也不会留下任何记录。',
    exploreAction: '查看信息',
    haveAccount: '已有账户？',
    logIn: '登录',
    infoOnly: '仅浏览信息——这不是签到。',
    back: '返回',
    benefits: ['在这里签到', '点亮你的个人地图', '保存心情、文字和照片', '整理成你的旅行手账', '之后在「瞬间」和「我的」里回顾'],
    exploreMap: '在地图上查看 LINKA 地点',
  },
  sheet: {
    visited: '已到访',
    notVisited: '尚未到访',
    visitorsToday: (count) => `今天有 ${count} 人在这里触碰了 LINKA`,
    explore: (region) => `探索${region}`,
    progress: (visited, total) => `${visited} / ${total} 个地点`,
    events: '活动信息',
    fees: '费用',
    photoCredit: '照片',
    otherPlaces: '附近的 LINKA 地点',
  },
  safety: {
    title: '安全与防灾',
    intro: '官方的防灾与安全信息。LINKA 只为你链接到发布信息的官方机构。',
    official: '官方信息',
    kinds: {
      disaster_info: '防灾信息',
      alerts: '避难信息与警报',
      hazard_map: '灾害风险地图',
      evacuation: '避难场所',
      weather_warnings: '气象警报',
      multilingual: '多语言信息',
      emergency_contact: '紧急电话',
    },
    call: (phone) => `拨打 ${phone}`,
    languages: (list) => `支持语言：${list}`,
    scopePlace: '本地区信息',
    scopeRegion: (region) => `${region}全域信息`,
    scopeNational: '全国信息与紧急电话',
    liveNote: 'LINKA 不显示实时警报状态，最新信息请查看官方网站。',
    loadFailed: '无法加载官方防灾信息，请重试。',
  },
  memory: {
    feelingQuestion: '今天在这里，你是什么心情？',
    moods: { joyful: '开心', calm: '被治愈', surprised: '惊讶', moved: '感动', learned: '有所收获', special: '很特别' },
    prompts: ['印象最深的是什么？', '今天在这里发现了什么？', '和谁一起来的？', '想对未来的自己说一句什么？'],
    placeholder: '写一两句就好。',
    addPhoto: '添加照片',
    uploading: '正在上传…',
    uploadFailed: '照片上传失败，请重试。',
    removePhoto: '删除照片',
    save: '保存回忆',
    saving: '正在保存…',
    saved: '已保存到瞬间。',
    failed: '保存失败，请重试。',
    private: '仅你可见。',
    photoAlt: (place) => `你在${place}拍的照片`,
    closePhoto: '关闭照片',
    moodNotSaved: '文字和照片已保存，心情暂时无法保存。',
    retryPhoto: '重试',
  },
  gate: {
    title: '登录后记录你的旅程',
    benefits: ['在 LINKA 触点签到', '点亮属于你的地图', '保存心情、文字和照片', '在「瞬间」和「我的」里整理旅行记录'],
    create: '创建账户',
    signIn: '登录',
  },
  loadFailed: '加载失败。',
  retry: '重试',
  moments: {
    title: '瞬间',
    empty: '从第一次触碰开始，记录你的瞬间。',
    emptyAction: '打开我的世界',
    noMemoryYet: '还没有写下回忆。',
    addMemory: '写下回忆',
    test: '测试触碰',
  },
  me: {
    title: '我的',
    places: '到访地点',
    regions: '探索地区',
    memories: '回忆',
    photos: '照片',
    journey: '我的旅程',
    journeyEmpty: '你触碰过的地方会汇集在这里。',
    myMemories: '我的回忆',
    seeMoments: '查看全部瞬间',
    suggestions: '我的推荐',
    suggestionsEmpty: '有想推荐给 LINKA 的地方吗？',
    suggest: '＋ 推荐一个地方',
    account: '账户',
    language: '语言',
    profile: '个人资料',
    signOut: '退出登录',
  },
  suggest: {
    title: '推荐一个地方',
    intro: '告诉我们你喜欢的地方。每条推荐都会由 LINKA 团队查看，不会被自动发布。',
    name: '地点名称',
    namePlaceholder: '例：北泽浮游选矿场遗址',
    area: '在哪里？',
    areaPlaceholder: '城镇、地区或地址',
    reason: '推荐理由',
    reasonPlaceholder: '它特别在哪里？',
    link: '链接',
    linkPlaceholder: 'https://',
    optional: '可选',
    submit: '提交推荐',
    submitting: '正在提交…',
    thanks: '谢谢！我们会认真查看 :)))',
    thanksBody: '可以在「我的 → 我的推荐」中查看进度。',
    done: '完成',
    failed: '提交失败，请重试。',
    required: '请填写此项。',
    invalidLink: '链接格式不正确。',
    status: {
      submitted: '已提交',
      under_review: '审核中',
      community_interest: '社区关注',
      contacting_place: '联系地点中',
      added: '已加入 LINKA',
      not_proceeding: '暂不推进',
    },
  },
}

export const JOURNEY_MESSAGES: Record<Locale, JourneyMessages> = { en, ja, 'zh-Hans': zhHans }
