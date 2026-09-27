import { lazyWithPreload } from '@/lib/lazyWithPreload'

/**
 * My World is its own chunk — the globe's land alone is a fifth of the app —
 * so the first thing a phone downloads after an NFC touch is only what the
 * Door needs. The world is fetched while the Door plays (`App` preloads it
 * on idle), so by the time anyone reaches it, it is already there.
 */
export const HomeScreen = lazyWithPreload(() => import('@/features/home/screens/HomeScreen'))

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
  if (MyWorldPreviewScreen && pathname.startsWith('/preview/')) return MyWorldPreviewScreen.preload()
  if (pathname.startsWith('/home')) void HomeScreen.preload()
  return Promise.resolve()
}
