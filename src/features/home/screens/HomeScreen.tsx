import Screen from '@/components/ui/Screen'
import TouchPointMark from '@/features/entry/components/TouchPointMark'
import AppShell from '@/layouts/AppShell'

/**
 * Temporary authenticated home.
 *
 * Sprint 2 replaces this entirely with the "Map is Home" experience, where the
 * places a user has physically touched become their world.
 */
export default function HomeScreen() {
  return (
    <AppShell>
      <Screen>
        <div className="flex flex-1 flex-col justify-center text-center">
          <TouchPointMark className="mx-auto text-sand-faint" />

          <h1 className="mt-10 text-4xl font-light tracking-[0.2em] text-sand sm:text-5xl">LINKA</h1>

          <p className="mt-10 text-lg text-sand">Your world is waiting.</p>

          <p className="mt-3 text-sm text-sand-muted">0 places discovered</p>
        </div>
      </Screen>
    </AppShell>
  )
}
