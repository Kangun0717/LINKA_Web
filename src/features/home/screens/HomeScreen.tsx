import MyWorld from '@/features/world/components/MyWorld'
import { useMyWorld } from '@/features/world/data/useMyWorld'
import AppShell from '@/layouts/AppShell'

/**
 * Home is My World.
 *
 * It reads only the user's own world. Preview scenarios never reach this
 * screen — they live behind the dev-only /preview/my-world route.
 */
export default function HomeScreen() {
  const world = useMyWorld()

  return (
    <AppShell>
      <MyWorld snapshot={world} />
    </AppShell>
  )
}
