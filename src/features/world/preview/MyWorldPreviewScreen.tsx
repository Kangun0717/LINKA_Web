import { useSearchParams } from 'react-router-dom'

import MyWorld from '@/features/world/components/MyWorld'
import {
  DISCOVERY_PREVIEW,
  isPreviewState,
  WORLD_PREVIEWS,
} from '@/features/world/preview/worldPreviews'
import { useWorldPath } from '@/features/world/useWorldPath'
import AppShell from '@/layouts/AppShell'

/**
 * DEV PREVIEW ONLY — /preview/my-world?state=…&at=jp|jp/sado
 *
 *   state = zero | first | many | discover | photo | years
 *
 * The real My World screen fed with design scenarios, outside every auth
 * guard. Registered only in development builds, so it never ships. `at` is
 * the same URL state production uses, so entering and Back behave exactly as
 * they will for real.
 */
export default function MyWorldPreviewScreen() {
  const [params] = useSearchParams()
  const { path, enter, back } = useWorldPath()
  const requested = params.get('state')
  const state = isPreviewState(requested) ? requested : 'zero'
  const { snapshot, arrivalPlaceId } = WORLD_PREVIEWS[state]

  return (
    <AppShell>
      {/* Keyed by state so switching scenarios replays the arrival from rest. */}
      <MyWorld
        key={state}
        snapshot={snapshot}
        arrivalPlaceId={arrivalPlaceId}
        discovery={DISCOVERY_PREVIEW}
        path={path}
        onEnter={enter}
        onBack={back}
      />
    </AppShell>
  )
}
