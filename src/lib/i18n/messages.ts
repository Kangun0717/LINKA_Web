import { JOURNEY_MESSAGES, type JourneyMessages } from '@/lib/i18n/journeyMessages'
import type { Locale } from '@/lib/i18n/locale'

/**
 * Every word My World and the Touch flow say, in each language.
 *
 * Place content (names, descriptions, hours) is not here — it comes from
 * `place_translations`. This is only the interface around it.
 */
export type Messages = BaseMessages & JourneyMessages

type BaseMessages = {
  world: {
    title: string
    /** Zero touches only — a whisper, not an empty state. */
    quiet: string
  }
  a11y: {
    world: string
    quietWorld: string
    place: (name: string, locality: string | null, date: string) => string
    enter: (name: string, nameLatin: string) => string
    backTo: (name: string) => string
    country: (name: string, nameLatin: string) => string
    localMap: (name: string, nameLatin: string) => string
    discoverable: (name: string, nameLatin: string) => string
    photo: (name: string) => string
  }
  place: {
    notVisited: string
    visitedOn: (date: string) => string
    visiting: string
    hours: string
    closed: string
    admission: string
    access: string
    asOf: (date: string) => string
    official: string
    sources: string
    /** Text is shown in another language because this one has none yet. */
    fallback: (shownIn: string) => string
    close: string
    activities: string
  }
  language: {
    label: string
    /** Other languages, named the way this language names them (英语, 英語). */
    names: Record<Locale, string>
  }
  touch: {
    opening: string
    unavailableTitle: string
    unavailableBody: string
    signInTitle: string
    signInBody: string
    signInAction: string
    checkingIn: string
    checkedIn: string
    alreadyCheckedIn: string
    checkedInOn: (date: string) => string
    testPoint: string
    failed: string
    retry: string
    seeWorld: string
    writeMemory: string
    memoryLabel: string
    memoryPlaceholder: string
    memoryPrivate: string
    saveMemory: string
    memorySaved: string
    memoryFailed: string
  }
}

const en: BaseMessages = {
  world: { title: 'My World', quiet: 'Your world appears where you touch.' },
  a11y: {
    world: 'Your world',
    quietWorld: 'Your world has not been revealed yet.',
    place: (name, locality, date) => [name, locality, `touched ${date}`].filter(Boolean).join(', '),
    enter: (name, nameLatin) => `Enter ${name}, ${nameLatin}`,
    backTo: (name) => `Back to ${name}`,
    country: (name, nameLatin) => `${name}, ${nameLatin}`,
    localMap: (name, nameLatin) => `${name}, ${nameLatin}, a hand-drawn map`,
    discoverable: (name, nameLatin) => `${name}, ${nameLatin}, not visited yet`,
    photo: (name) => `Your photo at ${name}`,
  },
  place: {
    notVisited: 'Not visited yet',
    visitedOn: (date) => `Touched ${date}`,
    visiting: 'Visiting',
    hours: 'Hours',
    closed: 'Closed',
    admission: 'Admission',
    access: 'Access',
    asOf: (date) => `As of ${date} — check the official site before you go`,
    official: 'Official website',
    sources: 'Sources',
    fallback: (shownIn) => `Shown in ${shownIn} — not yet written in English.`,
    close: 'Close',
    activities: 'Things to do',
  },
  language: { label: 'Language', names: { ja: 'Japanese', en: 'English', 'zh-Hans': 'Simplified Chinese' } },
  touch: {
    opening: 'Opening this place',
    unavailableTitle: 'This Touch Point is not available',
    unavailableBody: 'It may have been moved or retired.',
    signInTitle: 'Sign in to check in here',
    signInBody: 'Your visit is kept in your own world, and only you can see it.',
    signInAction: 'Sign in or create an account',
    checkingIn: 'Checking in…',
    checkedIn: 'You’ve checked in',
    alreadyCheckedIn: 'You’re already checked in here',
    checkedInOn: (date) => date,
    testPoint: 'Test Touch Point — not counted as a visit.',
    failed: 'We could not check you in. Please try again.',
    retry: 'Try again',
    seeWorld: 'See it in My World',
    writeMemory: 'Write a memory',
    memoryLabel: 'Your memory',
    memoryPlaceholder: 'What did you notice here?',
    memoryPrivate: 'Only you can see this.',
    saveMemory: 'Save',
    memorySaved: 'Saved.',
    memoryFailed: 'We could not save it. Please try again.',
  },
}

const ja: BaseMessages = {
  world: { title: 'マイワールド', quiet: 'タッチした場所から、あなたの世界が現れます。' },
  a11y: {
    world: 'あなたの世界',
    quietWorld: 'あなたの世界はまだ現れていません。',
    place: (name, locality, date) => [name, locality, `${date}にタッチ`].filter(Boolean).join('、'),
    enter: (name) => `${name}に入る`,
    backTo: (name) => `${name}に戻る`,
    country: (name) => name,
    localMap: (name) => `${name}の手描き地図`,
    discoverable: (name) => `${name}、まだ訪れていません`,
    photo: (name) => `${name}で撮った写真`,
  },
  place: {
    notVisited: 'まだ訪れていません',
    visitedOn: (date) => `${date}にタッチ`,
    visiting: '利用案内',
    hours: '開館時間',
    closed: '休館日',
    admission: '料金',
    access: 'アクセス',
    asOf: (date) => `${date}時点の情報です。お出かけ前に公式サイトをご確認ください。`,
    official: '公式サイト',
    sources: '出典',
    fallback: (shownIn) => `${shownIn}で表示しています（日本語の説明は準備中です）。`,
    close: '閉じる',
    activities: 'できること',
  },
  language: { label: '言語', names: { ja: '日本語', en: '英語', 'zh-Hans': '簡体字中国語' } },
  touch: {
    opening: 'この場所を開いています',
    unavailableTitle: 'このタッチポイントは利用できません',
    unavailableBody: '移設または終了した可能性があります。',
    signInTitle: 'サインインしてチェックイン',
    signInBody: '訪れた記録は、あなただけの世界に残ります。',
    signInAction: 'サインイン・アカウント作成',
    checkingIn: 'チェックインしています…',
    checkedIn: 'チェックインしました',
    alreadyCheckedIn: 'すでにチェックインしています',
    checkedInOn: (date) => date,
    testPoint: 'テスト用タッチポイント（訪問数には含まれません）',
    failed: 'チェックインできませんでした。もう一度お試しください。',
    retry: 'もう一度',
    seeWorld: 'マイワールドで見る',
    writeMemory: '思い出を書く',
    memoryLabel: 'あなたの思い出',
    memoryPlaceholder: 'ここで何を感じましたか？',
    memoryPrivate: 'あなただけが見られます。',
    saveMemory: '保存',
    memorySaved: '保存しました。',
    memoryFailed: '保存できませんでした。もう一度お試しください。',
  },
}

const zhHans: BaseMessages = {
  world: { title: '我的世界', quiet: '你触碰过的地方，会成为你的世界。' },
  a11y: {
    world: '你的世界',
    quietWorld: '你的世界还没有显现。',
    place: (name, locality, date) => [name, locality, `${date}触碰`].filter(Boolean).join('，'),
    enter: (name) => `进入${name}`,
    backTo: (name) => `返回${name}`,
    country: (name) => name,
    localMap: (name) => `${name}的手绘地图`,
    discoverable: (name) => `${name}，尚未到访`,
    photo: (name) => `你在${name}拍的照片`,
  },
  place: {
    notVisited: '尚未到访',
    visitedOn: (date) => `${date}触碰`,
    visiting: '参观信息',
    hours: '开放时间',
    closed: '休息日',
    admission: '费用',
    access: '交通',
    asOf: (date) => `信息截至${date}，出行前请以官方网站为准。`,
    official: '官方网站',
    sources: '信息来源',
    fallback: (shownIn) => `暂无简体中文介绍，以下以${shownIn}显示。`,
    close: '关闭',
    activities: '可以做的事',
  },
  language: { label: '语言', names: { ja: '日语', en: '英语', 'zh-Hans': '简体中文' } },
  touch: {
    opening: '正在打开这个地方',
    unavailableTitle: '此触点暂不可用',
    unavailableBody: '它可能已被移走或停用。',
    signInTitle: '登录后签到',
    signInBody: '到访记录只会留在属于你的世界里。',
    signInAction: '登录或创建账户',
    checkingIn: '正在签到…',
    checkedIn: '已签到',
    alreadyCheckedIn: '你已在此签到',
    checkedInOn: (date) => date,
    testPoint: '测试触点——不计入到访人数。',
    failed: '签到失败，请重试。',
    retry: '重试',
    seeWorld: '在我的世界中查看',
    writeMemory: '写下回忆',
    memoryLabel: '你的回忆',
    memoryPlaceholder: '在这里，你注意到了什么？',
    memoryPrivate: '仅你可见。',
    saveMemory: '保存',
    memorySaved: '已保存。',
    memoryFailed: '保存失败，请重试。',
  },
}

export const MESSAGES: Record<Locale, Messages> = {
  en: { ...en, ...JOURNEY_MESSAGES.en },
  ja: { ...ja, ...JOURNEY_MESSAGES.ja },
  'zh-Hans': { ...zhHans, ...JOURNEY_MESSAGES['zh-Hans'] },
}
