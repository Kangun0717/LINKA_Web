import Screen from '@/components/ui/Screen'
import QuietWorld from '@/features/world/components/QuietWorld'
import AppShell from '@/layouts/AppShell'

/**
 * My World — the placeholder.
 *
 * Deliberately empty: no map, no places, no counts. The long-term concept is
 * that this world stays dark until the user physically touches somewhere, and
 * showing invented data here would undermine exactly the thing that makes
 * LINKA different.
 */
export default function HomeScreen() {
  return (
    <AppShell>
      <Screen>
        <div className="flex flex-1 flex-col justify-center text-center">
          <QuietWorld />

          <h1 className="mt-12 text-2xl font-light tracking-[0.18em] text-sand">My World</h1>

          <p className="mt-5 text-sm leading-relaxed text-sand-muted">
            Quiet for now.
            <br />
            Touch somewhere real, and it begins to light up.
          </p>
        </div>
      </Screen>
    </AppShell>
  )
}
