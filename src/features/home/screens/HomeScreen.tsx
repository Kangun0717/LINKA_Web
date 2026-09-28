import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import MyWorld from '@/features/world/components/MyWorld'
import { useMyWorld } from '@/features/world/data/useMyWorld'
import { useWorldPath } from '@/features/world/useWorldPath'
import AppShell from '@/layouts/AppShell'

/** Set by the Touch screen when it hands a fresh check-in over to My World. */
export type HomeArrivalState = { arrivalPlaceId?: string } | null

/**
 * Home is My World.
 *
 * It reads only the user's own world and LINKA's published places. Preview
 * scenarios never reach this screen — they live behind the dev-only
 * /preview/my-world route.
 *
 * The world waits for its data on its own paper rather than drawing empty and
 * re-framing: the globe is framed around the places a user has touched, so
 * drawing before they arrive would visibly move it.
 */
export default function HomeScreen() {
  const { snapshot, discovery, ready } = useMyWorld()
  const { path, enter, back } = useWorldPath()
  const { state } = useLocation() as { state: HomeArrivalState }
  // Read once: Back and Forward must not replay an arrival.
  const [arrivalPlaceId] = useState(() => state?.arrivalPlaceId ?? null)
  // Opened from another place's card ("More LINKA places nearby").
  const [params] = useSearchParams()
  const [openPlaceId] = useState(() => params.get('place'))

  return (
    <AppShell>
      {ready ? (
        <MyWorld
          snapshot={snapshot}
          discovery={discovery}
          arrivalPlaceId={arrivalPlaceId}
          openPlaceId={openPlaceId}
          path={path}
          onEnter={enter}
          onBack={back}
        />
      ) : (
        <div className="h-full bg-canvas" />
      )}
    </AppShell>
  )
}
