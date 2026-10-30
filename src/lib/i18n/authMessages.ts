import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Locale } from '@/lib/i18n/locale'

/**
 * The words of account creation, sign-in, recovery and onboarding.
 *
 * Kept apart from the journey's message table: these screens load with the
 * app's entry, and only these strings need to come with them.
 */
export type AuthMessages = {
  entry: { title: string; body: string; create: string; haveAccount: string }
  method: { label: string; email: string; phone: string }
  field: { email: string; phone: string; password: string; confirm: string }
  hint: { phoneOff: string; phoneCode: string; minLength: (n: number) => string }
  invalid: { email: string; phone: string; password: string; tooShort: (n: number) => string; mismatch: string }
  signUp: { title: string; body: string; send: string; already: string; signIn: string }
  verify: { title: (where: 'email' | 'phone') => string; sentTo: string; verify: string; resend: string; resendIn: (s: number) => string; newCode: string; differentEmail: string; differentNumber: string }
  signIn: { title: string; submit: string; forgot: string; newHere: string; create: string }
  oauth: { or: string; google: string; apple: string }
  forgot: { title: string; body: string; send: string; sentTitle: string; sentBody: (email: string) => string; back: string; phoneNote: string }
  password: { createTitle: string; createBody: string; resetTitle: string; resetBody: string; continue: string; save: string }
  reset: { expiredTitle: string; expiredBody: string; newLink: string }
  onboarding: {
    title: string
    body: string
    nickname: string
    nicknamePlaceholder: string
    nicknameRequired: string
    ageRange: string
    nationality: string
    notSpecified: string
    gender: string
    optional: string
    avatar: string
    submit: string
    sessionExpired: string
    saveFailed: string
    genders: Record<'female' | 'male' | 'non_binary' | 'prefer_not_to_say', string>
    under18: string
  }
  busy: string
  errors: {
    codeExpired: string
    codeInvalid: string
    otpDisabled: string
    rateLimited: string
    smsRateLimited: string
    invalidInput: string
    wrongPassword: string
    notConfirmed: string
    weakPassword: string
    samePassword: string
    phoneUnavailable: string
    reauth: string
    offline: string
    sendFailed: string
    signInFailed: string
    oauthFailed: string
    oauthUnavailable: string
    saveFailed: string
  }
}

const en: AuthMessages = {
  entry: { title: 'Welcome to LINKA', body: 'Your world, coloured by the places you actually touch.', create: 'Create account', haveAccount: 'I already have an account' },
  method: { label: 'Sign in with', email: 'Email', phone: 'Phone' },
  field: { email: 'Email', phone: 'Phone', password: 'Password', confirm: 'Confirm password' },
  hint: { phoneOff: 'Phone sign-in is not switched on for LINKA yet. Please use email for now.', phoneCode: 'Include your country code.', minLength: (n) => `At least ${n} characters.` },
  invalid: { email: 'Enter an email address we can reach you at.', phone: 'Enter your number with its country code, like +81 90 1234 5678.', password: 'Enter your password.', tooShort: (n) => `Use at least ${n} characters.`, mismatch: 'The two passwords do not match.' },
  signUp: { title: 'Create your account', body: 'We’ll send a six-digit code to confirm it’s yours. You’ll choose a password next.', send: 'Send code', already: 'Already have an account?', signIn: 'Sign in' },
  verify: { title: (where) => (where === 'email' ? 'Check your email' : 'Check your phone'), sentTo: 'We’ve sent a 6-digit code to', verify: 'Verify', resend: 'Resend code', resendIn: (s) => `Resend code in ${s}s`, newCode: 'A new code is on its way.', differentEmail: 'Use a different email', differentNumber: 'Use a different number' },
  signIn: { title: 'Welcome back', submit: 'Sign in', forgot: 'Forgot password?', newHere: 'New to LINKA?', create: 'Create account' },
  oauth: { or: 'or', google: 'Continue with Google', apple: 'Continue with Apple' },
  forgot: { title: 'Reset your password', body: 'We’ll email you a link to choose a new one.', send: 'Send link', sentTitle: 'Check your email', sentBody: (email) => `If there is a LINKA account for ${email}, a link to set a new password is on its way. Open it on this device.`, back: 'Back to sign in', phoneNote: 'Password recovery is by email. Recovery for phone-only accounts will arrive with phone sign-in.' },
  password: { createTitle: 'Choose a password', createBody: 'Next time, sign in with it — no code needed.', resetTitle: 'Set a new password', resetBody: 'You will use it the next time you sign in.', continue: 'Continue', save: 'Save password' },
  reset: { expiredTitle: 'This link has expired', expiredBody: 'Recovery links work once, for a short time. Ask for a new one and open it on this device.', newLink: 'Send a new link' },
  onboarding: {
    title: 'Create your profile', body: 'Just a nickname is enough. The rest is yours to share, or not.', nickname: 'Nickname', nicknamePlaceholder: 'What should we call you?', nicknameRequired: 'Choose a nickname so we know what to call you.',
    ageRange: 'Age range', nationality: 'Nationality', notSpecified: 'Not specified', gender: 'Gender', optional: 'optional', avatar: 'Avatar', submit: 'Start my journey',
    sessionExpired: 'Your session has expired. Please sign in again.', saveFailed: 'We could not save your profile. Please try again.',
    genders: { female: 'Female', male: 'Male', non_binary: 'Non-binary', prefer_not_to_say: 'Prefer not to say' }, under18: 'Under 18',
  },
  busy: 'Just a moment…',
  errors: {
    codeExpired: 'That code has expired. Request a new one below.', codeInvalid: 'That code is not valid. Check the six digits and try again.', otpDisabled: 'Email sign-in is not enabled for this project yet.',
    rateLimited: 'Too many attempts. Please wait a moment and try again.', smsRateLimited: 'Too many codes sent. Please wait a moment and try again.', invalidInput: 'That does not look right. Check it and try again.',
    wrongPassword: 'That password does not match. Try again, or reset it below.', notConfirmed: 'This account has not been confirmed yet. Create your account again to get a new code.',
    weakPassword: 'Choose a longer password — at least 8 characters, not easy to guess.', samePassword: 'That is already your password. Choose a new one.', phoneUnavailable: 'Phone sign-in is not available yet. Please use email.',
    reauth: 'For your security, please sign in again before changing your password.', offline: 'We could not reach LINKA. Check your connection and try again.',
    sendFailed: 'We could not send your code. Please try again.', signInFailed: 'We could not sign you in. Please try again.',
    oauthFailed: 'We could not continue with that account. Please try again.', oauthUnavailable: 'That sign-in method is not switched on for LINKA yet.',
    saveFailed: 'We could not save your password. Please try again.',
  },
}

const ja: AuthMessages = {
  entry: { title: 'LINKAへようこそ', body: '本当に触れた場所から、あなたの世界に色がつきます。', create: 'アカウントを作成', haveAccount: 'アカウントをお持ちの方' },
  method: { label: 'サインイン方法', email: 'メール', phone: '電話番号' },
  field: { email: 'メールアドレス', phone: '電話番号', password: 'パスワード', confirm: 'パスワード（確認）' },
  hint: { phoneOff: '電話番号でのサインインは現在準備中です。メールをご利用ください。', phoneCode: '国番号から入力してください。', minLength: (n) => `${n}文字以上` },
  invalid: { email: '連絡の取れるメールアドレスを入力してください。', phone: '国番号から入力してください（例：+81 90 1234 5678）。', password: 'パスワードを入力してください。', tooShort: (n) => `${n}文字以上にしてください。`, mismatch: 'パスワードが一致しません。' },
  signUp: { title: 'アカウントを作成', body: '6桁の確認コードをお送りします。次にパスワードを設定します。', send: 'コードを送る', already: 'アカウントをお持ちの方は', signIn: 'サインイン' },
  verify: { title: (where) => (where === 'email' ? 'メールを確認してください' : 'SMSを確認してください'), sentTo: '6桁のコードを送信しました：', verify: '確認する', resend: 'コードを再送する', resendIn: (s) => `${s}秒後に再送できます`, newCode: '新しいコードを送信しました。', differentEmail: '別のメールアドレスを使う', differentNumber: '別の電話番号を使う' },
  signIn: { title: 'おかえりなさい', submit: 'サインイン', forgot: 'パスワードをお忘れですか？', newHere: 'はじめての方は', create: 'アカウントを作成' },
  oauth: { or: 'または', google: 'Googleで続ける', apple: 'Appleで続ける' },
  forgot: { title: 'パスワードの再設定', body: '新しいパスワードを設定するためのリンクをメールでお送りします。', send: 'リンクを送る', sentTitle: 'メールを確認してください', sentBody: (email) => `${email} のLINKAアカウントがある場合、パスワード再設定のリンクをお送りしました。この端末で開いてください。`, back: 'サインインに戻る', phoneNote: 'パスワードの再設定はメールで行います。電話番号のみのアカウントの再設定は、電話番号サインインの提供開始後に対応します。' },
  password: { createTitle: 'パスワードを設定', createBody: '次回からはパスワードでサインインできます。コードは不要です。', resetTitle: '新しいパスワードを設定', resetBody: '次回のサインインから使います。', continue: '次へ', save: 'パスワードを保存' },
  reset: { expiredTitle: 'このリンクは有効期限が切れています', expiredBody: '再設定のリンクは一度だけ、短い時間のみ有効です。新しいリンクをこの端末で開いてください。', newLink: '新しいリンクを送る' },
  onboarding: {
    title: 'プロフィールを作成', body: 'ニックネームだけで大丈夫です。ほかの項目は任意です。', nickname: 'ニックネーム', nicknamePlaceholder: '呼び名を教えてください', nicknameRequired: 'ニックネームを入力してください。',
    ageRange: '年代', nationality: '国籍', notSpecified: '指定しない', gender: '性別', optional: '任意', avatar: 'アバター', submit: '旅をはじめる',
    sessionExpired: 'セッションの有効期限が切れました。もう一度サインインしてください。', saveFailed: 'プロフィールを保存できませんでした。もう一度お試しください。',
    genders: { female: '女性', male: '男性', non_binary: 'ノンバイナリー', prefer_not_to_say: '回答しない' }, under18: '18歳未満',
  },
  busy: '少々お待ちください…',
  errors: {
    codeExpired: 'コードの有効期限が切れました。下から再送してください。', codeInvalid: 'コードが正しくありません。6桁の数字をご確認ください。', otpDisabled: 'このプロジェクトではメールでのサインインが有効になっていません。',
    rateLimited: '試行回数が多すぎます。少し待ってからお試しください。', smsRateLimited: 'コードの送信回数が多すぎます。少し待ってからお試しください。', invalidInput: '入力内容をご確認ください。',
    wrongPassword: 'パスワードが一致しません。もう一度入力するか、下から再設定してください。', notConfirmed: 'このアカウントはまだ確認されていません。アカウント作成から新しいコードを受け取ってください。',
    weakPassword: '8文字以上の、推測されにくいパスワードにしてください。', samePassword: '現在と同じパスワードです。別のパスワードを設定してください。', phoneUnavailable: '電話番号でのサインインは現在ご利用いただけません。メールをご利用ください。',
    reauth: '安全のため、パスワード変更の前にもう一度サインインしてください。', offline: 'LINKAに接続できませんでした。通信環境をご確認ください。',
    sendFailed: 'コードを送信できませんでした。もう一度お試しください。', signInFailed: 'サインインできませんでした。もう一度お試しください。',
    oauthFailed: 'このアカウントでは続行できませんでした。もう一度お試しください。', oauthUnavailable: 'このサインイン方法はまだ有効になっていません。',
    saveFailed: 'パスワードを保存できませんでした。もう一度お試しください。',
  },
}

const zhHans: AuthMessages = {
  entry: { title: '欢迎来到 LINKA', body: '你真正触碰过的地方，会为你的世界染上颜色。', create: '创建账户', haveAccount: '我已有账户' },
  method: { label: '登录方式', email: '邮箱', phone: '手机号' },
  field: { email: '邮箱', phone: '手机号', password: '密码', confirm: '确认密码' },
  hint: { phoneOff: '手机号登录尚未开放，请先使用邮箱。', phoneCode: '请包含国家/地区代码。', minLength: (n) => `至少 ${n} 个字符` },
  invalid: { email: '请输入能联系到你的邮箱地址。', phone: '请输入带国家/地区代码的号码，例如 +81 90 1234 5678。', password: '请输入密码。', tooShort: (n) => `请至少使用 ${n} 个字符。`, mismatch: '两次输入的密码不一致。' },
  signUp: { title: '创建账户', body: '我们会发送一个6位验证码，确认这是你的邮箱。接下来设置密码。', send: '发送验证码', already: '已有账户？', signIn: '登录' },
  verify: { title: (where) => (where === 'email' ? '请查看邮箱' : '请查看短信'), sentTo: '6位验证码已发送至', verify: '验证', resend: '重新发送验证码', resendIn: (s) => `${s}秒后可重新发送`, newCode: '新的验证码已发送。', differentEmail: '使用其他邮箱', differentNumber: '使用其他号码' },
  signIn: { title: '欢迎回来', submit: '登录', forgot: '忘记密码？', newHere: '第一次使用 LINKA？', create: '创建账户' },
  oauth: { or: '或', google: '使用 Google 继续', apple: '使用 Apple 继续' },
  forgot: { title: '重置密码', body: '我们会通过邮件发送一个设置新密码的链接。', send: '发送链接', sentTitle: '请查看邮箱', sentBody: (email) => `如果 ${email} 已注册 LINKA，设置新密码的链接已发送。请在本设备上打开。`, back: '返回登录', phoneNote: '密码通过邮箱重置。仅绑定手机号的账户，将在手机号登录开放后支持重置。' },
  password: { createTitle: '设置密码', createBody: '下次用密码登录即可，无需验证码。', resetTitle: '设置新密码', resetBody: '下次登录时使用。', continue: '继续', save: '保存密码' },
  reset: { expiredTitle: '此链接已失效', expiredBody: '重置链接只能使用一次，且有效时间很短。请获取新链接并在本设备上打开。', newLink: '发送新链接' },
  onboarding: {
    title: '创建个人资料', body: '只需要一个昵称，其他内容可以不填。', nickname: '昵称', nicknamePlaceholder: '我们该怎么称呼你？', nicknameRequired: '请填写昵称。',
    ageRange: '年龄段', nationality: '国籍', notSpecified: '不指定', gender: '性别', optional: '可选', avatar: '头像', submit: '开始我的旅程',
    sessionExpired: '登录已过期，请重新登录。', saveFailed: '无法保存个人资料，请重试。',
    genders: { female: '女性', male: '男性', non_binary: '非二元', prefer_not_to_say: '不愿透露' }, under18: '18岁以下',
  },
  busy: '请稍候…',
  errors: {
    codeExpired: '验证码已过期，请在下方重新获取。', codeInvalid: '验证码不正确，请检查6位数字。', otpDisabled: '本项目尚未开启邮箱登录。',
    rateLimited: '尝试次数过多，请稍后再试。', smsRateLimited: '发送验证码次数过多，请稍后再试。', invalidInput: '输入内容似乎不正确，请检查后重试。',
    wrongPassword: '密码不正确。请重试，或在下方重置。', notConfirmed: '此账户尚未验证。请重新创建账户以获取新验证码。',
    weakPassword: '请设置至少8个字符、不易被猜到的密码。', samePassword: '这已是你当前的密码，请设置新密码。', phoneUnavailable: '手机号登录暂不可用，请使用邮箱。',
    reauth: '为了安全，修改密码前请重新登录。', offline: '无法连接 LINKA，请检查网络后重试。',
    sendFailed: '验证码发送失败，请重试。', signInFailed: '登录失败，请重试。',
    oauthFailed: '无法使用该账户继续，请重试。', oauthUnavailable: '该登录方式尚未开启。',
    saveFailed: '密码保存失败，请重试。',
  },
}

export const AUTH_MESSAGES: Record<Locale, AuthMessages> = { en, ja, 'zh-Hans': zhHans }

export function useAuthMessages(): AuthMessages {
  return AUTH_MESSAGES[useLocale().locale]
}
