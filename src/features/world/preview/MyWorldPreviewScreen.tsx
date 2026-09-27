import { useSearchParams } from 'react-router-dom'

import MyWorld from '@/features/world/components/MyWorld'
import { isPreviewState, WORLD_PREVIEWS } from '@/features/world/preview/worldPreviews'
import AppShell from '@/layouts/AppShell'

/**
 * DEV PREVIEW ONLY — /preview/my-world?state=zero|first|many
 *
 * The real My World screen fed with design scenarios, outside every auth
 * guard. Registered only in development builds, so it never ships.
 */
export default function MyWorldPreviewScreen() {
  const [params] = useSearchParams()
  const requested = params.get('state')
  const state = isPreviewState(requested) ? requested : 'zero'
  const { snapshot, arrivalPlaceId } = WORLD_PREVIEWS[state]

  return (
    <AppShell>
      {/* Keyed by state so switching scenarios replays the arrival from rest. */}
      <MyWorld key={state} snapshot={snapshot} arrivalPlaceId={arrivalPlaceId} />
    </AppShell>
  )
}
