import { lazyWithPreload } from '@/lib/lazyWithPreload'
import { getSupabase } from '@/lib/supabase'

/**
 * My World is its own chunk — the globe's land alone is a fifth of the app —
 * so the first thing a phone downloads after an NFC touch is only what the
 * Door needs. The world is fetched while the Door plays (`App` preloads it
 * on idle), so by the time anyone reaches it, it is already there.
 */
export const HomeScreen = lazyWithPreload(() => import('@/features/home/screens/HomeScreen'))

/**
 * The NFC Touch screen: only an NFC URL needs it, so the Door's own `/` never
 * downloads it. For `/t/…` the page starts fetching it next to the entry (see
 * the preload hint in vite.config.ts) and the first render waits for it, so
 * the tap never shows a blank fallback.
 */
export const TouchScreen = lazyWithPreload(() => import('@/features/touch/TouchScreen'))

/** The public Place page — what a shared link or a printed QR code opens. */
export const PlaceScreen = lazyWithPreload(() => import('@/features/places/PlaceScreen'))

const account = () => import('@/routes/accountScreens')
export const AuthEntryScreen = lazyWithPreload(() => account().then((m) => ({ default: m.AuthEntryScreen })))
export const SignUpScreen = lazyWithPreload(() => account().then((m) => ({ default: m.SignUpScreen })))
export const VerifyScreen = lazyWithPreload(() => account().then((m) => ({ default: m.VerifyScreen })))
export const SignInScreen = lazyWithPreload(() => account().then((m) => ({ default: m.SignInScreen })))
export const ForgotPasswordScreen = lazyWithPreload(() => account().then((m) => ({ default: m.ForgotPasswordScreen })))
export const ResetPasswordScreen = lazyWithPreload(() => account().then((m) => ({ default: m.ResetPasswordScreen })))
export const PasswordRoute = lazyWithPreload(() => account().then((m) => ({ default: m.PasswordRoute })))
export const OnboardingRoute = lazyWithPreload(() => account().then((m) => ({ default: m.OnboardingRoute })))
/** Fetch every account screen at once (they share one chunk). */
export const preloadAccount = () => AuthEntryScreen.preload()

/** The journal and the personal page — reached from the navigation, so fetched on idle with My World. */
export const MomentsScreen = lazyWithPreload(() => import('@/features/journey/MomentsScreen'))
export const MeScreen = lazyWithPreload(() => import('@/features/journey/MeScreen'))
export const MomentScreen = lazyWithPreload(() => import('@/features/journey/MomentScreen'))
/** A journal entry of the person's own (a past memory): added from Moments. */
export const PastMemoryScreen = lazyWithPreload(() => import('@/features/journey/PastMemoryScreen'))

/**
 * Community — reached from the map and from Me, never from the Door, so none
 * of it is fetched until someone is on the map (HomeScreen warms the landing
 * on idle) or opens a Community link directly.
 */
export const CommunityScreen = lazyWithPreload(() => import('@/features/community/screens/CommunityScreen'))
export const SuggestionsScreen = lazyWithPreload(() => import('@/features/community/screens/SuggestionsScreen'))
export const SuggestionScreen = lazyWithPreload(() => import('@/features/community/screens/SuggestionScreen'))
export const SuggestPlaceScreen = lazyWithPreload(() => import('@/features/community/screens/SuggestPlaceScreen'))

/**
 * DEV PREVIEW ONLY — the emergency-notice demonstration on a real place.
 * Absent from production builds, like the My World preview.
 */
export const EmergencyDemoScreen = import.meta.env.DEV
  ? lazyWithPreload(() => import('@/features/touch/preview/EmergencyDemoScreen'))
  : null

/**
 * DEV PREVIEW ONLY — Sprint 4C Community & Journal prototypes (/preview/4c/*),
 * sample data only. Absent from production builds.
 */
export const Preview4CScreen = import.meta.env.DEV
  ? lazyWithPreload(() => import('@/features/community/preview/Preview4C'))
  : null

/**
 * Dev-only design previews. `import.meta.env.DEV` is a build-time constant, so
 * in production this is `null`, the route below is never registered, and the
 * preview module and its scenarios are left out of the bundle entirely.
 */
export const MyWorldPreviewScreen = import.meta.env.DEV
  ? lazyWithPreload(() => import('@/features/world/preview/MyWorldPreviewScreen'))
  : null

/**
 * What the first route needs before it can draw, if anything.
 *
 * Opening My World directly starts its chunk at once rather than on idle. A
 * dev preview goes further and holds the first render until its chunk is
 * here: rendering first would show a fallback, and React then holds back the
 * real content for up to 300 ms so a fallback never flickers — which is most
 * of what made the preview slow to open.
 */
export function firstRouteReady(pathname: string): Promise<unknown> {
  // Everywhere but the Door, the first thing drawn depends on the session, so
  // the auth client starts downloading now rather than after the first render.
  // The Door draws without it and lets it arrive while the entrance plays.
  if (pathname !== '/') void getSupabase()
  // An account screen opened directly must not flash a fallback: wait for its chunk.
  if (pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) return preloadAccount()
  if (pathname.startsWith('/t/')) return TouchScreen.preload()
  if (pathname.startsWith('/place/')) return PlaceScreen.preload()
  if (MyWorldPreviewScreen && pathname.startsWith('/preview/')) return MyWorldPreviewScreen.preload()
  if (pathname.startsWith('/home')) HomeScreen.warm()
  if (pathname === '/moments/new' || pathname.endsWith('/edit')) PastMemoryScreen.warm()
  else if (pathname.startsWith('/moments/')) MomentScreen.warm()
  else if (pathname.startsWith('/moments')) MomentsScreen.warm()
  if (pathname.startsWith('/me')) MeScreen.warm()
  if (pathname === '/community') CommunityScreen.warm()
  else if (pathname === '/community/suggest') SuggestPlaceScreen.warm()
  else if (pathname.startsWith('/community/suggestions/')) SuggestionScreen.warm()
  else if (pathname.startsWith('/community/suggestions')) SuggestionsScreen.warm()
  return Promise.resolve()
}
